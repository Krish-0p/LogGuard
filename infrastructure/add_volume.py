with open("/home/krisss/LogGuard/infrastructure/docker-compose.yml", "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    new_lines.append(line)
    if "depends_on:" in line and "minio" in new_lines[-2]:
        pass
    if line.strip() == "- minio":
        new_lines.append("    volumes:\n")
        new_lines.append("      - mlflow_data:/mlflow\n")
    if line.strip() == "es_data:":
        new_lines.append("  mlflow_data:\n")

with open("/home/krisss/LogGuard/infrastructure/docker-compose.yml", "w") as f:
    f.writelines(new_lines)
