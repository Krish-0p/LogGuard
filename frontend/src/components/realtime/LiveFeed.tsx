import { useLiveFeedStore } from "../../store/useLiveFeedStore";
import { formatDistanceToNow } from "date-fns";
import { clsx } from "clsx";

export function LiveFeed() {
  const { anomalies, isConnected, unreadCount, markAllRead } =
    useLiveFeedStore();

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="material-symbols-outlined text-[#33ff33] text-sm">
              wifi
            </span>
          ) : (
            <span className="material-symbols-outlined text-[#ff3333] text-sm animate-pulse">
              wifi_off
            </span>
          )}
          <span className="text-sm font-bold text-white uppercase tracking-widest">
            Live Feed
          </span>
          {unreadCount > 0 && (
            <span className="bg-[#ff3333] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[10px] text-[#aaaaaa] hover:text-white px-2 py-1 font-bold uppercase tracking-wider transition-colors"
            >
              Mark read
            </button>
          )}
        </div>
      </div>

      {/* Feed items */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 bg-transparent">
        {anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#aaaaaa] gap-3 opacity-50">
            <span className="material-symbols-outlined text-3xl">sensors</span>
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Awaiting Telemetry
            </p>
          </div>
        ) : (
          anomalies.map((anomaly, i) => {
            const pct = Math.round(anomaly.final_score * 100);
            return (
              <div
                key={`${anomaly.id}-${anomaly.scored_at}`}
                className={clsx(
                  "p-4 hover:bg-white/5 transition-colors duration-200 cursor-pointer group",
                  "animate-fade-in",
                  i === 0 && "bg-white/10 border-l-2 border-[#ff3333]", // Highlight newest
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">
                    {anomaly.host}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-white bg-white/10 px-2 py-0.5 rounded backdrop-blur-md">
                      {pct}%
                    </span>
                  </div>
                </div>
                {anomaly.log_text && (
                  <div className="bg-black/30 rounded p-2 mb-2 border border-white/5">
                    <p
                      className="text-[10px] font-mono text-white/80 line-clamp-2 break-all mb-1"
                      title={anomaly.log_text}
                    >
                      {anomaly.log_text}
                    </p>
                    {anomaly.log_problem && (
                      <p className="text-[9px] text-[#ff3333] font-bold mt-1 uppercase tracking-wider">
                        ↳ {anomaly.log_problem}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#aaaaaa]">
                    {anomaly.error_rate !== null && (
                      <span className="text-[#ff3333] font-mono font-bold tracking-wider">
                        {(anomaly.error_rate * 100).toFixed(1)}% errors
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-mono text-[#aaaaaa]/60 uppercase tracking-wider">
                    {formatDistanceToNow(new Date(anomaly.scored_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
