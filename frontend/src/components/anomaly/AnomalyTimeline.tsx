import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { format } from "date-fns";
import { useAnomalies } from "../../hooks/useAnomalies";
import { Skeleton } from "../ui/Skeleton";
import type { EChartsOption } from "echarts";

interface AnomalyTimelineProps {
  host?: string;
}

export function AnomalyTimeline({ host }: AnomalyTimelineProps) {
  // Fetch the latest 100 data points (assuming 3s logs, this gives exactly a 5 minute sliding window)
  const { data: rawData, isLoading } = useAnomalies({
    min_score: 0.0,
    limit: 100,
    host,
  });

  const chartOption: EChartsOption = useMemo(() => {
    if (!rawData?.length) return {};

    // Sort array chronological (oldest to newest)
    const timeline = [...rawData].reverse();

    const times = timeline.map((b) =>
      format(new Date(b.scored_at), "HH:mm:ss"),
    );
    const scores = timeline.map((b) => +(b.final_score * 100).toFixed(1));

    return {
      backgroundColor: "transparent",
      grid: { top: 30, right: 20, bottom: 20, left: 40 },
      tooltip: {
        trigger: "axis",
        backgroundColor: "#34343a",
        borderColor: "#404752",
        textStyle: { color: "#e3e1e9" },
        formatter: (params: any) => {
          const i = params[0].dataIndex;
          const b = timeline[i];
          return `
            <div class="p-2 text-sm font-sans">
              <div class="font-bold mb-1 text-[#aaaaaa]">${times[i]}</div>
              <div>Anomaly Score: <b class="text-white">${scores[i]}%</b></div>
              <div>Log Volume: <b>${b.log_volume}</b></div>
              ${b.is_anomaly ? '<div><b style="color:#ff3333">CRITICAL ANOMALY</b></div>' : ""}
            </div>
          `;
        },
      },
      xAxis: {
        type: "category",
        data: times,
        axisLabel: {
          color: "#888888",
          fontSize: 10,
          fontFamily: "Inter",
          formatter: (value: string, index: number) => {
            // Only show some tick labels to prevent crowding
            return index % 10 === 0 ? value : "";
          },
        },
        axisLine: { lineStyle: { color: "#404752" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        axisLabel: {
          color: "#888888",
          fontSize: 11,
          fontFamily: "Inter",
          formatter: "{value}%",
        },
        splitLine: { lineStyle: { color: "#1a1b20", type: "solid" } },
      },
      series: [
        {
          name: "Anomaly Score",
          type: "line",
          data: scores,
          smooth: true,
          lineStyle: { color: "white", width: 3 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(255,255,255,0.15)" },
                { offset: 1, color: "rgba(255,255,255,0.01)" },
              ],
            },
          },
          symbol: "none",
        },
        // Threshold line at 70%
        {
          name: "Threshold",
          type: "line",
          markLine: {
            silent: true,
            symbol: "none",
            data: [{ yAxis: 70 }],
            lineStyle: { color: "#ffff33", type: "dashed", width: 1.5 },
            label: {
              formatter: "Threshold (70%)",
              color: "#ffff33",
              fontSize: 11,
              position: "insideStartTop",
            },
          },
          data: [],
        },
      ],
    };
  }, [rawData]);

  if (isLoading)
    return (
      <Skeleton className="h-full w-full rounded-xl bg-white/5 backdrop-blur-md border border-white/10" />
    );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-end mb-2">
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[#aaaaaa]">
          <span className="flex items-center gap-1">
            <span className="w-3 h-1 bg-[white] inline-block rounded-full" />
            Score
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-1 bg-[#ffff33] inline-block border-t border-dashed" />
            Threshold
          </span>
        </div>
      </div>
      <div className="flex-1 w-full relative">
        <ReactECharts
          option={chartOption}
          style={{
            height: "100%",
            width: "100%",
            position: "absolute",
            top: 0,
            left: 0,
          }}
          opts={{ renderer: "canvas" }}
          notMerge
        />
      </div>
    </div>
  );
}
