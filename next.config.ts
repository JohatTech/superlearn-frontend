import type { NextConfig } from "next";

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(",").map((s) => s.trim())
  : ["10.50.171.126", "localhost", "127.0.0.1"];

const nextConfig: NextConfig = {
  allowedDevOrigins,
};

export default nextConfig;
