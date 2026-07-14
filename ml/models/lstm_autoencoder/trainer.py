import os
import numpy as np
import mlflow
import mlflow.tensorflow
from architecture import build_lstm_autoencoder
from sklearn.preprocessing import StandardScaler
import joblib
import json

os.environ['AWS_ACCESS_KEY_ID'] = 'minioadmin'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'minioadmin123'
os.environ['MLFLOW_S3_ENDPOINT_URL'] = 'http://localhost:9000'
os.environ['MLFLOW_S3_IGNORE_TLS'] = 'true'

def train_lstm():
    mlflow.set_tracking_uri("http://localhost:5000")
    mlflow.set_experiment("LogGuard_LSTM_Autoencoder")
    
    X_seq_path = 'ml/data/X_seq.npy'
    if not os.path.exists(X_seq_path):
        X_seq_raw = np.random.rand(100, 30, 107)
    else:
        X_seq_raw = np.load(X_seq_path)

    n_samples, seq_len, n_features = X_seq_raw.shape
    
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(X_seq_raw.reshape(-1, n_features))
    X_seq = scaled_data.reshape(n_samples, seq_len, n_features)

    with mlflow.start_run(run_name="LSTM_Standard"):
        model = build_lstm_autoencoder(sequence_length=seq_len, n_features=n_features)
        
        print(f"🧠 Training LSTM with shape {X_seq.shape}...")
        model.fit(X_seq, X_seq, epochs=2, batch_size=32, validation_split=0.1, verbose=1)
        
        print("💾 Logging proper MLflow model...")
        mlflow.tensorflow.log_model(model, "model")
        
        os.makedirs("artifacts", exist_ok=True)
        joblib.dump(scaler, "artifacts/lstm_scaler.pkl")
        with open("threshold_config.json", "w") as f:
            json.dump({"lstm_threshold": 0.5}, f)
            
        mlflow.log_artifact("artifacts/lstm_scaler.pkl", artifact_path="artifacts")
        mlflow.log_artifact("threshold_config.json")
        
        os.remove("artifacts/lstm_scaler.pkl")
        os.rmdir("artifacts")
        os.remove("threshold_config.json")
            
        print("✅ SUCCESS! LSTM Brain properly saved to MLflow.")

if __name__ == "__main__":
    train_lstm()
