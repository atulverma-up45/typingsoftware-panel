// src/config/env.ts
import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().default("http://localhost:8787/api"),
  VITE_AUTH_URL: z.string().url().optional(),
});

// Validate the environment variables using Vite's import.meta.env
// We pass it through a parse to ensure the schema is strictly adhered to
const parsedEnv = envSchema.safeParse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_AUTH_URL: import.meta.env.VITE_AUTH_URL,
});

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  throw new Error("Invalid environment variables");
}

/**
 * Origin of the API server (e.g. "http://localhost:8787").
 * Needed for endpoints served at the server root instead of under /api —
 * e.g. the /health liveness & readiness probes consumed by SettingsPage.
 */
const apiOrigin = (() => {
  try {
    return new URL(parsedEnv.data.VITE_API_BASE_URL).origin;
  } catch {
    return "http://localhost:8787";
  }
})();

export const env = {
  API_BASE_URL: parsedEnv.data.VITE_API_BASE_URL,
  API_ORIGIN: apiOrigin,
  AUTH_URL: parsedEnv.data.VITE_AUTH_URL || apiOrigin,
};
