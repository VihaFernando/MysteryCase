import { config } from "@/constants/config";
import { ApiError } from "./ApiError";

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  signal?: AbortSignal;
}

/** Thin typed HTTP client for the future Bun REST API. */
export class ApiClient {
  constructor(private readonly baseUrl: string, private readonly getToken?: () => string | null) {}

  private buildUrl(path: string, query?: RequestOptions["query"]) {
    const url = new URL(path.replace(/^\//, ""), this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`);
    if (query) for (const [k, v] of Object.entries(query)) if (v !== undefined) url.searchParams.set(k, String(v));
    return url.toString();
  }

  async request<T>(method: Method, path: string, opts: RequestOptions = {}): Promise<T> {
    if (!this.baseUrl) throw new ApiError("API URL is not configured (VITE_API_URL)", 0, "NO_API_URL");
    const headers: Record<string, string> = { Accept: "application/json" };
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";
    const token = this.getToken?.();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    let res: Response;
    try {
      res = await fetch(this.buildUrl(path, opts.query), {
        method,
        headers,
        ...(opts.body !== undefined && { body: JSON.stringify(opts.body) }),
        ...(opts.signal && { signal: opts.signal }),
      });
    } catch (err) {
      throw new ApiError("Network error", 0, "NETWORK", err);
    }
    if (!res.ok) {
      let payload: { message?: string; code?: string } | undefined;
      try {
        payload = (await res.json()) as { message?: string; code?: string };
      } catch {
        /* non-JSON error body */
      }
      throw new ApiError(payload?.message ?? res.statusText, res.status, payload?.code, payload);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  get<T>(path: string, opts?: RequestOptions) { return this.request<T>("GET", path, opts); }
  post<T>(path: string, body?: unknown) { return this.request<T>("POST", path, { body }); }
  patch<T>(path: string, body?: unknown) { return this.request<T>("PATCH", path, { body }); }
  put<T>(path: string, body?: unknown) { return this.request<T>("PUT", path, { body }); }
  delete<T>(path: string) { return this.request<T>("DELETE", path); }
}

export const apiClient = new ApiClient(config.apiUrl);
