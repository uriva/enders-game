import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Strict Mode — React's double-mount cycle destroys WebGL contexts
  // which causes "Context Lost" errors with R3F Canvas
  reactStrictMode: false,
  // Transpile Three.js ecosystem packages for compatibility
  transpilePackages: [
    "three",
    "@react-three/fiber",
    "@react-three/drei",
    "@react-three/postprocessing",
    "@json-render/react-three-fiber",
  ],
};

export default nextConfig;
