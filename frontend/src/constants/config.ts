/** Runtime configuration sourced from Vite env. Never hardcode backend URLs. */
export const config = {
  apiUrl: (import.meta.env["VITE_API_URL"] as string | undefined) ?? (import.meta.env.DEV ? "http://localhost:3001" : ""),
  wsUrl: (import.meta.env["VITE_WS_URL"] as string | undefined) ?? "",
  appEnv: (import.meta.env["VITE_APP_ENV"] as string | undefined) ?? "development",
};

export const STORAGE_KEYS = {
  theme: "mysterycase.theme",
} as const;
