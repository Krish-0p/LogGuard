export type NotifierType = "slack" | "pagerduty" | "email";
export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface AlertRule {
  id: string;
  name: string;
  description: string | null;
  host_pattern: string | null; // e.g. "web-*" or null for all
  score_threshold: number; // 0–1
  severity: AlertSeverity;
  notifier_type: NotifierType;
  notifier_config: Record<string, string>;
  cooldown_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface AlertRuleFormValues {
  name: string;
  description: string;
  host_pattern: string;
  score_threshold: number;
  severity: AlertSeverity;
  notifier_type: NotifierType;
  webhook_url?: string; // For Slack
  integration_key?: string; // For PagerDuty
  email_addresses?: string; // Comma-separated for Email
  cooldown_minutes: number;
}
