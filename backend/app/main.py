from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
load_dotenv("../.env")
import os
os.environ["MLFLOW_S3_ENDPOINT_URL"] = "http://localhost:9000"
import asyncio
import logging

from app.config import get_settings
from app.inference.consumer import InferenceConsumer
from app.db.timescale import timescale_pool
from app.db.postgres import postgres_engine
from app.db.redis_client import redis_client
from app.api.v1 import anomalies, logs, alerts, alerting, feedback, hosts, websocket, demo, auth, rca_xai
from app.core.logging import configure_logging

configure_logging()
logger = logging.getLogger("logguard.main")
settings = get_settings()

# ── Global inference consumer (runs in background) ────────────────────────
inference_consumer: InferenceConsumer = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: Initialize all connections + start Kafka consumer.
    Shutdown: Clean close of all connections.
    """
    global inference_consumer
    
    logger.info("🚀 LogGuard API starting up...")
    
    # Initialize DB connections
    await timescale_pool.connect()
    await redis_client.connect()
    
    # Load ML models from MLflow (once at startup)
    inference_consumer = InferenceConsumer(settings)
    await inference_consumer.initialize_models()
    
    # Start Kafka consumer as background task
    consumer_task = asyncio.create_task(
        inference_consumer.run(),
        name="kafka-inference-consumer"
    )
    
    logger.info("✅ LogGuard API ready.")
    
    yield  # API is running
    
    # Shutdown
    logger.info("🔴 LogGuard API shutting down...")
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass
    
    await timescale_pool.disconnect()
    await redis_client.disconnect()
    logger.info("✅ Shutdown complete.")


app = FastAPI(
    title="LogGuard API",
    version=settings.app_version,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://app.logguard.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Register all routers
app.include_router(auth.router,      prefix="/api/v1/auth",      tags=["Auth"])
app.include_router(rca_xai.router,   prefix="/api/v1/rca",       tags=["RCA"])
app.include_router(anomalies.router, prefix="/api/v1/anomalies", tags=["Anomalies"])
app.include_router(logs.router,      prefix="/api/v1/logs",      tags=["Logs"])
app.include_router(alerts.router,    prefix="/api/v1/alerts",    tags=["Alerts"])
app.include_router(alerting.router,  prefix="/api/v1/alerting",  tags=["Alerting"])
app.include_router(feedback.router,  prefix="/api/v1/feedback",  tags=["Feedback"])
app.include_router(hosts.router,     prefix="/api/v1/hosts",     tags=["Hosts"])
app.include_router(demo.router,      prefix="/api/v1/demo",      tags=["Demo"])
app.include_router(websocket.router, prefix="/ws",               tags=["WebSocket"])

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.app_version,
        "models_loaded": inference_consumer.models_ready if inference_consumer else False
    }
