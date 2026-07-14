import { useEffect, useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import axios from "axios";
import {
  AlertTriangle,
  Activity,
  Layers,
  Terminal,
  ChevronRight,
  Shield,
  Clock,
  Server,
  TrendingUp,
} from "lucide-react";

const API = "http://localhost:8000/api/v1";
const TENANT = "fda5918c-41a1-4638-9eb2-7e303b98a46c";
const HEADERS = { "X-Tenant-ID": TENANT };

interface LogEntry {
  id: number;
  timestamp: string;
  host: string;
  score: number;
  log_text: string;
  error_rate: number;
  log_volume: number;
}

interface Incident {
  root_cause: string;
  occurrence_count: number;
  first_seen: string;
  last_seen: string;
  avg_score: number;
  max_score: number;
  severity: string;
  affected_hosts: string[];
  sample_logs: LogEntry[];
}

interface Overview {
  total_anomalies: number;
  unique_incidents: number;
  affected_hosts: number;
  overall_avg_score: number;
  peak_score: number;
  time_range: { from: string | null; to: string | null };
}

interface SummaryData {
  overview: Overview;
  incidents: Incident[];
  hours_back: number;
}

export function RootCauseAnalysis() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [hoursBack, setHoursBack] = useState(24);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${API}/rca/summary`, {
          params: { hours_back: hoursBack },
          headers: HEADERS,
        });
        setData(res.data);
        if (
          res.data.incidents.length > 0 &&
          selectedIdx >= res.data.incidents.length
        ) {
          setSelectedIdx(0);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load RCA summary.");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
    const interval = setInterval(fetchSummary, 15000);
    return () => clearInterval(interval);
  }, [hoursBack]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const severityColor = (s: string) =>
    s === "critical"
      ? "text-[#ff3333]"
      : s === "warning"
        ? "text-[#ffff33]"
        : "text-[#33ff33]";
  const severityBg = (s: string) =>
    s === "critical"
      ? "bg-[#ff3333]/10 border-[#ff3333]/30"
      : s === "warning"
        ? "bg-[#ffff33]/10 border-[#ffff33]/30"
        : "bg-[#33ff33]/10 border-[#33ff33]/30";
  const severityBorder = (s: string) =>
    s === "critical"
      ? "border-l-[#ff3333]"
      : s === "warning"
        ? "border-l-[#ffff33]"
        : "border-l-[#33ff33]";

  const selected = data?.incidents[selectedIdx] || null;

  return (
    <PageShell>
      {/* Overview Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white">
              Root Cause Analysis
            </h1>
            <p className="text-[#aaaaaa] text-xs mt-1">
              Consolidated incident report — Last {hoursBack}h
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={hoursBack}
              onChange={(e) => {
                setHoursBack(Number(e.target.value));
                setLoading(true);
              }}
              className="bg-[#111111] border border-[#333] transition-colors duration-300 shadow-none border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-bold uppercase tracking-wider appearance-none cursor-pointer focus:outline-none focus:border-white/30"
            >
              <option
                className="bg-zinc-950 text-white"
                value={1}
              >
                Last 1h
              </option>
              <option
                className="bg-zinc-950 text-white"
                value={6}
              >
                Last 6h
              </option>
              <option
                className="bg-zinc-950 text-white"
                value={12}
              >
                Last 12h
              </option>
              <option
                className="bg-zinc-950 text-white"
                value={24}
              >
                Last 24h
              </option>
              <option
                className="bg-zinc-950 text-white"
                value={72}
              >
                Last 3 days
              </option>
              <option
                className="bg-zinc-950 text-white"
                value={168}
              >
                Last 7 days
              </option>
            </select>
            <div className="px-3 py-2 bg-[#ff3333]/10 border border-[#ff3333]/30 rounded-lg flex items-center gap-2 backdrop-blur-md">
              <Shield className="h-4 w-4 text-[#ff3333]" />
              <span className="text-[#ff3333] font-bold text-[10px] uppercase tracking-widest">
                Incident Report
              </span>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-[#111111] border border-white/10 transition-colors duration-300 shadow-none backdrop-blur-xl rounded-xl p-4">
              <p className="text-[#aaaaaa] text-[10px] font-bold uppercase tracking-widest mb-1">
                Total Anomalies
              </p>
              <p className="text-white text-2xl font-black">
                {data.overview.total_anomalies}
              </p>
            </div>
            <div className="bg-[#111111] border border-white/10 transition-colors duration-300 shadow-none backdrop-blur-xl rounded-xl p-4">
              <p className="text-[#aaaaaa] text-[10px] font-bold uppercase tracking-widest mb-1">
                Unique Incidents
              </p>
              <p className="text-[#ffff33] text-2xl font-black">
                {data.overview.unique_incidents}
              </p>
            </div>
            <div className="bg-[#111111] border border-white/10 transition-colors duration-300 shadow-none backdrop-blur-xl rounded-xl p-4">
              <p className="text-[#aaaaaa] text-[10px] font-bold uppercase tracking-widest mb-1">
                Affected Hosts
              </p>
              <p className="text-white text-2xl font-black">
                {data.overview.affected_hosts}
              </p>
            </div>
            <div className="bg-[#111111] border border-white/10 transition-colors duration-300 shadow-none backdrop-blur-xl rounded-xl p-4">
              <p className="text-[#aaaaaa] text-[10px] font-bold uppercase tracking-widest mb-1">
                Avg Risk
              </p>
              <p
                className={`text-2xl font-black ${data.overview.overall_avg_score > 0.8 ? "text-[#ff3333]" : data.overview.overall_avg_score > 0.5 ? "text-[#ffff33]" : "text-[#33ff33]"}`}
              >
                {(data.overview.overall_avg_score * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-[#111111] border border-white/10 transition-colors duration-300 shadow-none backdrop-blur-xl rounded-xl p-4">
              <p className="text-[#aaaaaa] text-[10px] font-bold uppercase tracking-widest mb-1">
                Peak Score
              </p>
              <p
                className={`text-2xl font-black ${data.overview.peak_score > 0.8 ? "text-[#ff3333]" : "text-[#ffff33]"}`}
              >
                {(data.overview.peak_score * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-48 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
          <p className="text-[#aaaaaa] text-xs uppercase tracking-widest">
            Aggregating incident data...
          </p>
        </div>
      ) : error ? (
        <div className="bg-[#111111] border border-white/10 transition-colors duration-300 shadow-none backdrop-blur-xl rounded-xl p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-[#ffff33] mx-auto mb-4" />
          <p className="text-white font-bold text-lg mb-2">
            No Data Available
          </p>
          <p className="text-[#aaaaaa] text-sm">
            {error}
          </p>
        </div>
      ) : data && data.incidents.length === 0 ? (
        <div className="bg-[#111111] border border-white/10 transition-colors duration-300 shadow-none backdrop-blur-xl rounded-xl p-12 text-center">
          <Shield className="h-16 w-16 text-[#33ff33] mx-auto mb-4" />
          <p className="text-white font-bold text-xl mb-2">
            All Systems Stable
          </p>
          <p className="text-[#aaaaaa] text-sm">
            No anomalous incidents detected in the last {hoursBack} hours.
          </p>
        </div>
      ) : data ? (
        <div className="flex gap-5 items-stretch min-h-[800px] h-[800px]">
          {/* Left: Incident List */}
          <div className="w-[340px] flex-shrink-0 flex flex-col bg-[#111111] border border-white/10 transition-colors duration-300 shadow-none backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-black/30">
              <h2 className="text-white font-bold text-xs tracking-widest uppercase">
                Incident Groups
              </h2>
              <p className="text-[#aaaaaa] text-[10px] mt-0.5 font-mono">
                {data.incidents.length} unique root causes identified
              </p>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {data.incidents.map((inc, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIdx(idx)}
                  className={`w-full text-left px-4 py-4 border-b border-white/5 transition-all duration-200 group relative border-l-2 ${
                    selectedIdx === idx
                      ? `bg-white/10 ${severityBorder(inc.severity)}`
                      : `hover:bg-white/5 border-l-transparent`
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${severityBg(inc.severity)} ${severityColor(inc.severity)} uppercase`}
                      >
                        {inc.severity}
                      </span>
                      <span className="text-white font-black text-xs">
                        {inc.occurrence_count}x
                      </span>
                    </div>
                    <ChevronRight
                      className={`h-3 w-3 transition-colors ${selectedIdx === idx ? "text-white" : "text-[#aaaaaa]/30"}`}
                    />
                  </div>
                  <p className="text-[#cccccc] text-[11px] leading-relaxed line-clamp-2 mb-2">
                    {inc.root_cause}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[#33ff33] text-[10px] font-mono">
                      {formatTime(inc.last_seen)}
                    </span>
                    <span className="text-[#aaaaaa]/60 text-[10px]">
                      {inc.affected_hosts.length} host
                      {inc.affected_hosts.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Incident Detail */}
          <div className="flex-1 flex flex-col min-h-0">
            {selected ? (
              <div className="space-y-5 flex flex-col h-full">
                {/* Incident Header */}
                <div
                  className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl relative overflow-hidden`}
                >
                  <div
                    className={`absolute top-0 left-0 w-1 h-full ${selected.severity === "critical" ? "bg-[#ff3333]" : selected.severity === "warning" ? "bg-[#ffff33]" : "bg-[#33ff33]"}`}
                  ></div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Activity
                        className={`h-5 w-5 ${severityColor(selected.severity)}`}
                      />
                      <h2 className="text-white font-bold text-lg tracking-tight uppercase">
                        Incident Analysis
                      </h2>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded border ${severityBg(selected.severity)} ${severityColor(selected.severity)} uppercase tracking-widest`}
                    >
                      {selected.severity} — {selected.occurrence_count}{" "}
                      occurrences
                    </span>
                  </div>
                  <p className="text-[#cccccc] text-sm leading-relaxed">
                    {selected.root_cause}
                  </p>
                </div>

                {/* Meta Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-[#111111] border border-white/10 transition-colors duration-300 shadow-none backdrop-blur-xl rounded-xl p-4 flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-[#aaaaaa]" />
                    <div>
                      <p className="text-[#aaaaaa] text-[10px] font-bold uppercase tracking-widest">
                        Peak Score
                      </p>
                      <p
                        className={`text-lg font-black ${selected.max_score > 0.8 ? "text-[#ff3333]" : "text-[#ffff33]"}`}
                      >
                        {(selected.max_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#111111] border border-white/10 transition-colors duration-300 shadow-none backdrop-blur-xl rounded-xl p-4 flex items-center gap-3">
                    <Clock className="h-4 w-4 text-[#aaaaaa]" />
                    <div>
                      <p className="text-[#aaaaaa] text-[10px] font-bold uppercase tracking-widest">
                        First Seen
                      </p>
                      <p className="text-white text-xs font-mono">
                        {formatTime(selected.first_seen)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#111111] border border-white/10 transition-colors duration-300 shadow-none backdrop-blur-xl rounded-xl p-4 flex items-center gap-3">
                    <Clock className="h-4 w-4 text-[#aaaaaa]" />
                    <div>
                      <p className="text-[#aaaaaa] text-[10px] font-bold uppercase tracking-widest">
                        Last Seen
                      </p>
                      <p className="text-white text-xs font-mono">
                        {formatTime(selected.last_seen)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#111111] border border-white/10 transition-colors duration-300 shadow-none backdrop-blur-xl rounded-xl p-4 flex items-center gap-3">
                    <Server className="h-4 w-4 text-[#aaaaaa]" />
                    <div>
                      <p className="text-[#aaaaaa] text-[10px] font-bold uppercase tracking-widest">
                        Hosts Affected
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selected.affected_hosts.map((h, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono text-white bg-white/10 px-1.5 py-0.5 rounded"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Anomaly Logs in this Incident Group */}
                <div className="bg-[#111111] border border-white/10 transition-colors duration-300 shadow-none backdrop-blur-xl rounded-xl p-6 shadow-2xl flex flex-col flex-1 min-h-0">
                  <div className="flex items-center justify-between mb-5 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <Terminal className="h-4 w-4 text-white" />
                      <h2 className="text-white font-bold text-sm tracking-tight uppercase">
                        Event Timeline
                      </h2>
                    </div>
                    <span className="text-[#aaaaaa] text-[10px] uppercase tracking-widest font-bold">
                      Showing {selected.sample_logs.length} of{" "}
                      {selected.occurrence_count}
                    </span>
                  </div>
                  <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {selected.sample_logs.map((log, idx) => (
                      <div
                        key={idx}
                        className="bg-black/60 border border-white/5 rounded-lg p-4 font-mono text-[10px] hover:border-white/10 transition-colors relative"
                      >
                        {/* Timeline connector line */}
                        {idx < selected.sample_logs.length - 1 && (
                          <div className="absolute left-7 top-full w-px h-2 bg-white/10"></div>
                        )}
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-2 w-2 rounded-full flex-shrink-0 ${log.score > 0.8 ? "bg-[#ff3333]" : log.score > 0.5 ? "bg-[#ffff33]" : "bg-[#33ff33]"} shadow-[0_0_6px_currentColor]`}
                            ></div>
                            <span className="text-[#33ff33] font-bold">
                              {formatTime(log.timestamp)}
                            </span>
                            <span className="text-[#aaaaaa] uppercase tracking-widest font-bold">
                              {log.host}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[#aaaaaa]">
                              Vol: {log.log_volume}
                            </span>
                            <span className="text-[#aaaaaa]">
                              Err: {(log.error_rate * 100).toFixed(1)}%
                            </span>
                            <span
                              className={`font-black px-1.5 py-0.5 rounded border ${log.score > 0.8 ? "text-[#ff3333] bg-[#ff3333]/10 border-[#ff3333]/20" : "text-[#ffff33] bg-[#ffff33]/10 border-[#ffff33]/20"}`}
                            >
                              {(log.score * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-[#cccccc] break-all whitespace-pre-wrap leading-relaxed pl-5">
                          {log.log_text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-full">
                <Layers className="h-16 w-16 text-[#aaaaaa]/20 mb-4" />
                <p className="text-[#aaaaaa] text-sm">
                  Select an incident group to analyze.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
