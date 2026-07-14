import re

with open("app/api/v1/logs.py", "r") as f:
    content = f.read()

new_func = """
import numpy as np

@router.post("/analyze-csv-offline")
async def analyze_log_csv_offline(
    file: UploadFile = File(...),
    tenant_id: str = Depends(get_current_tenant)
):
    from app.main import inference_consumer
    if not (inference_consumer and inference_consumer.models_ready):
         raise HTTPException(status_code=503, detail="Models not loaded yet")

    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        t_now = time.time()
        if 'timestamp' in df.columns:
            df['timestamp_ms'] = pd.to_datetime(df['timestamp'], errors='coerce')
        else:
            df['timestamp_ms'] = pd.NaT

        df['timestamp_ms'] = df['timestamp_ms'].fillna(pd.Timestamp(t_now, unit='s'))
        df = df.sort_values('timestamp_ms')
        
        # Group into 60-second windows for simplicity
        df['window'] = df['timestamp_ms'].dt.floor('60s')
        
        results = []
        for (host, window), group in df.groupby(['host', 'window']):
            total_logs = len(group)
            
            severities = group.get('severity', pd.Series(['INFO']*total_logs)).str.upper()
            error_count = (severities.isin(['ERROR', 'FATAL'])).sum()
            warn_count = (severities == 'WARN').sum()
            
            error_rate = float(error_count / total_logs) if total_logs > 0 else 0.0
            warn_rate = float(warn_count / total_logs) if total_logs > 0 else 0.0
            
            # Dummy representation of complex Flink features for quick offline scan
            unique_template_count = len(group['raw_message'].unique()) if 'raw_message' in group else 1
            template_entropy = 1.0
            
            flat_features = [
                float(total_logs),
                error_rate,
                warn_rate,
                float(unique_template_count),
                template_entropy,
                0.0, # avg_response
                0.0, # p95
            ] + [0.0] * 100 # Template vector (100)
            
            feature_vector = np.array(flat_features, dtype=np.float32)
            
            if_raw_score = float(inference_consumer.registry.predict_isolation_forest(feature_vector))
            
            # Let's mock LSTM since it requires stateful history sequence lookup which is hard for static offline
            lstm_mse = 0.0 
            
            final_score, is_anomaly, breakdown = inference_consumer.scorer.score(if_raw_score, lstm_mse)
            
            results.append({
                "timestamp": window.isoformat(),
                "host": host,
                "log_volume": total_logs,
                "error_rate": error_rate,
                "anomaly_score": final_score,
                "is_anomaly": is_anomaly,
                "breakdown": breakdown
            })
            
        return {"status": "success", "results": sorted(results, key=lambda x: x["timestamp"])}
        
    except Exception as e:
        logger.error(f"Error processing offline CSV: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
"""

with open("app/api/v1/logs.py", "w") as f:
    f.write(content + "\n" + new_func)
