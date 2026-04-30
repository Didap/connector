import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["better-sqlite3", "bindings", "file-uri-to-path"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals ?? []),
        "better-sqlite3",
        "bindings",
        "file-uri-to-path",
      ];
    }
    return config;
  },
};

export default nextConfig;
