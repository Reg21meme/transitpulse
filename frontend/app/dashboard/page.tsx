"use client";

import { useEffect, useState } from "react";
import ReliabilityChart from "@/components/ReliabilityChart";
import {
  getReliability,
  getDelaysByLine,
  getDelaysByStop,
  getDelaysByHour,
  type ReliabilityResponse,
  type DelayByLine,
  type DelayByStop,
  type DelayByHour,
} from "@/lib/api";

export default function DashboardPage() {
  const [reliability, setReliability] = useState<ReliabilityResponse | null>(null);
  const [byLine, setByLine] = useState<DelayByLine[]>([]);
  const [byStop, setByStop] = useState<DelayByStop[]>([]);
  const [byHour, setByHour] = useState<DelayByHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [rel, line, stop, hour] = await Promise.all([
          getReliability(),
          getDelaysByLine(),
          getDelaysByStop(),
          getDelaysByHour(),
        ]);
        if (cancelled) return;
        setReliability(rel);
        setByLine(line);
        setByStop(stop);
        setByHour(hour);
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
    return <main className="min-h-screen bg-neutral-950 p-8 text-neutral-200">Loading analytics…</main>;
  }

  if (error) {
    return (
      <main className="min-h-screen bg-neutral-950 p-8 text-red-400">
        <p className="font-semibold">Failed to load analytics: {error}</p>
        <p className="mt-2 text-sm text-neutral-400">
          Checklist: Django running on :8000? CORS allowing :3000? Ingestion data in Postgres?
        </p>
      </main>
    );
  }

  const overall = reliability?.overall;
  const worstStops = byStop.slice(0, 20); // by-stop can be hundreds of rows

  return (
    <main className="min-h-screen bg-neutral-950 p-8 text-neutral-200">
      <h1 className="text-2xl font-bold text-white">Reliability Dashboard</h1>
      <p className="mt-1 text-sm text-neutral-500">
        MBTA rapid-transit reliability, computed from live arrival data.
      </p>

      {/* Overall reliability */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">Overall reliability</h2>
        {overall && (
          <p className="mt-2">
            <span className="text-3xl font-bold text-emerald-400">
              {overall.reliability_pct ?? "—"}%
            </span>{" "}
            <span className="text-neutral-400">
              of {overall.count.toLocaleString()} arrivals within {overall.threshold} min
              ({overall.on_time.toLocaleString()} on time)
            </span>
          </p>
        )}
      </section>

      {/* Reliability by line */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">Reliability by line</h2>
        <ReliabilityChart data={reliability?.by_line ?? []} />
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-300">
            Show raw numbers
          </summary>
          <Table
            headers={["Route", "Reliability %", "On time", "Count"]}
            rows={reliability?.by_line.map((r) => [
              r.route_id,
              `${r.reliability_pct}%`,
              r.on_time.toLocaleString(),
              r.count.toLocaleString(),
            ]) ?? []}
          />
        </details>
      </section>

      {/* Avg delay by line */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">Average delay by line</h2>
        <Table
          headers={["Route", "Avg delay (min)", "Count"]}
          rows={byLine.map((r) => [
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
          rows={byHour.map((r) => [
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

// Small presentational table helper.
function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  if (rows.length === 0) {
    return <p className="mt-2 text-sm text-neutral-500">No data.</p>;
  }
  return (
    <table className="mt-2 w-full max-w-2xl border-collapse text-sm">
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
              <td key={j} className="py-2 pr-4">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}