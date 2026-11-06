import { API_BASE_URL, TOKEN_KEY, USER_TYPE_KEY } from "./config";

const HAS_PIN_KEY = "fp_has_pin";
const JOINED_POOLS_KEY = "fp_joined_pools";

// getToken always returns null — auth is now via httpOnly cookie set by the server.
// The return value is kept so endpoints.ts compiles without changes (token param is ignored by apiFetch).
export function getToken(): string | null {
  return null;
}

export function getStoredUserType(): "admin" | "user" | null {
  return "admin";
}

export function getHasPin(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(HAS_PIN_KEY) === "true";
}

export function setHasPin(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(HAS_PIN_KEY, "true");
  } else {
    window.localStorage.removeItem(HAS_PIN_KEY);
  }
}

/** Calls the server logout endpoint (clears the httpOnly cookie) then redirects to login. */
export async function clearSession(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/v1/admins/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore network errors — still redirect
  }
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}

export function getJoinedPoolIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(JOINED_POOLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addJoinedPoolId(poolId: string) {
  if (typeof window === "undefined") return;
  const current = getJoinedPoolIds();
  if (!current.includes(poolId)) {
    current.push(poolId);
    window.localStorage.setItem(JOINED_POOLS_KEY, JSON.stringify(current));
  }
}
