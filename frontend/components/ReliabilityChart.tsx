"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ReliabilityByLine } from "@/lib/api";
import { routeColor } from "@/lib/lineColors";

interface Props {
  data: ReliabilityByLine[];
}

export default function ReliabilityChart({ data }: Props) {
  // Sort best-to-worst so the chart reads top-down.
  const sorted = [...data].sort((a, b) => b.reliability_pct - a.reliability_pct);

  return (
    <div className="mt-2 w-full max-w-2xl" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 8, right: 24, bottom: 8, left: 16 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            stroke="#737373"
            fontSize={12}
          />
          <YAxis
            type="category"
            dataKey="route_id"
            stroke="#737373"
            fontSize={12}
            width={70}
          />
          <Tooltip
            cursor={{ fill: "#ffffff10" }}
            contentStyle={{
              background: "#171717",
              border: "1px solid #404040",
              borderRadius: 6,
            }}
            labelStyle={{ color: "#ffffff", fontWeight: 600 }}
            itemStyle={{ color: "#ffffff" }}
            formatter={(value, _name, item) => {
              const p = item.payload as ReliabilityByLine;
              return [
                <span key="v" style={{ color: "#ffffff" }}>
                  {`${value}%  (${p.on_time.toLocaleString()} / ${p.count.toLocaleString()})`}
                </span>,
                <span key="n" style={{ color: "#ffffff" }}>Reliability</span>,
              ];
            }}
          />
          <Bar dataKey="reliability_pct" radius={[0, 4, 4, 0]}>
            {sorted.map((entry) => (
              <Cell key={entry.route_id} fill={routeColor(entry.route_id)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}