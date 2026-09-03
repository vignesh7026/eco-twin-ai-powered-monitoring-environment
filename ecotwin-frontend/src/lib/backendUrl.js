// backendUrl.js — resolves the EcoTwin Express backend's base URL.
// Prefers VITE_API_URL; falls back to the known Render deployment when
// running on a non-localhost host, otherwise assumes local dev.
export function getBackendUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim() && !envUrl.includes("localhost")) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return "https://ecotwin-backend-c2mo.onrender.com";
    }
  }
  return "http://localhost:5000";
}
