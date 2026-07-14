import numpy as np
import json
import logging
from typing import Optional
from app.db.redis_client import redis_client

logger = logging.getLogger("logguard.buffer")

class LSTMFeatureBuffer:
    """
    Maintains a rolling window of the last N feature vectors per host in Redis.
    This gives the LSTM its temporal context.
    
    Redis key format: lgbuf:{tenant_id}:{host}
    Value: JSON list of last `seq_len` vectors
    """
    
    def __init__(self, settings):
        self.seq_len = settings.lstm_sequence_length
        self.ttl     = settings.redis_feature_buffer_ttl
    
    def _key(self, host: str, tenant_id: str) -> str:
        return f"lgbuf:{tenant_id}:{host}"
    
    async def get_sequence(
        self,
        host: str,
        tenant_id: str,
        new_vector: np.ndarray,
        seq_len: int
    ) -> Optional[np.ndarray]:
        """
        Retrieve the current sequence buffer and append the new vector.
        Returns None if not enough history yet.
        """
        key = self._key(host, tenant_id)
        raw = await redis_client.get(key)
        
        if raw is None:
            # First time seeing this host — not enough history yet
            return None
        
        vectors = json.loads(raw)
        
        if len(vectors) < seq_len - 1:
            # Not enough history yet
            return None
        
        # Take last (seq_len - 1) vectors + current new vector
        recent = vectors[-(seq_len - 1):]
        sequence = np.array(recent + [new_vector.tolist()], dtype=np.float32)
        
        return sequence  # shape: (seq_len, n_features)
    
    async def append_vector(
        self,
        host: str,
        tenant_id: str,
        vector: np.ndarray
    ):
        """Append new vector to the host's buffer in Redis."""
        key = self._key(host, tenant_id)
        raw = await redis_client.get(key)
        
        vectors = json.loads(raw) if raw else []
        vectors.append(vector.tolist())
        
        # Keep only last seq_len vectors to bound memory
        if len(vectors) > self.seq_len:
            vectors = vectors[-self.seq_len:]
        
        await redis_client.setex(key, self.ttl, json.dumps(vectors))
