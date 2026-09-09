import { TOKEN_KEY, USER_TYPE_KEY } from "./config";

const HAS_PIN_KEY = "fp_has_pin";
const REFRESH_TOKEN_KEY = "fp_refresh_token";
const LOGIN_TIME_KEY = "fp_login_time";
const JOINED_POOLS_KEY = "fp_joined_pools";

/** Max token age in ms before we consider it expired (1 hour). */
const MAX_TOKEN_AGE_MS = 1 * 60 * 60 * 1000;

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUserType(): "admin" | "user" | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(USER_TYPE_KEY);
  return value === "admin" || value === "user" ? value : null;
}

export function setStoredUserType(userType: "admin" | "user") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_TYPE_KEY, userType);
}

export function setRefreshToken(token: string) {
  if (typeof window === "undefined") return;
  const base = "; path=/; max-age=2592000; samesite=lax";
  document.cookie = `${REFRESH_TOKEN_KEY}=${encodeURIComponent(token)}${base}`;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${REFRESH_TOKEN_KEY}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearRefreshToken() {
  if (typeof window === "undefined") return;
  document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; max-age=0`;
}

export function recordLoginTime() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOGIN_TIME_KEY, String(Date.now()));
  const base = "; path=/; max-age=2592000; samesite=lax";
  document.cookie = `${LOGIN_TIME_KEY}=${Date.now()}${base}`;
}

export function isTokenExpired(): boolean {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(LOGIN_TIME_KEY);
  if (!stored) return true;
  return Date.now() - Number(stored) > MAX_TOKEN_AGE_MS;
}

export function clearLoginTime() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOGIN_TIME_KEY);
  document.cookie = `${LOGIN_TIME_KEY}=; path=/; max-age=0`;
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_TYPE_KEY);
  window.localStorage.removeItem(HAS_PIN_KEY);
  clearLoginTime();
  clearRefreshToken();
  clearSessionCookies();
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

export function setSessionCookies(token: string, userType: "admin" | "user") {
  const base = "; path=/; max-age=2592000; samesite=lax";
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}${base}`;
  document.cookie = `${USER_TYPE_KEY}=${encodeURIComponent(userType)}${base}`;
  recordLoginTime();
}

export function clearSessionCookies() {
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
  document.cookie = `${USER_TYPE_KEY}=; path=/; max-age=0`;
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