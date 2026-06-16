import type { DashboardResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  dashboard: () => request<DashboardResponse>("/dashboard"),
  start: () => request("/start", { method: "POST" }),
  stop: () => request("/stop", { method: "POST" }),
  kill: () => request("/kill", { method: "POST" }),
  getMode: () => request<{ mode: string }>("/mode"),
  setMode: (mode: string) =>
    request("/mode", {
      method: "PUT",
      body: JSON.stringify({ mode }),
    }),
  updateConfig: (payload: Record<string, unknown>) =>
    request("/config", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};
