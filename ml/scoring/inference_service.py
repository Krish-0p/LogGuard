import mlflow
import joblib
import json
import os
import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI
from confluent_kafka import Consumer

# --- Config ---
os.environ['AWS_ACCESS_KEY_ID'] = 'minioadmin'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'minioadmin123'
os.environ['MLFLOW_S3_ENDPOINT_URL'] = 'http://localhost:9000'
mlflow.set_tracking_uri("http://localhost:5000")

# --- Kafka Logic ---
def consume_and_score(model):
    consumer = Consumer({
        'bootstrap.servers': 'localhost:9092',
        'group.id': 'inference-group',
        'auto.offset.reset': 'latest'
    })
    consumer.subscribe(['processed-features'])

    print("📡 Listening to Kafka topic: processed-features...")
    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None: continue
            if msg.error():
                print(f"Consumer error: {msg.error()}")
                continue

            data = json.loads(msg.value().decode('utf-8'))
            features = [[data['log_volume'], data['error_rate'], data['template_entropy']]]
            
            # Predict (1 = Normal, -1 = Anomaly)
            prediction = model.predict(features)[0]
            
            status = "🚨 ANOMALY" if prediction == -1 else "✅ NORMAL"
            print(f"{status} | Vol: {data['log_volume']} | Err: {data['error_rate']:.2f} | Entropy: {data['template_entropy']:.2f}")
    finally:
        consumer.close()

# --- Lifespan Manager (The New Way) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # This runs when the server starts
    print("🧠 Loading model into RAM...")
    experiment = mlflow.get_experiment_by_name("LogGuard_Anomaly_Detection")
    runs = mlflow.search_runs(experiment_ids=[experiment.experiment_id], order_by=["start_time DESC"], max_results=1)
    run_id = runs.iloc[0].run_id
    local_path = mlflow.artifacts.download_artifacts(artifact_uri=f"runs:/{run_id}/model_files/model.joblib")
    model = joblib.load(local_path)
    
    # Start Kafka thread
    thread = threading.Thread(target=consume_and_score, args=(model,))
    thread.daemon = True
    thread.start()
    
    yield  # The server is now "running"
    # Code after 'yield' runs when the server shuts down (clean up if needed)

app = FastAPI(lifespan=lifespan)

@app.get("/health")
def health():
    return {"status": "Inference Service Live"}

# --- THE MISSING PIECE: Keeping the server alive ---
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting FastAPI Server on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)