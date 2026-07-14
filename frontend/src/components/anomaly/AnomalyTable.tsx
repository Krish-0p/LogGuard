import { useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AnomalyScore } from "../../types/anomaly";
import { format } from "date-fns";

const columnHelper = createColumnHelper<AnomalyScore>();

export function AnomalyTable({
  anomalies,
  isLoading,
}: {
  anomalies: AnomalyScore[];
  isLoading: boolean;
}) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("scored_at", {
        header: "Timestamp (UTC)",
        cell: (info) => (
          <span className="text-sm font-mono text-[#aaaaaa] whitespace-nowrap">
            {format(new Date(info.getValue()), "HH:mm:ss.SSS")}
          </span>
        ),
      }),
      columnHelper.accessor("host", {
        header: "Entity / Node ID",
        cell: (info) => (
          <span className="text-sm font-bold text-white">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("final_score", {
        header: "Confidence",
        cell: (info) => {
          const val = info.getValue();
          const pct = Math.round(val * 100);
          return (
            <div className="flex items-center gap-2">
              <div className="w-12 h-1.5 bg-white/10 backdrop-blur-md rounded-full">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-bold text-[#aaaaaa]">
                {pct}%
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("is_anomaly", {
        header: "Severity",
        cell: (info) => {
          const val = info.row.original.final_score;
          if (val > 0.8) {
            return (
              <span className="px-2 py-0.5 border border-[#ff3333]/30 bg-[#ff3333]/10 text-[#ff3333] text-[10px] font-bold uppercase tracking-wider rounded-sm backdrop-blur-sm">
                Critical
              </span>
            );
          } else if (val > 0.6) {
            return (
              <span className="px-2 py-0.5 border border-[#ffff33]/30 bg-[#ffff33]/10 text-[#ffff33] text-[10px] font-bold uppercase tracking-wider rounded-sm backdrop-blur-sm">
                Warning
              </span>
            );
          } else {
            return (
              <span className="px-2 py-0.5 border border-[#33ff33]/30 bg-[#33ff33]/10 text-[#33ff33] text-[10px] font-bold uppercase tracking-wider rounded-sm backdrop-blur-sm">
                Stable
              </span>
            );
          }
        },
      }),
      columnHelper.accessor("log_text", {
        header: "Logs",
        cell: (info) => (
          <span
            className="text-sm text-[#aaaaaa] font-mono truncate block max-w-[200px]"
            title={info.getValue() || "-"}
          >
            {info.getValue() || "-"}
          </span>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: anomalies,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading)
    return (
      <div className="h-64 bg-white/5 backdrop-blur-md border border-white/10 animate-pulse rounded-xl mt-4"></div>
    );

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden mt-4 shadow-2xl">
      <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-black/60 border-b border-white/10 backdrop-blur-xl text-[10px] uppercase tracking-widest text-[#888888]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 font-bold whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-white/5">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-[#aaaaaa]"
                >
                  No recent activity detected.
                </td>
              </tr>
            ) : null}
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-white/5 transition-colors duration-200"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
