"use client";

import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("@/components/LiveMap"), {
  ssr: false,
  loading: () => <p style={{ padding: 20 }}>Loading map…</p>,
});

export default function Home() {
  return (
    <main>
      <LiveMap />
    </main>
  );
}