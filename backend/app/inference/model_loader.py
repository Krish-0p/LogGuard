import mlflow
import mlflow.sklearn
import mlflow.tensorflow
import joblib
import numpy as np
import logging
from typing import Optional

logger = logging.getLogger("logguard.model_loader")

class ModelRegistry:
    """
    Loads production ML models from MLflow Model Registry at startup.
    Both models are loaded once and kept in memory.
    Thread-safe for concurrent inference requests.
    """
    
    def __init__(self, settings):
        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
        self.settings = settings
        
        self.if_model    = None  # IsolationForest
        self.if_scaler   = None  # StandardScaler for IF features
        self.lstm_model  = None  # Keras LSTM Autoencoder
        self.lstm_scaler = None  # StandardScaler for LSTM features
        
        self.if_threshold   = None
        self.lstm_threshold = None
        self.scorer_config  = None
        
        self._ready = False
    
    async def load(self) -> None:
        """Load all models. Called once at startup."""
        
        logger.info("Loading ML models from MLflow Registry...")
        
        try:
            # ── Load Isolation Forest ─────────────────────
            if_uri = f"models:/{self.settings.isolation_forest_model_name}/{self.settings.model_stage}"
            self.if_model = mlflow.sklearn.load_model(if_uri)
            
            # Load associated scaler and threshold from artifacts
            if_run_id = self._get_latest_run_id(self.settings.isolation_forest_model_name)
            artifacts = mlflow.artifacts.download_artifacts(
                run_id=if_run_id,
                artifact_path="artifacts/if_scaler.pkl"
            )
            self.if_scaler = joblib.load(artifacts)
            
            threshold_config = mlflow.artifacts.load_dict(
                f"runs:/{if_run_id}/threshold_config.json"
            )
            self.if_threshold = threshold_config["if_threshold"]
            
            logger.info(f"✅ Isolation Forest loaded. Threshold: {self.if_threshold:.4f}")
            
            # ── Load LSTM Autoencoder ─────────────────────
            lstm_uri = f"models:/{self.settings.lstm_model_name}/{self.settings.model_stage}"
            self.lstm_model = mlflow.tensorflow.load_model(lstm_uri)
            
            lstm_run_id = self._get_latest_run_id(self.settings.lstm_model_name)
            lstm_artifacts = mlflow.artifacts.download_artifacts(
                run_id=lstm_run_id,
                artifact_path="artifacts/lstm_scaler.pkl"
            )
            self.lstm_scaler = joblib.load(lstm_artifacts)
            
            lstm_config = mlflow.artifacts.load_dict(
                f"runs:/{lstm_run_id}/threshold_config.json"
            )
            self.lstm_threshold = lstm_config["lstm_threshold"]
            
            logger.info(f"✅ LSTM Autoencoder loaded. Threshold: {self.lstm_threshold:.6f}")
            
            self._ready = True
            
        except Exception as e:
            logger.error(f"❌ Failed to load models: {e}")
            raise RuntimeError(f"Model loading failed: {e}") from e
    
    @property
    def ready(self) -> bool:
        return self._ready
    
    def _get_latest_run_id(self, model_name: str) -> str:
        client = mlflow.MlflowClient()
        versions = client.get_latest_versions(model_name, stages=[self.settings.model_stage])
        if not versions:
            raise ValueError(f"No '{self.settings.model_stage}' model found: {model_name}")
        return versions[0].run_id
    
    def predict_isolation_forest(self, feature_vector: np.ndarray) -> tuple[float, float]:
        """
        Returns (raw_score, normalized_score) from IF model.
        raw_score: from decision_function (lower = more anomalous)
        """
        scaled = self.if_scaler.transform(feature_vector.reshape(1, -1))
        raw_score = float(self.if_model.decision_function(scaled)[0])
        return raw_score
    
    def predict_lstm(self, sequence: np.ndarray) -> float:
        """
        Returns reconstruction error (MSE) from LSTM.
        Higher = more anomalous.
        sequence shape: (1, seq_len, n_features)
        """
        scaled_flat = self.lstm_scaler.transform(
            sequence.reshape(-1, sequence.shape[-1])
        ).reshape(sequence.shape)
        
        reconstructed = self.lstm_model.predict(scaled_flat, verbose=0)
        mse = float(np.mean(np.power(scaled_flat - reconstructed, 2)))
        return mse
