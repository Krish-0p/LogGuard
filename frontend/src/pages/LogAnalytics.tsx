import { useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import axios from "axios";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import { format } from "date-fns";

const API = "http://localhost:8000/api/v1";
const TENANT = "fda5918c-41a1-4638-9eb2-7e303b98a46c";
const HEADERS = { "X-Tenant-ID": TENANT };

export function LogAnalytics() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setStatus("");
    setResults([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${API}/logs/analyze-csv-offline`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...HEADERS,
          },
        },
      );
      setStatus(`Success: Analyzed ${res.data.results.length} time windows.`);
      setResults(res.data.results);
    } catch (e: any) {
      setStatus(`Error: ${e.response?.data?.detail || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatXAxis = (tickItem: string) => {
    try {
      return format(new Date(tickItem), "HH:mm");
    } catch (e) {
      return tickItem;
    }
  };

  const anomaliesCount = results.filter((r) => r.is_anomaly).length;

  return (
    <PageShell>
      <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 backdrop-blur-xl border border-white/10 rounded-xl p-8 shadow-2xl flex flex-col gap-8">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-black dark:text-black dark:text-black dark:text-white uppercase mb-4">
            Log Analytics (Offline ML Studio)
          </h2>
          <p className="text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa] text-sm mb-6">
            Upload a CSV file of logs to instantly generate localized telemetry
            features and run offline machine learning models directly on the
            upload map.
          </p>

          <div className="flex flex-col gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) =>
                setFile(e.target.files ? e.target.files[0] : null)
              }
              className="block w-full text-sm text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-black dark:text-black dark:text-black dark:text-white hover:file:bg-white/20 transition-all border border-white/10 p-2 rounded-lg"
            />
            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className={`px-6 py-3 rounded-lg font-bold tracking-widest uppercase text-sm w-fit transition-all ${!file || loading ? "bg-white/5 text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa] cursor-not-allowed" : "bg-[#33ff33]/20 hover:bg-[#33ff33]/30 text-[#33ff33] border border-[#33ff33]/50"}`}
            >
              {loading ? "Processing ML..." : "Analyze Log File"}
            </button>

            {status && (
              <div
                className={`mt-4 p-4 rounded-lg text-sm border ${status.startsWith("Error") ? "bg-[#ff3333]/10 border-[#ff3333]/30 text-[#ff3333]" : "bg-[#33ff33]/10 border-[#33ff33]/30 text-[#33ff33]"}`}
              >
                {status}
              </div>
            )}
          </div>
        </div>

        {results.length > 0 && (
          <div className="border-t border-white/10 pt-8 flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 rounded-xl border border-white/10 p-6 flex flex-col gap-2 relative">
                <p className="text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa] text-[10px] font-bold uppercase tracking-widest">
                  Time Windows Analyzed
                </p>
                <h3 className="text-4xl font-black text-black dark:text-black dark:text-black dark:text-white">
                  {results.length}
                </h3>
              </div>
              <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 rounded-xl border border-white/10 p-6 flex flex-col gap-2 relative">
                <p className="text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa] text-[10px] font-bold uppercase tracking-widest">
                  Anomalies Detected
                </p>
                <h3
                  className={`text-4xl font-black ${anomaliesCount > 0 ? "text-[#ff3333]" : "text-[#33ff33]"}`}
                >
                  {anomaliesCount}
                </h3>
              </div>
              <div className="bg-white dark:bg-white dark:bg-white dark:bg-white/5 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300 rounded-xl border border-white/10 p-6 flex flex-col gap-2 relative">
                <p className="text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa] text-[10px] font-bold uppercase tracking-widest">
                  Avg Anomaly Score
                </p>
                <h3 className="text-4xl font-black text-gray-500 dark:text-gray-500 dark:text-gray-500 dark:text-[#aaaaaa]">
                  {(
                    results.reduce((a, b) => a + b.anomaly_score, 0) /
                    results.length
                  ).toFixed(3)}
                </h3>
              </div>
            </div>

            <div className="bg-black/50 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-bold uppercase text-black dark:text-black dark:text-black dark:text-white mb-6 tracking-widest px-4">
                Anomaly Score & Error Rate over Time
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={results}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorScore"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#ff3333"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ff3333"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={formatXAxis}
                      stroke="#666"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#111",
                        border: "1px solid #333",
                      }}
                      labelFormatter={(label) =>
                        format(new Date(label), "PPP HH:mm:ss")
                      }
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="anomaly_score"
                      stroke="#ff3333"
                      fillOpacity={1}
                      fill="url(#colorScore)"
                      name="Anomaly Score"
                    />
                    <Line
                      type="monotone"
                      dataKey="error_rate"
                      stroke="#ffaa00"
                      strokeWidth={2}
                      name="Error Rate"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-black/50 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-bold uppercase text-black dark:text-black dark:text-black dark:text-white mb-6 tracking-widest px-4">
                Log Volume over Time
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={results}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#333"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={formatXAxis}
                      stroke="#666"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#111",
                        border: "1px solid #333",
                      }}
                      labelFormatter={(label) =>
                        format(new Date(label), "PPP HH:mm:ss")
                      }
                    />
                    <Bar
                      dataKey="log_volume"
                      fill="#0080ff"
                      radius={[4, 4, 0, 0]}
                      name="Log Volume"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
