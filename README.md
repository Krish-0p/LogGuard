<div align="center">

# 🛡️ LogGuard
### AIOps-Driven Server Log Anomaly Detection

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![Apache Kafka](https://img.shields.io/badge/Apache_Kafka-231F20?style=flat-square&logo=apache-kafka&logoColor=white)](https://kafka.apache.org)
[![Apache Flink](https://img.shields.io/badge/Apache_Flink-E6526F?style=flat-square&logo=apache-flink&logoColor=white)](https://flink.apache.org)
[![MLflow](https://img.shields.io/badge/MLflow-0194E2?style=flat-square&logo=mlflow&logoColor=white)](https://mlflow.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat-square&logo=kubernetes&logoColor=white)](https://kubernetes.io)

**An end-to-end, production-grade AIOps platform that automatically detects, scores, and alerts on log anomalies in real time using hybrid machine learning and stream processing.**

*Mini Project 2B — Department of Information Technology, A.P. Shah Institute of Technology, University of Mumbai (2025–26)*

</div>

---

## 🎯 What is LogGuard?

Modern IT infrastructure generates thousands of log lines every second. Buried inside that noise are early signals of server crashes, memory leaks, security breaches, and performance degradations — signals no human team can catch manually at scale.

LogGuard solves this by automating the entire detection and alerting workflow. Logs flow in from servers, applications, and Kubernetes containers, get processed through a high-throughput streaming pipeline, and are scored in real time by two complementary ML models. The moment an anomaly is detected, the right team is notified via Slack, PagerDuty, or email — all within **under 2 seconds**.

What makes the system genuinely intelligent is its feedback loop: analyst corrections feed directly into an automated weekly retraining pipeline, so detection accuracy continuously improves based on real-world usage.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATA ENGINEERING LAYER                           │
│  Servers / Apps / K8s Containers                                        │
│         │                                                               │
│         ▼                                                               │
│    [Fluent Bit] ──► [Apache Kafka] ──► [Apache Flink + Drain3]         │
│                      Message Broker     Stream Processing               │
│                                              │                          │
│                                              ▼                          │
│                                    [Structured Feature Vectors]         │
└──────────────────────────────────────────────┬──────────────────────────┘
                                               │
┌──────────────────────────────────────────────▼──────────────────────────┐
│                        MACHINE LEARNING LAYER                           │
│                                                                         │
│   ┌──────────────────┐         ┌──────────────────────┐                │
│   │  Isolation Forest │         │   LSTM Autoencoder   │                │
│   │  (Point Anomaly) │         │ (Sequence Anomaly)   │                │
│   └────────┬─────────┘         └──────────┬───────────┘                │
│            │    Point Scores    Seq Scores │                            │
│            └──────────► [Hybrid Scoring Engine] ◄──────────────────────┤
│                                   │                                     │
│                              [MLflow] ──► Model Registry & Tracking    │
│                              [Airflow] ──► Weekly Retraining DAG       │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                           BACKEND LAYER                                 │
│                                                                         │
│   [FastAPI] ──► REST APIs + WebSocket                                  │
│   [Kafka Consumer] ──► Real-time Inference                             │
│   [TimescaleDB] [Elasticsearch] [Redis]                                │
│   [Alerting Engine] ──► Slack / PagerDuty / Email                     │
│   [Feedback API] ◄── Analyst corrections                               │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                          FRONTEND LAYER                                 │
│                                                                         │
│   [React 18 + TypeScript Dashboard]                                    │
│   • Real-time anomaly timeline (Apache ECharts)                        │
│   • Host health fleet grid                                             │
│   • Live WebSocket alert feed                                          │
│   • Root cause analysis panel                                          │
│   • True Positive / False Positive feedback buttons                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 🔄 Real-Time Log Ingestion & Stream Processing
- Collects logs from servers, applications, and Kubernetes containers via **Fluent Bit**
- Streams through **Apache Kafka** at **50,000+ logs/second**
- **Apache Flink** processes streams with **Drain3-based** log template parsing
- Avro schemas and Schema Registry enforce strict data consistency
- **Exactly-once processing semantics** — zero data loss

### 🤖 Hybrid ML Anomaly Detection
- **Isolation Forest** — detects point anomalies (sudden error spikes, volume surges)
- **LSTM Autoencoder** — detects sequence anomalies (memory leaks, slow degradations, evolving attack signatures)
- **Hybrid Scoring Engine** combines both models for a single anomaly verdict
- All models versioned and tracked via **MLflow**
- Target: **F1 ≥ 0.82, ROC AUC ≥ 0.90, FPR ≤ 5%**

### 🔁 Automated Model Retraining Pipeline
- **Apache Airflow DAG** runs every week
- Fetches analyst feedback → prepares updated datasets → retrains both models
- Promotes new model to production only if it outperforms the current one on F1 score
- Fully automated — zero manual ML maintenance required

### ⚡ Inference Service & REST API
- **FastAPI** backend with REST + WebSocket endpoints
- End-to-end anomaly detection in **under 2 seconds**
- **TimescaleDB** for time-series anomaly storage
- **Redis** for LSTM sequence state management and alert cooldown
- **WebSocket** broadcasting with under 100ms delay

### 🚨 Intelligent Alerting Engine
- Configurable rules: score thresholds, host patterns, severity levels
- Async **Celery**-based task queue for instant notifications
- Integrates with **Slack**, **PagerDuty**, and **Email**
- Cooldown mechanism prevents alert fatigue
- Multi-host correlation — groups related anomalies into unified incidents

### 📊 Enterprise-Grade React Dashboard
- Real-time anomaly timelines powered by **Apache ECharts**
- Fleet-wide host health grid
- Live **WebSocket**-driven alert feed
- Host drill-down with root cause analysis panels
- Virtual log tables rendering 100,000+ rows without performance degradation
- Fully dark-mode, responsive, LCP target < 2.5s

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Log Collection** | Fluent Bit | Lightweight agent for log gathering |
| **Message Broker** | Apache Kafka | High-throughput log streaming |
| **Stream Processing** | Apache Flink | Real-time feature extraction |
| **Log Parsing** | Drain3 | Automated template extraction |
| **ML — Point Anomaly** | Scikit-learn (Isolation Forest) | Sudden deviation detection |
| **ML — Sequence Anomaly** | TensorFlow / Keras (LSTM Autoencoder) | Pattern-based anomaly detection |
| **Model Management** | MLflow | Versioning, tracking, registry |
| **Retraining Orchestration** | Apache Airflow | Weekly automated retraining DAG |
| **Backend API** | FastAPI | REST + WebSocket APIs |
| **Time-Series Storage** | TimescaleDB | Anomaly and metric storage |
| **Log Search** | Elasticsearch | Full-text log search and indexing |
| **Cache / State** | Redis | Sequence state and alert cooldown |
| **Task Queue** | Celery | Async alert dispatching |
| **Frontend** | React 18 + TypeScript | Interactive monitoring dashboard |
| **UI Styling** | Tailwind CSS | Responsive component styling |
| **Charts** | Apache ECharts | Real-time anomaly visualizations |
| **Containerization** | Docker | Service packaging |
| **Orchestration** | Kubernetes | Scalable deployment |
| **Language** | Python 3.11 | ML, backend, and pipeline code |

---

## 📊 Performance Targets

| Metric | Target |
|---|---|
| F1 Score | ≥ 0.82 |
| ROC AUC | ≥ 0.90 |
| False Positive Rate | ≤ 5% |
| End-to-End Detection Latency | < 2 seconds |
| Log Ingestion Throughput | > 50,000 logs/second |
| WebSocket Broadcast Delay | < 100ms |
| Dashboard LCP | < 2.5 seconds |
| Lighthouse Performance Score | ≥ 85 |

---

## 📁 Project Structure

```
LogGuard/
├── backend/                    # FastAPI inference service & REST APIs
│   ├── app/
│   │   ├── api/v1/             # API route handlers (logs, anomalies, alerts, auth)
│   │   ├── alerting/           # Slack, PagerDuty, email notification engine
│   │   ├── core/               # Anomaly monitor, RCA, auth logic
│   │   ├── db/                 # TimescaleDB, Elasticsearch, Redis clients
│   │   ├── inference/          # Kafka consumer, ML model loader, scorer
│   │   └── models/             # SQLAlchemy data models
│   ├── requirements.txt
│   └── Dockerfile
│
├── flink_jobs/                 # Apache Flink stream processing jobs
│   ├── log_processor.py        # Flink job: Kafka → Drain3 → feature vectors
│   ├── feature_engineering/    # Feature extraction utilities
│   ├── parsers/                # Drain3 log template parsers
│   └── requirements.txt
│
├── ml/                         # Machine learning models and training
│   ├── isolation_forest/       # Isolation Forest trainer & artifacts
│   ├── lstm_autoencoder/       # LSTM Autoencoder trainer & artifacts
│   ├── scoring/                # Hybrid scoring engine
│   └── pipelines/              # Airflow DAGs for retraining
│
├── frontend/                   # React 18 + TypeScript dashboard
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   └── pages/              # Dashboard, host views, alert config
│   ├── package.json
│   └── vite.config.ts
│
├── collectors/                 # Log collection agents & configs
├── kafka/                      # Kafka topic configs and schemas
├── infrastructure/             # Kubernetes manifests and Docker Compose files
├── wsl_data_livestream.py      # WSL log simulator for local development
├── STARTUP_INSTRUCTIONS.md     # Full setup and run guide
└── .env.example                # Environment variable template
```

---

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Python 3.11+
- Node.js 18+
- kubectl (for Kubernetes deployment)
- WSL2 / Ubuntu (for local development)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/LogGuard.git
cd LogGuard
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Fill in your credentials — Kafka brokers, DB URIs, Slack/PagerDuty tokens
```

### 3. Download Required Datasets

This project uses publicly available benchmark log datasets. Download and place them in the project root:

| Dataset | Source |
|---|---|
| BGL (BlueGene/L) | [Zenodo — loghub](https://zenodo.org/record/3227177) |
| HDFS | [GitHub — logpai/loghub](https://github.com/logpai/loghub) |

### 4. Start Infrastructure Services

```bash
# Start Kafka, Zookeeper, TimescaleDB, Redis, Elasticsearch, MLflow
docker compose -f infrastructure/docker-compose.yml up -d
```

### 5. Run the Flink Processing Job

```bash
cd flink_jobs
pip install -r requirements.txt
python log_processor.py
```

### 6. Train the ML Models

```bash
cd ml
python isolation_forest/trainer.py    # Train Isolation Forest
python lstm_autoencoder/trainer.py    # Train LSTM Autoencoder
```

### 7. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 8. Start the Frontend Dashboard

```bash
cd frontend
npm install
npm run dev
# Dashboard available at http://localhost:5173
```

### 9. (Optional) Run the Log Simulator

```bash
# Stream simulated WSL system logs into Kafka for local testing
python wsl_data_livestream.py
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/anomalies` | List anomalies with filters (host, time range, severity) |
| `GET` | `/api/v1/anomalies/{id}` | Get single anomaly with RCA details |
| `GET` | `/api/v1/logs` | Search and explore raw logs |
| `GET` | `/api/v1/hosts` | List monitored hosts and health status |
| `GET` | `/api/v1/kpi` | Dashboard KPIs (active anomalies, throughput) |
| `POST` | `/api/v1/feedback` | Submit true positive / false positive feedback |
| `GET` | `/api/v1/alerts` | List configured alert rules |
| `POST` | `/api/v1/alerts` | Create a new alert rule |
| `POST` | `/api/v1/auth/signup` | Register a new user |
| `POST` | `/api/v1/auth/login` | Authenticate and get token |
| `WS` | `/ws/anomalies` | WebSocket — live anomaly stream |

---

## 🧠 ML Models

### Isolation Forest (Point Anomaly Detection)
Trained using **Scikit-learn** to detect sudden, isolated deviations in log metrics such as error rate spikes, log volume surges, and abnormal response times. Uses `StandardScaler` for feature normalization. Model artifacts and parameters tracked via MLflow.

### LSTM Autoencoder (Sequence Anomaly Detection)
Built with **TensorFlow/Keras**. Trained to reconstruct normal log feature windows across time. An anomaly is flagged when the reconstruction error exceeds a learned threshold — effective for detecting gradual degradations like memory leaks and evolving attack signatures. Sequence state managed via Redis.

### Hybrid Scoring Engine
Combines scores from both models — Autoencoder weighted at **60%**, Isolation Forest at **40%** — into a final anomaly verdict. Weights tuned based on validation performance. Both model versions managed and promoted via the **MLflow Model Registry**.

---

## 📈 SDG Alignment

This project directly supports **UN SDG 9: Industry, Innovation and Infrastructure** by building resilient, intelligent digital infrastructure that modernizes industrial IT monitoring capabilities, ensuring enterprise systems remain stable, secure, and efficient.

---

## 👨‍💻 Team

| Name | Roll No. |
|---|---|
| Rehan Shaikh | 23104063 |
| **Krish Shejwal** | **23104079** |


**Guide:** Ms. Charul Singh
**HOD:** Dr. Kiran Deshpande
**Institution:** Department of Information Technology, A.P. Shah Institute of Technology, University of Mumbai

---

## 📄 License

This project is developed for academic purposes under the University of Mumbai curriculum (Academic Year 2025–26). All rights reserved by the authors.
