export interface AnomalyScore {
  id: number;
  scored_at: string; // ISO timestamp
  host: string;
  tenant_id: string;
  final_score: number; // 0–1, higher = more anomalous
  if_score: number; // Isolation Forest contribution
  lstm_score: number; // LSTM contribution
  is_anomaly: boolean;
  anomaly_type: string | null;
  log_volume: number | null;
  error_rate: number | null; // 0–1
  feature_window_start: string | null;
  feature_window_end: string | null;
  log_text?: string | null;
  log_problem?: string | null;
}

export interface AnomalyTimelineBucket {
  bucket: string; // ISO timestamp of bucket start
  host: string;
  avg_score: number;
  max_score: number;
  window_count: number;
  anomaly_count: number;
}

export interface RcaResult {
  anomaly_id: number;
  window_start: string;
  window_end: string;
  host: string;
  contributing_templates: ContributingTemplate[];
  unusual_log_count: number;
  total_log_count: number;
}

export interface ContributingTemplate {
  template: string;
  template_id: string;
  baseline_rate: number; // Normal occurrence rate
  anomaly_rate: number; // Rate during anomaly window
  lift: number; // anomaly_rate / baseline_rate
  example_log: string | null;
}

export type FeedbackType = "true_positive" | "false_positive";

export interface FeedbackPayload {
  anomaly_id: number;
  scored_at: string;
  host: string;
  feedback_type: FeedbackType;
  notes?: string;
}

export type AnomalySeverity = "critical" | "high" | "medium" | "normal";

export function getAnomalySeverity(score: number): AnomalySeverity {
  if (score >= 0.9) return "critical";
  if (score >= 0.8) return "high";
  if (score >= 0.7) return "medium";
  return "normal";
}

export const SEVERITY_COLORS: Record<AnomalySeverity, string> = {
  critical: "text-red-500 bg-red-50 border-red-200",
  high: "text-orange-500 bg-orange-50 border-orange-200",
  medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  normal: "text-green-600 bg-green-50 border-green-200",
};

export const SEVERITY_DOT: Record<AnomalySeverity, string> = {
  critical: "bg-red-500 animate-pulse-fast",
  high: "bg-orange-500 animate-pulse",
  medium: "bg-yellow-500",
  normal: "bg-green-500",
};
