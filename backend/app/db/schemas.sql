-- ─── TimescaleDB: Anomaly Scores (Time-Series) ─────────────────────────────

CREATE TABLE IF NOT EXISTS anomaly_scores (
    id              BIGSERIAL,
    scored_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    host            TEXT            NOT NULL,
    tenant_id       TEXT            NOT NULL,
    final_score     FLOAT           NOT NULL,
    if_score        FLOAT           NOT NULL,
    lstm_score      FLOAT           NOT NULL,
    is_anomaly      BOOLEAN         NOT NULL DEFAULT FALSE,
    anomaly_type    TEXT,
    log_volume      INT,
    error_rate      FLOAT,
    feature_window_start  TIMESTAMPTZ,
    feature_window_end    TIMESTAMPTZ,
    log_text              TEXT,
    log_problem           TEXT,
    raw_feature_vector    JSONB,
    
    PRIMARY KEY (id, scored_at)
);

-- Convert to TimescaleDB hypertable (partitioned by time)
SELECT create_hypertable('anomaly_scores', 'scored_at', if_not_exists => TRUE);

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_anomaly_host_time
    ON anomaly_scores (tenant_id, host, scored_at DESC);

CREATE INDEX IF NOT EXISTS idx_anomaly_is_anomaly
    ON anomaly_scores (tenant_id, is_anomaly, scored_at DESC)
    WHERE is_anomaly = TRUE;

-- Continuous aggregate: 5-minute anomaly summary per host
CREATE MATERIALIZED VIEW IF NOT EXISTS anomaly_5min_summary
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('5 minutes', scored_at) AS bucket,
    tenant_id,
    host,
    AVG(final_score)    AS avg_score,
    MAX(final_score)    AS max_score,
    COUNT(*)            AS window_count,
    SUM(CASE WHEN is_anomaly THEN 1 ELSE 0 END) AS anomaly_count
FROM anomaly_scores
GROUP BY bucket, tenant_id, host
WITH NO DATA;

-- Auto-refresh the continuous aggregate
SELECT add_continuous_aggregate_policy('anomaly_5min_summary',
    start_offset => INTERVAL '1 hour',
    end_offset   => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute'
);

-- Data retention: keep raw scores for 30 days, drop older
SELECT add_retention_policy('anomaly_scores', INTERVAL '30 days');


-- ─── PostgreSQL: Application Metadata ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT UNIQUE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    plan_tier   TEXT DEFAULT 'free'
);

CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email       TEXT UNIQUE NOT NULL,
    role        TEXT NOT NULL DEFAULT 'viewer'  -- viewer, analyst, admin
                    CHECK (role IN ('viewer', 'analyst', 'admin')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    last_login  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS alert_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            TEXT NOT NULL,
    description     TEXT,
    host_pattern    TEXT,               -- glob pattern: "web-*" or NULL for all
    score_threshold FLOAT NOT NULL DEFAULT 0.70,
    severity        TEXT DEFAULT 'high' CHECK (severity IN ('low','medium','high','critical')),
    notifier_type   TEXT NOT NULL,      -- slack, pagerduty, email
    notifier_config JSONB NOT NULL,     -- webhook URL, API key, etc.
    cooldown_minutes INT DEFAULT 15,    -- Min time between repeated alerts
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS anomaly_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    anomaly_id      BIGINT NOT NULL,    -- References anomaly_scores.id
    scored_at       TIMESTAMPTZ NOT NULL,
    host            TEXT NOT NULL,
    feedback_type   TEXT NOT NULL CHECK (feedback_type IN ('true_positive', 'false_positive')),
    submitted_by    UUID REFERENCES users(id),
    notes           TEXT,               -- Optional analyst comments
    feature_vector  JSONB,              -- Snapshot of the feature vector
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_feedback_tenant_date ON anomaly_feedback (tenant_id, created_at);

CREATE TABLE IF NOT EXISTS incidents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    started_at      TIMESTAMPTZ NOT NULL,
    resolved_at     TIMESTAMPTZ,
    affected_hosts  TEXT[] NOT NULL,
    max_severity    TEXT,
    anomaly_count   INT DEFAULT 0,
    status          TEXT DEFAULT 'open' CHECK (status IN ('open','investigating','resolved')),
    rca_summary     TEXT,               -- Auto-generated RCA text
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
