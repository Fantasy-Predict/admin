import { API_BASE_URL } from "./config";
import { clearSession } from "./session";

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
  /** @deprecated Ignored — auth is now via httpOnly cookie. Kept so existing call-sites compile. */
  token?: string | null;
  /** When false, returns the full response body. Defaults to true. */
  unwrap?: boolean;
};

function errorMessage(status: number, body: unknown): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === "string") return message;
  }
  return `Request failed with status ${status}`;
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, unwrap = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

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
      clearSession(); // calls /logout endpoint + redirects to "/"
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
