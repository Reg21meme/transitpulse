"use client";
import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("@/components/LiveMap"), {
  ssr: false,
  loading: () => <p style={{ padding: 20 }}>Loading map…</p>,
});

export default function Home() {
  return (
    <main className="flex-1 min-h-0">
      <LiveMap />
    </main>
  );
}