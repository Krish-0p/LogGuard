import { useRca } from "../../hooks/useAnomalies";
import { Skeleton } from "../ui/Skeleton";

interface RcaPanelProps {
  anomalyId: number;
  host: string;
}

export function RcaPanel({ anomalyId, host }: RcaPanelProps) {
  const { data: rca, isLoading, isError } = useRca(anomalyId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !rca) {
    return <p className="text-sm text-gray-500">Could not load RCA data.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">
          Root Cause Analysis
        </h3>
        <span className="text-xs text-gray-500">
          {rca.unusual_log_count} unusual logs / {rca.total_log_count} total
        </span>
      </div>

      <p className="text-xs text-gray-400">
        Log templates with unusually high occurrence during this anomaly window
        on <code className="text-indigo-400">{host}</code>:
      </p>

      <div className="space-y-2">
        {rca.contributing_templates.map((t) => (
          <div
            key={t.template_id}
            className="bg-gray-800 rounded-lg p-3 border border-gray-700"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-gray-300 truncate">
                  {t.template}
                </p>
                {t.example_log && (
                  <p className="text-xs text-gray-600 font-mono truncate mt-0.5">
                    {t.example_log}
                  </p>
                )}
              </div>

              {/* Lift indicator: how much more frequent than baseline */}
              <div className="shrink-0 text-right">
                <span
                  className={`text-sm font-bold ${t.lift > 5 ? "text-red-400" : t.lift > 2 ? "text-orange-400" : "text-yellow-400"}`}
                >
                  {t.lift.toFixed(1)}×
                </span>
                <p className="text-xs text-gray-600">frequency lift</p>
              </div>
            </div>

            {/* Frequency comparison bar */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${Math.min(t.anomaly_rate * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-24 text-right">
                {(t.anomaly_rate * 100).toFixed(1)}% vs{" "}
                {(t.baseline_rate * 100).toFixed(1)}% baseline
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
