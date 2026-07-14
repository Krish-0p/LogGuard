import { useEffect, useRef } from 'react';
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { useWebSocket } from "../hooks/useWebSocket";
import { useAnomalies } from "../hooks/useAnomalies";
import { AnomalyTimeline } from "../components/anomaly/AnomalyTimeline";
import { AnomalyTable } from "../components/anomaly/AnomalyTable";
import { LiveFeed } from "../components/realtime/LiveFeed";
import { PageShell } from "../components/layout/PageShell";
import { useLiveFeedStore } from "../store/useLiveFeedStore";
import { HostGrid } from "../components/hosts/HostGrid";

export function Dashboard() {
  useWebSocket();
  const { isConnected } = useLiveFeedStore();
  const { data: recentAnomalies, isLoading } = useAnomalies({
    min_score: 0.0,
    limit: 50,
  });

  
  const emailSentRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!recentAnomalies) return;
    
    // Count occurrences of each anomaly type or host
    const anomalyCounts = recentAnomalies.filter(a => a.is_anomaly).reduce((acc, curr) => {
      const key = curr.anomaly_type || curr.host || "Unknown Anomaly";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [type, count] of Object.entries(anomalyCounts)) {
      if (count >= 30 && !emailSentRef.current.has(type)) {
        emailSentRef.current.add(type);
        
        // Find max score for this group to calculate crash percentage
        const related = recentAnomalies.filter(a => a.anomaly_type === type || a.host === type);
        const maxScore = related.length > 0 ? Math.max(...related.map(a => a.final_score)) : 0.99;
        const crashRate = (maxScore * 100).toFixed(1) + "%";

        // Call the backend alerting endpoint
        apiClient.post("/alerting/send_repeated_anomaly_email", {
          summary: `Repeated Anomaly: '${type}' occurred ${count} times within the current dashboard view.`,
          crash_percentage: crashRate
        }).then(res => {
           console.log("CRITICAL ALERT EMAIL SENT for repeated anomaly:", type);
        }).catch(err => console.error("Failed to send alert email", err));
      }
    }
  }, [recentAnomalies]);
  const activeAnomalies =
    recentAnomalies?.filter((a) => a.is_anomaly).length ?? 0;
  const hostsCount = new Set(recentAnomalies?.map((a) => a.host)).size ?? 0;
  const latestAnomaly = recentAnomalies?.find((a) => a.is_anomaly);

  return (
    <PageShell>
      {/* KPI Section (Asymmetric Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Large Status Card */}
        <div className="md:col-span-2 bg-white dark:bg-white dark:bg-white dark:bg-white/5 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 backdrop-blur-xl border border-white/10 rounded-xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa] text-[10px] font-bold uppercase tracking-widest mb-2">
                Active Anomalies
              </p>
              <h3 className="text-5xl font-black tracking-tighter text-black dark:text-black dark:text-black dark:text-white">
                {activeAnomalies}
              </h3>
            </div>
            <div className="p-3 bg-white dark:bg-white dark:bg-white dark:bg-white/5 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-white/10 rounded-xl backdrop-blur-md">
              <span className="material-symbols-outlined text-black dark:text-black dark:text-black dark:text-white">
                warning
              </span>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-3 z-10">
            <span
              className={`px-2 py-1 bg-white/10 rounded backdrop-blur-sm border border-white/5 text-[10px] tracking-widest font-bold uppercase ${activeAnomalies > 0 ? "text-[#ff3333]" : "text-[#33ff33]"}`}
            >
              {activeAnomalies > 0 ? "Action Required" : "System Stable"}
            </span>
            <p className="text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa] text-[10px] uppercase tracking-wider font-mono">
              Real-time node detection
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 backdrop-blur-xl border border-white/10 rounded-xl p-8 flex flex-col justify-between shadow-2xl">
          <div>
            <p className="text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa] text-[10px] font-bold uppercase tracking-widest mb-2">
              Monitored Hosts
            </p>
            <h3 className="text-4xl font-black tracking-tighter text-black dark:text-black dark:text-black dark:text-white">
              {hostsCount}
            </h3>
          </div>
          <div className="mt-8 h-1 bg-white/10 backdrop-blur-md rounded-full overflow-hidden">
            <div className="w-full h-full bg-white"></div>
          </div>
        </div>

        <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 backdrop-blur-xl border border-white/10 rounded-xl p-8 flex flex-col justify-between shadow-2xl">
          <div>
            <p className="text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa] text-[10px] font-bold uppercase tracking-widest mb-2">
              Stream Status
            </p>
            <h3
              className={`text-4xl font-black tracking-tighter ${isConnected ? "text-[#33ff33]" : "text-[#ff3333]"}`}
            >
              {isConnected ? "LIVE" : "WAIT"}
            </h3>
          </div>
          <p className="text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa]/60 text-[10px] uppercase tracking-widest font-mono mt-8">
            {isConnected ? "WSS:// Connected" : "Reconnecting..."}
          </p>
        </div>
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-white dark:bg-white dark:bg-white/5 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 backdrop-blur-xl border border-white/10 rounded-xl p-8 flex flex-col shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="text-black dark:text-black dark:text-black dark:text-white font-bold text-lg tracking-tight">
                Anomaly Score Timeline
              </h4>
              <p className="text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa] text-xs mt-1">
                Real-time multivariate signal decomposition
              </p>
            </div>
          </div>
          <div className="flex-1 w-full relative min-h-[300px]">
            <AnomalyTimeline />
          </div>
        </div>

        {/* Model Breakdown Card */}
        <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 backdrop-blur-xl border border-white/10 rounded-xl p-8 shadow-2xl">
          <h4 className="text-black dark:text-black dark:text-black dark:text-white font-bold text-lg tracking-tight mb-8">
            Architecture Weights
          </h4>
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa]">
                  Autoencoder
                </span>
                <span className="text-xs font-black text-black dark:text-black dark:text-black dark:text-white">
                  60%
                </span>
              </div>
              <div className="h-1.5 bg-white dark:bg-white dark:bg-white dark:bg-white/5 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 rounded-full overflow-hidden">
                <div className="w-[60%] h-full bg-gradient-to-r from-white/40 to-white rounded-full"></div>
              </div>
              <p className="mt-3 text-[10px] text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa] leading-relaxed">
                Handling deep reconstruction error analysis for complex packet
                patterns.
              </p>
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa]">
                  Isolation Forest
                </span>
                <span className="text-xs font-black text-[#ffff33]">40%</span>
              </div>
              <div className="h-1.5 bg-white dark:bg-white dark:bg-white dark:bg-white/5 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 rounded-full overflow-hidden">
                <div className="w-[40%] h-full bg-gradient-to-r from-[#ffff33]/40 to-[#ffff33] rounded-full"></div>
              </div>
              <p className="mt-3 text-[10px] text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa] leading-relaxed">
                Identifying rapid structural deviations in high-volume traffic
                clusters.
              </p>
            </div>

            <div className="mt-8 p-4 bg-white dark:bg-white dark:bg-white dark:bg-white/5 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-white/10 rounded-xl backdrop-blur-md">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#33ff33] text-sm">
                  verified_user
                </span>
                <span className="text-[#33ff33] text-[10px] font-bold uppercase tracking-widest">
                  Consensus: High
                </span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa] leading-relaxed">
                Both models currently align on detected patterns with strict
                confidence.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col">
          <h3 className="text-black dark:text-black dark:text-black dark:text-white font-bold text-lg tracking-tight mb-4 px-2">
            Detection Manifest
          </h3>
          <AnomalyTable
            anomalies={recentAnomalies ?? []}
            isLoading={isLoading}
          />

          <HostGrid anomalies={recentAnomalies ?? []} isLoading={isLoading} />
        </div>
        <div className="flex flex-col">
          <h3 className="text-black dark:text-black dark:text-black dark:text-white font-bold text-lg tracking-tight mb-4 px-2">
            Live Telemetry
          </h3>
          <div className="h-[460px]">
            <LiveFeed />
          </div>

          {latestAnomaly && latestAnomaly.log_problem && (
            <div className="mt-6 bg-[#ff3333]/10 border border-[#ff3333]/30 backdrop-blur-xl rounded-xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#ff3333]"></div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#ff3333] text-sm">
                  emergency
                </span>
                <h4 className="text-[#ff3333] font-bold text-sm tracking-widest uppercase">
                  Latest Diagnostic
                </h4>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-black dark:text-black dark:text-black dark:text-white font-mono text-xs mb-4 bg-black/40 p-3 rounded border border-white/5 break-all max-h-32 overflow-y-auto">
                    {latestAnomaly.log_text}
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa] text-xs leading-relaxed">
                    <span className="font-bold text-black dark:text-black dark:text-black dark:text-white">
                      Rule Hit:
                    </span>{" "}
                    {latestAnomaly.log_problem}
                  </p>
                </div>
                <Link
                  to={`/rca/${latestAnomaly.id}`}
                  className="ml-4 flex-shrink-0 px-4 py-2 bg-[#ff3333] hover:bg-[#ff1a1a] text-black dark:text-black dark:text-black dark:text-white text-[10px] font-black uppercase tracking-widest rounded shadow-[0_0_20px_rgba(255,51,51,0.5)] transition-all inline-flex items-center"
                >
                  Deep RCA
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
