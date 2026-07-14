with open("/home/krisss/LogGuard/infrastructure/docker-compose.yml", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if line.strip() == "command: >":
        new_lines.append(line)
        new_lines.append('      sh -c "pip install boto3 && mlflow server --backend-store-uri sqlite:///mlflow.db --default-artifact-root s3://logguard-mlflow-artifacts/ --serve-artifacts --host 0.0.0.0"\n')
        skip = True
    elif skip:
        if line.strip().startswith("ports:"):
            skip = False
            new_lines.append(line)
    else:
        new_lines.append(line)

with open("/home/krisss/LogGuard/infrastructure/docker-compose.yml", "w") as f:
    f.writelines(new_lines)
