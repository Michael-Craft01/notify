import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  sw: "sw.js", // Use our custom sw.js
});

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withPWA(nextConfig);
