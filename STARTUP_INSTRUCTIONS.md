# LogGuard Startup Instructions

Here are the step-by-step commands to start the LogGuard project after a laptop restart. Open 4 separate terminals and run one block of commands in each:

### Terminal 1: Infrastructure (Docker Services)
*Make sure Docker Desktop is running before you execute this snippet.*
```bash
cd ~/LogGuard
docker compose -f infrastructure/docker-compose.yml up -d
```

### Terminal 2: Backend (FastAPI Engine)
*Wait about 10 seconds for the databases in Terminal 1 to fully boot up.*
```bash
cd ~/LogGuard/backend
source logguard_env/bin/activate
export POSTGRES_URL="postgresql+asyncpg://logguard:logguard@localhost:5432/logguard"
export AWS_ACCESS_KEY_ID="minioadmin"
export AWS_SECRET_ACCESS_KEY="minioadmin123"
export MLFLOW_S3_ENDPOINT_URL="http://localhost:9000"
export MLFLOW_S3_IGNORE_TLS="true"
uvicorn app.main:app --reload --port 8000
```

### Terminal 3: Data Ingestion (Logs to Kafka)
*This script streams your machine's actual logs into the ML models.*
```bash
cd ~/LogGuard
source backend/logguard_env/bin/activate
python wsl_data_livestream.py
```

### Terminal 4: Frontend (React Dashboard)
*Starts the dashboard UI.*
```bash
cd ~/LogGuard/frontend
npm run dev
```

Once all 4 are running, open your browser and go to `http://localhost:5173`.
