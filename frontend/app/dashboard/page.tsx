"use client";

import { useEffect, useState } from "react";
import ReliabilityChart from "@/components/ReliabilityChart";
import DelayHeatmap from "@/components/DelayHeatmap";
import { getDashboard, type DashboardData } from "@/lib/api";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const d = await getDashboard();
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-neutral-950 p-4 text-red-400 sm:p-8">
        <p className="font-semibold">Failed to load analytics: {error ?? "no data"}</p>
        <p className="mt-2 text-sm text-neutral-400">
          Checklist: Django running on :8000? CORS allowing :3000? Ingestion data in Postgres?
        </p>
      </main>
    );
  }

  const overall = data.reliability.overall;
  const worstStops = data.delays_by_stop.slice(0, 20);

  return (
    <main className="min-h-screen bg-neutral-950 p-4 text-neutral-200 sm:p-8">
      <h1 className="text-2xl font-bold text-white">Reliability Dashboard</h1>
      <p className="mt-1 text-sm text-neutral-500">
        MBTA rapid-transit reliability, computed from live arrival data.
      </p>

      {/* Overall reliability */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">Overall reliability</h2>
        <p className="mt-2">
          <span className="text-3xl font-bold text-emerald-400">
            {overall.reliability_pct ?? "—"}%
          </span>{" "}
          <span className="text-neutral-400">
            of {overall.count.toLocaleString()} arrivals within {overall.threshold} min
            ({overall.on_time.toLocaleString()} on time)
          </span>
        </p>
      </section>

      {/* Reliability by line */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">Reliability by line</h2>
        <ReliabilityChart data={data.reliability.by_line} />
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-300">
            Show raw numbers
          </summary>
          <Table
            headers={["Route", "Reliability %", "On time", "Count"]}
            rows={data.reliability.by_line.map((r) => [
              r.route_id,
              `${r.reliability_pct}%`,
              r.on_time.toLocaleString(),
              r.count.toLocaleString(),
            ])}
          />
        </details>
      </section>

      {/* Delay heatmap */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">Delay heatmap (line × hour, Boston time)</h2>
        <p className="text-xs text-neutral-500">Average delay per line by hour of day. Hover a cell for detail.</p>
        <DelayHeatmap data={data.delays_by_line_hour} />
      </section>

      {/* Avg delay by line */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">Average delay by line</h2>
        <Table
          headers={["Route", "Avg delay (min)", "Count"]}
          rows={data.delays_by_line.map((r) => [
            r.route_id,
            r.avg_delay_minutes.toString(),
            r.count.toLocaleString(),
          ])}
        />
      </section>

      {/* Avg delay by hour */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">Average delay by hour (Boston time)</h2>
        <Table
          headers={["Hour", "Avg delay (min)", "Count"]}
          rows={data.delays_by_hour.map((r) => [
            `${r.hour}:00`,
            r.avg_delay_minutes.toString(),
            r.count.toLocaleString(),
          ])}
        />
      </section>

      {/* Worst stops */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">Worst 20 stops by avg delay</h2>
        <p className="text-xs text-neutral-500">Stop IDs are MBTA platform IDs; friendly names come later.</p>
        <Table
          headers={["Stop ID", "Avg delay (min)", "Count"]}
          rows={worstStops.map((r) => [
            r.stop_id,
            r.avg_delay_minutes.toString(),
            r.count.toLocaleString(),
          ])}
        />
      </section>
    </main>
  );
}

// Skeleton shown while analytics load (first load can take a few seconds).
function DashboardSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-neutral-950 p-4 text-neutral-200 sm:p-8">
      <div className="h-7 w-64 rounded bg-neutral-800" />
      <div className="mt-2 h-4 w-96 max-w-full rounded bg-neutral-900" />

      {/* Overall stat block */}
      <div className="mt-8 h-5 w-40 rounded bg-neutral-800" />
      <div className="mt-3 h-9 w-80 max-w-full rounded bg-neutral-900" />

      {/* Chart block */}
      <div className="mt-8 h-5 w-44 rounded bg-neutral-800" />
      <div className="mt-3 h-72 w-full max-w-2xl rounded bg-neutral-900" />

      {/* Heatmap block */}
      <div className="mt-8 h-5 w-72 max-w-full rounded bg-neutral-800" />
      <div className="mt-3 h-56 w-full max-w-2xl rounded bg-neutral-900" />

      <p className="mt-6 text-sm text-neutral-600">Loading analytics… (first load computes from raw data)</p>
    </main>
  );
}

// Small presentational table helper.
function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  if (rows.length === 0) {
    return <p className="mt-2 text-sm text-neutral-500">No data.</p>;
  }
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full max-w-2xl border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-800 text-left text-neutral-400">
            {headers.map((h) => (
              <th key={h} className="py-2 pr-4 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-neutral-900">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-4 whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}