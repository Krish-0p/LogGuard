import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
import numpy as np

from app.config import get_settings
from app.inference.model_loader import ModelRegistry
from app.inference.feature_buffer import LSTMFeatureBuffer
from app.inference.scorer import HybridScorer
from app.db.timescale import save_anomaly_score
from app.alerting.engine import AlertingEngine
from app.api.v1.websocket import broadcast_anomaly

logger = logging.getLogger("logguard.consumer")

class InferenceConsumer:
    """
    Core of LogGuard real-time inference.
    
    Lifecycle:
      1. Consume feature vector from Kafka (processed-features)
      2. Retrieve LSTM context from Redis buffer
      3. Run IF model (point anomaly)
      4. Run LSTM model (sequence anomaly)
      5. Compute hybrid score
      6. If anomaly: persist to TimescaleDB + alert + WebSocket broadcast
      7. Update Redis buffer with new vector
      8. Publish anomaly event to Kafka (anomaly-events)
    """
    
    def __init__(self, settings):
        self.settings  = settings
        self.registry  = ModelRegistry(settings)
        self.buffer    = LSTMFeatureBuffer(settings)
        self.scorer    = HybridScorer(settings)
        self.alerting  = AlertingEngine(settings)
        self.models_ready = False
        
        self._consumer: Optional[AIOKafkaConsumer] = None
        self._producer: Optional[AIOKafkaProducer] = None
    
    async def initialize_models(self):
        """Called at startup — loads models from MLflow."""
        await self.registry.load()
        self.models_ready = True
        logger.info("✅ Models ready for inference.")
    
    async def run(self):
        """
        Main consumer loop. Runs forever as a background asyncio task.
        """
        
        self._consumer = AIOKafkaConsumer(
            self.settings.kafka_input_topic,
            bootstrap_servers=self.settings.kafka_bootstrap_servers,
            group_id=self.settings.kafka_group_id,
            value_deserializer=lambda v: json.loads(v.decode("utf-8")),
            auto_offset_reset="latest",
            enable_auto_commit=False,      # Manual commit for exactly-once
            max_poll_records=50            # Batch up to 50 records per poll
        )
        
        self._producer = AIOKafkaProducer(
            bootstrap_servers=self.settings.kafka_bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            acks="all",
            enable_idempotence=True
        )
        
        await self._consumer.start()
        await self._producer.start()
        
        logger.info(f"🎧 Listening on Kafka topic: {self.settings.kafka_input_topic}")
        
        try:
            async for message in self._consumer:
                try:
                    await self._process_message(message.value)
                    await self._consumer.commit()  # Commit after successful processing
                except Exception as e:
                    logger.error(f"Processing error for message offset {message.offset}: {e}", exc_info=True)
                    # Don't commit — message will be reprocessed
                    await asyncio.sleep(0.1)
        
        except asyncio.CancelledError:
            logger.info("Consumer task cancelled — shutting down cleanly.")
        
        finally:
            await self._consumer.stop()
            await self._producer.stop()
    
    async def _process_message(self, feature_event: dict):
        """Process a single feature vector event."""
        
        start_time = asyncio.get_event_loop().time()
        
        host      = feature_event["host"]
        tenant_id = feature_event["tenant_id"]
        
        # ── Step 1: Extract flat feature vector (for IF) ──────
        feature_vector = np.array(self._extract_flat_features(feature_event), dtype=np.float32)
        
        # ── Step 2: Get LSTM sequence from Redis ──────────────
        sequence = await self.buffer.get_sequence(
            host=host,
            tenant_id=tenant_id,
            new_vector=feature_vector,
            seq_len=self.settings.lstm_sequence_length
        )
        
        # ── Step 3: Run Isolation Forest ──────────────────────
        if_raw_score = self.registry.predict_isolation_forest(feature_vector)
        
        # ── Step 4: Run LSTM (only if we have enough history) ─
        lstm_recon_error = 0.0
        if sequence is not None:
            lstm_recon_error = self.registry.predict_lstm(
                sequence.reshape(1, *sequence.shape)
            )
        
        # ── Step 5: Hybrid scoring ────────────────────────────
        final_score, is_anomaly, breakdown = self.scorer.score(
            if_raw_score=if_raw_score,
            lstm_recon_error=lstm_recon_error
        )
        
        # ── Step 6: Persist to TimescaleDB ───────────────────
        anomaly_record = {
            "scored_at": datetime.now(timezone.utc).isoformat(),
            "host": host,
            "tenant_id": tenant_id,
            "final_score": final_score,
            "if_score": breakdown["if_normalized"],
            "lstm_score": breakdown["lstm_normalized"],
            "is_anomaly": is_anomaly,
            "log_volume": feature_event.get("log_volume"),
            "error_rate": feature_event.get("error_rate"),
            "feature_window_start": feature_event.get("window_start"),
            "feature_window_end": feature_event.get("window_end"),
            "log_text": feature_event.get("log_text"),
            "log_problem": feature_event.get("log_problem")
        }
        
        anomaly_id = await save_anomaly_score(anomaly_record)
        
        # ── Step 7: Anomaly actions ───────────────────────────
        if is_anomaly:
            logger.warning(
                f"🚨 ANOMALY on {host} | Score: {final_score:.3f} | "
                f"IF: {breakdown['if_normalized']:.3f} | LSTM: {breakdown['lstm_normalized']:.3f}"
            )
            
            # WebSocket broadcast to dashboard
            await broadcast_anomaly({
                "anomaly_id": str(anomaly_id),
                "host": host,
                "tenant_id": tenant_id,
                "final_score": final_score,
                "breakdown": breakdown,
                "timestamp": anomaly_record["scored_at"],
                "error_rate": feature_event.get("error_rate", 0),
                "log_text": feature_event.get("log_text"),
                "log_problem": feature_event.get("log_problem")
            })
            
            # Trigger alert rules (async, non-blocking)
            asyncio.create_task(
                self.alerting.evaluate(anomaly_record, tenant_id=tenant_id)
            )
            
            # Publish to anomaly-events Kafka topic
            await self._producer.send(
                self.settings.kafka_output_topic,
                value={**anomaly_record, "breakdown": breakdown}
            )
        
        # ── Step 8: Update Redis buffer ───────────────────────
        await self.buffer.append_vector(host, tenant_id, feature_vector)
        
        # ── Performance logging ───────────────────────────────
        elapsed_ms = (asyncio.get_event_loop().time() - start_time) * 1000
        logger.warning(f"PROCESS_MESSAGE_CALLED: Processed {host} in {elapsed_ms:.1f}ms | anomaly={is_anomaly}")
        
        if elapsed_ms > 500:
            logger.warning(f"Slow inference on {host}: {elapsed_ms:.1f}ms")
    
    def _extract_flat_features(self, event: dict) -> list:
        """Extract ordered flat feature list matching training-time schema."""
        base = [
            event.get("log_volume", 0),
            event.get("error_rate", 0.0),
            event.get("warn_rate", 0.0),
            event.get("unique_template_count", 0),
            event.get("template_entropy", 0.0),
            event.get("avg_response_time_ms", 0.0),
            event.get("p95_response_time_ms", 0.0),
        ]
        template_vector = event.get("template_vector", [0.0] * 100)
        return base + template_vector  # Total: 107 features
