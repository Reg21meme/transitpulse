"use client";

import type { DelayByLineHour } from "@/lib/api";

interface Props {
  data: DelayByLineHour[];
}

// Fixed line order (matches how riders think about the system).
const LINE_ORDER = ["Red", "Orange", "Blue", "Green-B", "Green-C", "Green-D", "Green-E"];

// Color ramp by average delay in minutes. Negatives/on-time = green, climbing to red.
function delayColor(mins: number): string {
  if (mins <= 1) return "#1a7f37"; // on time (incl. early)
  if (mins <= 3) return "#b8a600"; // minor
  if (mins <= 6) return "#d97706"; // moderate
  return "#dc2626"; // severe
}

export default function DelayHeatmap({ data }: Props) {
  if (data.length === 0) {
    return <p className="mt-2 text-sm text-neutral-500">No delay data yet — run the ingestion loop to collect arrivals.</p>;
  }
  // Which hours actually appear in the data (sorted).
  const hours = Array.from(new Set(data.map((d) => d.hour))).sort((a, b) => a - b);
  
  // Fast lookup: "route|hour" -> cell.
  const cellMap = new Map<string, DelayByLineHour>();
  for (const d of data) cellMap.set(`${d.route_id}|${d.hour}`, d);

  // Only show lines that have data, in our preferred order.
  const linesPresent = LINE_ORDER.filter((line) =>
    data.some((d) => d.route_id === line)
  );

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="border-separate" style={{ borderSpacing: 2 }}>
        <thead>
          <tr>
            <th className="pr-2 text-right text-xs font-medium text-neutral-400"></th>
            {hours.map((h) => (
              <th key={h} className="text-center text-[10px] font-medium text-neutral-500" style={{ width: 28 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linesPresent.map((line) => (
            <tr key={line}>
              <td className="pr-2 text-right text-xs font-medium text-neutral-300 whitespace-nowrap">
                {line}
              </td>
              {hours.map((h) => {
                const cell = cellMap.get(`${line}|${h}`);
                if (!cell) {
                  return (
                    <td key={h}>
                      <div
                        className="rounded-sm"
                        style={{ width: 28, height: 28, background: "#1a1a1a" }}
                        title={`${line} @ ${h}:00 — no data`}
                      />
                    </td>
                  );
                }
                return (
                  <td key={h}>
                    <div
                      className="rounded-sm cursor-default"
                      style={{
                        width: 28,
                        height: 28,
                        background: delayColor(cell.avg_delay_minutes),
                      }}
                      title={`${line} @ ${h}:00 — ${cell.avg_delay_minutes} min avg (${cell.count} arrivals)`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-400">
        <span>Avg delay:</span>
        <Legend color="#1a7f37" label="≤1 min" />
        <Legend color="#b8a600" label="1–3" />
        <Legend color="#d97706" label="3–6" />
        <Legend color="#dc2626" label="6+ min" />
        <Legend color="#1a1a1a" label="no data" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block rounded-sm" style={{ width: 14, height: 14, background: color }} />
      {label}
    </span>
  );
}