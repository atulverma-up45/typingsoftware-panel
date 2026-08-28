// src/config/env.ts

export const env = {
  // Use Vite's environment variables approach (import.meta.env)
  // Fallback to localhost if not specified in .env
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  AUTH_URL: import.meta.env.VITE_AUTH_URL || "http://localhost:3000",
};
