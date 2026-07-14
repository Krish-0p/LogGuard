import { useState } from "react";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { useFeedback } from "../../hooks/useAnomalies";
import type { AnomalyScore, FeedbackType } from "../../types/anomaly";
import { clsx } from "clsx";

interface AnomalyFeedbackProps {
  anomaly: AnomalyScore;
}

export function AnomalyFeedback({ anomaly }: AnomalyFeedbackProps) {
  const [submitted, setSubmitted] = useState<FeedbackType | null>(null);
  const { mutate: submitFeedback, isPending } = useFeedback();

  const handleFeedback = (feedbackType: FeedbackType) => {
    submitFeedback(
      {
        anomaly_id: anomaly.id,
        scored_at: anomaly.scored_at,
        host: anomaly.host,
        feedback_type: feedbackType,
      },
      {
        onSuccess: () => setSubmitted(feedbackType),
      },
    );
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span
          className={
            submitted === "true_positive" ? "text-red-400" : "text-green-400"
          }
        >
          {submitted === "true_positive"
            ? "✓ Confirmed anomaly"
            : "✓ Marked false positive"}
        </span>
        <span className="text-gray-600 text-xs">
          · Thanks for training the model
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 mr-1">Is this correct?</span>

      {/* True Positive button */}
      <button
        onClick={() => handleFeedback("true_positive")}
        disabled={isPending}
        className={clsx(
          "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all",
          "border-gray-700 text-gray-400 hover:border-red-500 hover:text-red-400 hover:bg-red-950/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
        title="This is a real anomaly (true positive)"
      >
        {isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <ThumbsDown size={12} />
        )}
        Real anomaly
      </button>

      {/* False Positive button */}
      <button
        onClick={() => handleFeedback("false_positive")}
        disabled={isPending}
        className={clsx(
          "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all",
          "border-gray-700 text-gray-400 hover:border-green-500 hover:text-green-400 hover:bg-green-950/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
        title="This was incorrectly flagged (false positive)"
      >
        {isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <ThumbsUp size={12} />
        )}
        False alarm
      </button>
    </div>
  );
}
