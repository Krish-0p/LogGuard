import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { anomaliesApi, type AnomalyListParams } from "../api/anomalies";
import { feedbackApi } from "../api/feedback";
import type { FeedbackPayload } from "../types/anomaly";

// Anomaly list with faster auto-refresh
export function useAnomalies(params: AnomalyListParams) {
  return useQuery({
    queryKey: ["anomalies", params],
    queryFn: () => anomaliesApi.list(params),
    refetchInterval: 3000, // Re-fetch every 3s to keep tables live
    staleTime: 1000,
    select: (data) => data.anomalies,
  });
}

// Timeline data for charts
export function useAnomalyTimeline(host?: string, hoursBack: number = 24) {
  return useQuery({
    queryKey: ["anomaly-timeline", host, hoursBack],
    queryFn: () =>
      anomaliesApi.timeline({ host, hours_back: hoursBack, bucket_minutes: 1 }),
    refetchInterval: 3000, // Re-fetch every 3s to reflect latest graph
    staleTime: 1000,
    select: (data) => data.timeline,
  });
}

// RCA data — only fetch when user clicks "View RCA"
export function useRca(anomalyId: number | null) {
  return useQuery({
    queryKey: ["rca", anomalyId],
    queryFn: () => anomaliesApi.getRca(anomalyId!),
    enabled: anomalyId !== null,
    staleTime: 5 * 60_000, // RCA doesn't change — cache for 5 min
    select: (data) => data.rca,
  });
}

// Feedback mutation
export function useFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FeedbackPayload) => feedbackApi.submit(payload),
    onSuccess: (_, variables) => {
      // Invalidate anomaly list so UI can update state
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
      console.log(
        `✅ Feedback submitted: ${variables.feedback_type} for anomaly ${variables.anomaly_id}`,
      );
    },
  });
}
