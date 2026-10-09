/** Runtime configuration sourced from Vite env. Never hardcode backend URLs. */
export const config = {
  apiUrl: (import.meta.env["VITE_API_URL"] as string | undefined) ?? "",
  wsUrl: (import.meta.env["VITE_WS_URL"] as string | undefined) ?? "",
  appEnv: (import.meta.env["VITE_APP_ENV"] as string | undefined) ?? "development",
  /** "api" once a backend URL is configured; otherwise local demo repositories. */
  get dataSource(): "api" | "demo" {
    return this.apiUrl ? "api" : "demo";
  },
};

export const STORAGE_KEYS = {
  db: "mysterycase.db.v3",
  theme: "mysterycase.theme",
  previewProgress: "mysterycase.preview",
} as const;
