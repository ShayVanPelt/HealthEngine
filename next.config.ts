import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

// If a parent directory has its own package-lock.json, Next can infer the wrong workspace root
// and fail at build time (e.g. PageNotFoundError for /_document). Pin tracing to this app.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
