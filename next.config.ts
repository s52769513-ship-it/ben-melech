import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components: every screen ships a static shell immediately and streams
  // the Airtable-backed parts in, so moving between screens is instant instead
  // of blocking on a full server render.
  cacheComponents: true,
};

export default nextConfig;
