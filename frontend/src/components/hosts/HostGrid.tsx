import { AnomalyScore } from "../../types/anomaly";

export function HostGrid({
  anomalies,
  isLoading,
}: {
  anomalies: AnomalyScore[];
  isLoading: boolean;
}) {
  if (isLoading)
    return (
      <div className="h-24 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl animate-pulse rounded-xl"></div>
    );

  // Group by host to get only the LATEST score (since anomalies are newest-first, the first time we see a host is its latest log)
  const hostScores = anomalies.reduce(
    (acc, curr) => {
      if (!(curr.host in acc)) {
        acc[curr.host] = curr.final_score;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="mt-8">
      <h3 className="text-white font-bold text-lg tracking-tight mb-4 px-2">
        Node Health Metrics
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(hostScores).map(([host, maxScore]) => (
          <div
            key={host}
            className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl hover:bg-white/10 transition-colors p-5 rounded-xl flex flex-col justify-between h-28 relative overflow-hidden group"
          >
            <div
              className="absolute top-0 left-0 w-full h-[2px]"
              style={{
                backgroundColor: maxScore > 0.7 ? "#ff3333" : "#33ff33",
              }}
            ></div>
            <span className="text-white text-sm font-bold truncate z-10">
              {host}
            </span>
            <div className="flex items-end justify-between z-10">
              <span className="text-3xl font-black text-white">
                {(maxScore * 100).toFixed(1)}
                <span className="text-sm text-[#aaaaaa]">%</span>
              </span>
              <span
                className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-widest ${maxScore > 0.7 ? "bg-[#ff3333]/20 text-[#ff3333] border border-[#ff3333]/30" : "bg-[#33ff33]/10 text-[#33ff33] border border-[#33ff33]/30"}`}
              >
                {maxScore > 0.7 ? "Critical" : "Stable"}
              </span>
            </div>
          </div>
        ))}
        {Object.keys(hostScores).length === 0 && (
          <div className="col-span-full py-8 text-center text-[#aaaaaa] border border-dashed border-white/20 rounded-xl bg-white/5 backdrop-blur-sm">
            No nodes detected in current stream.
          </div>
        )}
      </div>
    </div>
  );
}
