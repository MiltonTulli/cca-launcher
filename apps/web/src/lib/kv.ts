import { Redis } from "@upstash/redis";

// Single Redis instance, reused across requests.
// Supports both Vercel KV naming (KV_REST_API_*) and standard Upstash naming.
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
