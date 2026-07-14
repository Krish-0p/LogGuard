import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

def generate_training_data(n_samples=5000):
    # Ensure directory exists
    os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
    
    data = []
    start_time = datetime.utcnow()

    print(f"Generating {n_samples} training samples...")

    for i in range(n_samples):
        # 95% Normal, 5% Anomaly
        is_anomaly = 1 if np.random.random() < 0.05 else 0
        
        if not is_anomaly:
            # Normal: Low volume, low errors, stable entropy
            log_vol = np.random.poisson(50)
            err_rate = np.random.uniform(0.01, 0.05)
            entropy = np.random.normal(2.0, 0.3)
        else:
            # Anomaly: High volume OR high errors OR chaotic entropy
            log_vol = np.random.poisson(250) 
            err_rate = np.random.uniform(0.4, 0.8)
            entropy = np.random.normal(5.0, 1.0)
        
        data.append({
            "timestamp": start_time + timedelta(minutes=i),
            "log_volume": float(log_vol),
            "error_rate": float(err_rate),
            "template_entropy": float(entropy),
            "is_anomaly": is_anomaly
        })

    df = pd.DataFrame(data)
    
    # Save as Parquet for the trainer
    file_path = 'training_data.parquet'
    df.to_parquet(file_path)
    print(f"✅ Success! Created {file_path} in the current directory.")

if __name__ == "__main__":
    generate_training_data()