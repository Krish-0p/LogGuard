from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List

class Settings(BaseSettings):
    # Application
    app_name: str = "LogGuard API"
    app_version: str = "1.0.0"
    debug: bool = False
    secret_key: str = "change-me-in-production"
    
    # Kafka - Set to localhost for non-docker backend
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_group_id: str = "logguard-inference-service"
    kafka_input_topic: str = "processed-features"
    kafka_output_topic: str = "anomaly-events"
    
    # TimescaleDB - Standard postgres scheme (no +asyncpg for direct pool)
    timescale_url: str = "postgresql://logguard:logguard@localhost:5432/logguard"
    
    # PostgreSQL (app metadata) - Keep +asyncpg for SQLAlchemy
    postgres_url: str = "postgresql+asyncpg://logguard:logguard@localhost:5432/logguard_app"
    
    # Elasticsearch
    elasticsearch_hosts: List[str] = ["http://localhost:9200"]
    elasticsearch_index_prefix: str = "logguard-logs"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_feature_buffer_ttl: int = 3600  # 1 hour TTL for LSTM buffers
    
    # MLflow
    mlflow_tracking_uri: str = "http://localhost:5000"
    isolation_forest_model_name: str = "logguard-isolation-forest"
    lstm_model_name: str = "logguard-lstm-autoencoder"
    model_stage: str = "Production"
    
    # LSTM Inference Config
    lstm_sequence_length: int = 30
    
    # Scoring
    if_weight: float = 0.4
    lstm_weight: float = 0.6
    final_anomaly_threshold: float = 0.70
    
    # Alerting
    alert_cooldown_minutes: int = 15
    incident_correlation_window_seconds: int = 90
    incident_min_hosts: int = 3

    # Pydantic Configuration to allow 'model_' prefix
    model_config = {
        "protected_namespaces": (),
        "env_file": ".env",
        "case_sensitive": False
    }

@lru_cache()
def get_settings() -> Settings:
    return Settings()