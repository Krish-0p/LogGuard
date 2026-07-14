import { useState } from "react";

export function DemoButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const triggerAnomaly = async () => {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("http://localhost:8000/api/v1/demo/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: 300, count: 5 }),
      });
      const data = await res.json();
      setResult(`✅ ${data.message}`);
    } catch (e) {
      console.error("Failed to trigger demo:", e);
      setResult("❌ Failed to inject");
    } finally {
      setTimeout(() => {
        setLoading(false);
        setResult("");
      }, 4000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={triggerAnomaly}
        disabled={loading}
        className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all duration-300
          ${
            loading
              ? "bg-[#ff3333]/20 backdrop-blur-md text-[#ff3333] border border-[#ff3333]/30 hover:cursor-not-allowed animate-pulse"
              : "bg-white/10 text-white border border-white/30 hover:bg-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          }`}
      >
        {loading ? "🚨 Injecting Attacks..." : "Trigger Demo Anomaly"}
      </button>
      {result && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-black/90 border border-white/10 rounded-lg text-[10px] text-[#33ff33] font-mono whitespace-nowrap backdrop-blur-xl shadow-xl z-50">
          {result}
        </div>
      )}
    </div>
  );
}
