import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a minimal self-contained build for Docker (traces only needed files).
  output: "standalone",
  // Leaflet compatibility — double-mounting in StrictMode breaks the map.
  reactStrictMode: false,
};

export default nextConfig;