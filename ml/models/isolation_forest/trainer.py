import os
import numpy as np
import mlflow
import mlflow.sklearn
import joblib
import json
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

print("🚀 Starting the Isolation Forest Trainer (Fixed Dimensions)...")

def train_isolation_forest():
    mlflow.set_tracking_uri("http://localhost:5000")
    mlflow.set_experiment("LogGuard_Anomaly_Detection")

    # Load the REAL 107-feature dataset rather than the pandas partial columns
    X_flat_path = 'ml/data/X_flat.npy'
    if not os.path.exists(X_flat_path):
        print("Creating synthetic 107-feature dummy data for compilation testing...")
        X = np.random.rand(1000, 107)
    else:
        X = np.load(X_flat_path)
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    with mlflow.start_run(run_name="Isolation_Forest_Standard"):
        print("🧠 Training model...")
        model = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
        model.fit(X_scaled)

        mlflow.log_param("n_estimators", 100)
        mlflow.log_param("contamination", 0.1)

        print("💾 Logging MLflow model flavor...")
        mlflow.sklearn.log_model(model, "model")
        
        os.makedirs("artifacts", exist_ok=True)
        joblib.dump(scaler, "artifacts/if_scaler.pkl")
        with open("threshold_config.json", "w") as f:
            json.dump({"if_threshold": -0.5}, f)
            
        mlflow.log_artifact("artifacts/if_scaler.pkl", artifact_path="artifacts")
        mlflow.log_artifact("threshold_config.json")
        
        os.remove("artifacts/if_scaler.pkl")
        os.rmdir("artifacts")
        os.remove("threshold_config.json")

        print("✅ SUCCESS! Run is fully logged.")

if __name__ == "__main__":
    train_isolation_forest()
