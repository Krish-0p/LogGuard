import numpy as np

class HybridAnomalyScorer:
    """
    Combines Isolation Forest (IF) and LSTM scores into a single final anomaly score.
    Weights: 40% Isolation Forest (Point anomalies), 60% LSTM (Sequence anomalies).
    """
    def __init__(self, if_weight=0.4, lstm_weight=0.6, final_threshold=0.7):
        self.if_weight = if_weight
        self.lstm_weight = lstm_weight
        self.final_threshold = final_threshold

    def score(self, if_decision_score, lstm_mse):
        """
        if_decision_score: Raw score from IF (higher is better/normal).
        lstm_mse: Mean Squared Error from LSTM (lower is better/normal).
        """
        # 1. Normalize IF: Flip it so higher = more anomalous
        # Standard IF decision_function returns ~[-0.5, 0.5]
        if_norm = np.clip(1.0 - (if_decision_score + 0.5), 0, 1)
        
        # 2. Normalize LSTM: MSE is usually small, so we scale it
        lstm_norm = np.clip(lstm_mse * 10, 0, 1)
        
        # 3. Weighted Fusion
        final_score = (self.if_weight * if_norm) + (self.lstm_weight * lstm_norm)
        is_anomaly = final_score >= self.final_threshold
        
        return {
            "is_anomaly": bool(is_anomaly),
            "final_score": round(float(final_score), 4),
            "breakdown": {
                "if_contribution": round(float(if_norm * self.if_weight), 4),
                "lstm_contribution": round(float(lstm_norm * self.lstm_weight), 4)
            }
        }

if __name__ == "__main__":
    scorer = HybridAnomalyScorer()
    # Test: Normal values
    print("Normal Test:", scorer.score(if_decision_score=0.2, lstm_mse=0.01))
    # Test: Anomalous values
    print("Anomaly Test:", scorer.score(if_decision_score=-0.4, lstm_mse=0.08))