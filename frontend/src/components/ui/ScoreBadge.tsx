import { getAnomalySeverity, SEVERITY_COLORS } from "../../types/anomaly";
import { clsx } from "clsx";

interface ScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({
  score,
  showLabel = true,
  size = "md",
}: ScoreBadgeProps) {
  const severity = getAnomalySeverity(score);
  const colorClass = SEVERITY_COLORS[severity];
  const percentage = Math.round(score * 100);

  const sizeClass = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  }[size];

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border font-mono font-semibold",
        colorClass,
        sizeClass,
      )}
    >
      <span
        className={clsx("w-1.5 h-1.5 rounded-full", {
          "bg-red-500 animate-pulse-fast": severity === "critical",
          "bg-orange-500 animate-pulse": severity === "high",
          "bg-yellow-500": severity === "medium",
          "bg-green-500": severity === "normal",
        })}
      />
      {percentage}%
      {showLabel && (
        <span className="font-sans font-normal capitalize ml-0.5">
          {severity}
        </span>
      )}
    </span>
  );
}
