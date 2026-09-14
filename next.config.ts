import path from "node:path";
import type { NextConfig } from "next";

const ONE_YEAR = "public, max-age=31536000, immutable";

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile in a parent directory cannot
  // change how Turbopack resolves modules.
  turbopack: { root: path.resolve(__dirname) },
  async headers() {
    return [
      {
        // The Draco-compressed district and the decoder are versioned by
        // content in practice; let browsers keep them across visits.
        source: "/:prefix(models|draco)/:path*",
        headers: [{ key: "Cache-Control", value: ONE_YEAR }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
