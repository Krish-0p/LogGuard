FROM ghcr.io/mlflow/mlflow:v2.9.2

USER root

# Install the postgres and s3 drivers
RUN pip install psycopg2-binary boto3

# Set environment variables so MLflow knows to listen to the outside world
ENV MLFLOW_SERVER_HOST=0.0.0.0
ENV MLFLOW_SERVER_PORT=5000

# This is the command that will run every time
ENTRYPOINT ["mlflow", "server"]
