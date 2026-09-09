import { API_BASE_URL } from "./config";
import {
  clearSession,
  getRefreshToken,
  recordLoginTime,
  setToken,
  setRefreshToken as storeRefreshToken,
} from "./session";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  /** When false, returns the full response body (e.g. login, which puts the token in meta). Defaults to true. */
  unwrap?: boolean;
  /** Internal: prevents infinite refresh loops. */
  _isRetry?: boolean;
};

function errorMessage(status: number, body: unknown): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === "string") return message;
  }
  return `Request failed with status ${status}`;
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, unwrap = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : "Unable to reach the Fantasy Predict API",
      0,
    );
  }

  if (!res.ok) {
    let parsed: unknown = null;
    try {
      const errorText = await res.text();
      parsed = JSON.parse(errorText);
    } catch {
      // non-JSON error body — parsed stays null
    }
    if (res.status === 401 && typeof window !== "undefined") {
      if (!options._isRetry) {
        const rt = getRefreshToken();
        if (!rt) {
          clearSession();
          window.location.href = "/";
          throw new ApiError(errorMessage(res.status, parsed), res.status, parsed);
        }
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/v1/users/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: rt }),
            credentials: "include",
          });
          if (refreshRes.ok) {
            const refreshBody = await refreshRes.json();
            const newToken =
              refreshBody?.data?.token ??
              refreshBody?.meta?.token ??
              refreshBody?.token;
            const newRefresh =
              refreshBody?.data?.refreshToken ??
              refreshBody?.meta?.refreshToken ??
              refreshBody?.refreshToken;
            if (newToken) {
              setToken(newToken);
              recordLoginTime();
            }
            if (newRefresh) storeRefreshToken(newRefresh);
            if (newToken) {
              const retryHeaders: Record<string, string> = {};
              if (body !== undefined) retryHeaders["Content-Type"] = "application/json";
              retryHeaders["Authorization"] = `Bearer ${newToken}`;
              const retryRes = await fetch(`${API_BASE_URL}${path}`, {
                method,
                headers: retryHeaders,
                body: body !== undefined ? JSON.stringify(body) : undefined,
                credentials: "include",
              });
              if (retryRes.ok) {
                if (retryRes.status === 204) return undefined as T;
                const retryText = await retryRes.text();
                let retryParsed: { data?: unknown } & Record<string, unknown>;
                try {
                  retryParsed = JSON.parse(retryText);
                } catch {
                  throw new ApiError(
                    retryText.slice(0, 200) || "Received non-JSON response from the server",
                    retryRes.status,
                  );
                }
                if (unwrap && retryParsed && typeof retryParsed === "object" && "data" in retryParsed) {
                  return retryParsed.data as T;
                }
                return retryParsed as T;
              }
            }
          }
        } catch (e) {
          if (e instanceof ApiError) throw e;
        }
      }
      clearSession();
      window.location.href = "/";
    }
    throw new ApiError(errorMessage(res.status, parsed), res.status, parsed);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let parsed: { data?: unknown } & Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ApiError(
      text.slice(0, 200) || "Received non-JSON response from the server",
      res.status,
    );
  }
  if (unwrap && parsed && typeof parsed === "object" && "data" in parsed) {
    return parsed.data as T;
  }
  return parsed as T;
}