import numpy as np

class HybridScorer:
    def __init__(self, settings):
        self.w_if = settings.if_weight
        self.w_lstm = settings.lstm_weight
        self.threshold = settings.final_anomaly_threshold

    def score(self, if_raw_score, lstm_recon_error):
        # Normalize IF (approx -0.5 to 0.5) to 0-1
        if_norm = np.clip(1.0 - (if_raw_score + 0.5), 0, 1)
        # Reduce IF sensitivity
        if_norm = if_norm * 0.5 
        
        # Normalize LSTM MSE (Small values) - Adjusted scaling down significantly
        lstm_norm = np.clip(lstm_recon_error * 0.0001, 0, 1)
        
        final_score = (self.w_if * if_norm) + (self.w_lstm * lstm_norm)
        is_anomaly = final_score >= self.threshold
        
        breakdown = {
            "if_raw": if_raw_score,
            "if_normalized": if_norm,
            "lstm_raw": lstm_recon_error,
            "lstm_normalized": lstm_norm
        }
        
        return float(final_score), bool(is_anomaly), breakdown
