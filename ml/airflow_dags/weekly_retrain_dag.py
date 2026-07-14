from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import os

default_args = {
    "owner": "logguard",
    "depends_on_past": False,
    "start_date": datetime(2026, 1, 1),
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}

dag = DAG(
    "logguard_weekly_retrain",
    default_args=default_args,
    description="Automatically retrain IF and LSTM models weekly",
    schedule_interval="0 2 * * 0", # Every Sunday at 2 AM
    catchup=False
)

def run_if_training():
    # Trigger your Isolation Forest trainer script
    os.system("python /home/krisss/LogGuard/ml/models/isolation_forest/trainer.py")

def run_lstm_training():
    # Trigger your LSTM trainer script
    os.system("python /home/krisss/LogGuard/ml/models/lstm_autoencoder/trainer.py")

# Task 1: Retrain Isolation Forest
retrain_if = PythonOperator(
    task_id="retrain_isolation_forest",
    python_callable=run_if_training,
    dag=dag
)

# Task 2: Retrain LSTM
retrain_lstm = PythonOperator(
    task_id="retrain_lstm_autoencoder",
    python_callable=run_lstm_training,
    dag=dag
)

# Set dependency: Run both in parallel
[retrain_if, retrain_lstm]