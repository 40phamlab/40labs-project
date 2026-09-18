import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@40labs/ui-components",
    "@40labs/design-tokens",
    "@40labs/types",
  ],
};

export default nextConfig;
