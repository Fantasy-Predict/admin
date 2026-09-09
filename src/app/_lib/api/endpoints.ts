import { apiFetch, ApiError } from "./client";
import { getToken } from "./session";
import type { Match, Pool, Transaction } from "../mock-data";

export { ApiError };
export type { Match, Pool, Transaction };

// ============================================================
// Admin API
// Fully self-contained endpoint layer for the admin console.
// Order matches the OpenAPI docs: POST /admins → GET /admins →
// verify-account → login → profile (GET/DELETE) → dashboard.
// No imports escape the src/app/admin folder.
// ============================================================

export type AdminSignupPayload = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export type AdminUser = {
  id: string;
  username: string;
  email: string;
  country: string;
  joined: string;
  balance: number;
  status: string;
};

export type AdminVerifyPayload = {
  email: string;
  otp: string;
};

export type AdminLoginResponse = {
  token?: string;
  refreshToken?: string;
  userType?: "admin" | "user";
  user?: {
    id?: string;
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    userType?: "admin" | "user";
  };
};

export type AdminProfile = {
  _id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  createdAt?: string;
};

export type AdminDashboard = {
  totalUsers: number;
  activeUsers: number;
  totalPools: number;
  predictionsThisWeek: number;
  depositsThisMonth: number;
  withdrawalsThisMonth: number;
  pendingPayouts: number;
  platformRevenue: number;
};

// 1. Create admin — POST /v1/admins
export async function adminSignup(payload: AdminSignupPayload): Promise<{ id?: string; email?: string }> {
  return apiFetch<{ id?: string; email?: string }>("/v1/admins", {
    method: "POST",
    body: payload,
  });
}

// 2. Fetch admins — GET /v1/admins
export async function getAdminUsers(): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>("/v1/admins", {
    token: getToken(),
  });
}

// 3. Verify account — POST /v1/admins/verify-account
// NOTE: currently returns 500 on the live API (backend issue).
// The admin is already isActive after creation, so this is optional/best-effort.
export async function adminVerifyAccount(payload: AdminVerifyPayload): Promise<unknown> {
  return apiFetch<unknown>("/v1/admins/verify-account", {
    method: "POST",
    body: payload,
  });
}

// 4. Login — POST /v1/admins/login
export async function adminLogin(payload: {
  email: string;
  password: string;
}): Promise<AdminLoginResponse> {
  const res = await apiFetch<{
    data?: AdminLoginResponse["user"];
    meta?: { token?: string; refreshToken?: string };
  }>("/v1/admins/login", {
    method: "POST",
    body: payload,
    unwrap: false,
  });
  return {
    token: res?.meta?.token,
    refreshToken: res?.meta?.refreshToken,
    userType: "admin",
    user: res?.data,
  };
}

// 5. Current admin profile — GET /v1/admins/profile
export async function getAdminProfile(): Promise<AdminProfile> {
  return apiFetch<AdminProfile>("/v1/admins/profile", {
    token: getToken(),
  });
}

// 6. Delete admin profile — DELETE /v1/admins/profile
export async function deleteAdminProfile(): Promise<unknown> {
  return apiFetch<unknown>("/v1/admins/profile", {
    method: "DELETE",
    token: getToken(),
  });
}

// 7. Dashboard stats — GET /v1/admins/dashboard
export async function getAdminDashboard(): Promise<AdminDashboard> {
  return apiFetch<AdminDashboard>("/v1/admins/dashboard", {
    token: getToken(),
  });
}

// ============================================================
// Competitions
// ============================================================

export type UserCompetition = {
  _id: string;
  name: string;
  code: string;
  type: string;
  default?: boolean;
};

export async function getUserCompetitions(): Promise<UserCompetition[]> {
  const res = await apiFetch<UserCompetition[] | { data?: UserCompetition[] | { docs?: UserCompetition[] }; docs?: UserCompetition[] }>("/v1/competitions", {
    token: getToken(),
    unwrap: false,
  });
  if (Array.isArray(res)) return res;
  const data = (res as { data?: unknown })?.data;
  if (Array.isArray(data)) return data as UserCompetition[];
  if (data && typeof data === "object" && "docs" in data) return (data as { docs?: UserCompetition[] }).docs ?? [];
  return (res as { docs?: UserCompetition[] })?.docs ?? [];
}

// ============================================================
// Matches
// ============================================================

type TeamObject = {
  name?: string;
  shortName?: string;
  crest?: string;
  score?: number | null;
  _id?: string;
};

function extractTeamName(
  team: string | TeamObject | undefined,
  fallback: string,
): string {
  if (typeof team === "string") return team;
  if (team && typeof team === "object") return team.name ?? team.shortName ?? fallback;
  return fallback;
}

function makeAbbreviation(name: string): string {
  const cleaned = name
    .replace(/ fc$/i, "")
    .replace(/ cf$/i, "")
    .replace(/ ac$/i, "")
    .replace(/ sc$/i, "")
    .replace(/ de /gi, " ")
    .replace(/ cf$/i, "")
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  const articles = new Set(["de", "la", "el", "las", "los", "the", "of", "al"]);
  const meaningful = words.filter((w) => !articles.has(w.toLowerCase()));
  if (meaningful.length >= 2) return (meaningful[0].slice(0, 1) + meaningful[1].slice(0, 1) + (meaningful[2]?.slice(0, 1) ?? "")).toUpperCase();
  return cleaned.slice(0, 3).toUpperCase();
}

function extractTeamShort(
  team: string | TeamObject | undefined,
  fallback: string,
): string {
  if (typeof team === "string") return makeAbbreviation(team);
  if (team && typeof team === "object") {
    const source = team.shortName ?? team.name;
    if (source) return makeAbbreviation(source);
  }
  return fallback;
}

export async function getMatches(competition: string, date?: string): Promise<Match[]> {
  type MatchDoc = {
    _id?: string;
    id?: string;
    competition?: string | { name?: string; code?: string; _id?: string };
    league?: string;
    homeTeam?: string | TeamObject;
    home?: string;
    home_team?: string;
    awayTeam?: string | TeamObject;
    away?: string;
    away_team?: string;
    homeShort?: string;
    home_short?: string;
    awayShort?: string;
    away_short?: string;
    kickoff?: string;
    kickoffTime?: string;
    kickoff_time?: string;
    date?: string;
    matchDate?: string;
    status?: string;
    state?: string;
    score?: { home?: number; away?: number } | null;
    homeScore?: number;
    awayScore?: number;
    matchday?: string;
    stage?: string;
    matchId?: string;
    prediction?: { outcome?: string; point?: number }[];
  };

  let matchPath = `/v1/matches?competition=${encodeURIComponent(competition)}`;
  if (date) matchPath += `&date=${encodeURIComponent(date)}`;
  const res = await apiFetch<MatchDoc[] | { docs?: MatchDoc[] }>(matchPath, {
    token: getToken(),
  });

  const list = Array.isArray(res) ? res : (res?.docs ?? []);

  return list.map((m) => ({
    id: m._id ?? m.id ?? "",
    competition:
      typeof m.competition === "object" && m.competition
        ? m.competition.name ?? ""
        : m.competition ?? "",
    matchday: m.matchday ?? "",
    home: extractTeamName(m.homeTeam ?? m.home ?? m.home_team, "Home"),
    away: extractTeamName(m.awayTeam ?? m.away ?? m.away_team, "Away"),
    homeShort: m.homeShort ?? m.home_short ?? extractTeamShort(m.homeTeam ?? m.home, "HOM"),
    awayShort: m.awayShort ?? m.away_short ?? extractTeamShort(m.awayTeam ?? m.away, "AWY"),
    homeCrest: (typeof m.homeTeam === "object" && m.homeTeam?.crest) || undefined,
    awayCrest: (typeof m.awayTeam === "object" && m.awayTeam?.crest) || undefined,
    kickoff: m.kickoff ?? m.kickoffTime ?? m.kickoff_time ?? m.date ?? m.matchDate ?? "",
    status: ((): Match["status"] => {
      const s = (m.status ?? m.state ?? "upcoming").toLowerCase();
      if (s === "live" || s === "in-play" || s === "in_play" || s === "1h" || s === "2h" || s === "ht") return "live";
      if (s === "finished" || s === "ft" || s === "complete" || s === "ended") return "finished";
      return "upcoming";
    })(),
    score: m.score
      ? { home: m.score.home ?? 0, away: m.score.away ?? 0 }
      : m.homeScore !== undefined
        ? { home: m.homeScore ?? 0, away: m.awayScore ?? 0 }
        : (typeof m.homeTeam === "object" && m.homeTeam && "score" in m.homeTeam && typeof m.awayTeam === "object" && m.awayTeam && "score" in m.awayTeam)
          ? {
              home: (m.homeTeam as TeamObject & { score?: number }).score ?? 0,
              away: (m.awayTeam as TeamObject & { score?: number }).score ?? 0,
            }
          : undefined,
    prediction: Array.isArray(m.prediction)
      ? m.prediction.map((p) => ({ outcome: p.outcome ?? "", point: p.point }))
      : undefined,
  }));
}

export type { TeamObject };

// ============================================================
// Transactions
// ============================================================

function formatTxDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

type TransactionDoc = {
  _id?: string;
  id?: string;
  type?: string;
  amount?: number;
  status?: string;
  createdAt?: string;
  dateInitiated?: string;
  date?: string;
};

export async function getTransactions(): Promise<Transaction[]> {
  const res = await apiFetch<TransactionDoc[] | { docs?: TransactionDoc[] }>("/v1/transactions", {
    token: getToken(),
  });
  const list = Array.isArray(res) ? res : (res?.docs ?? []);
  return list.map((tx) => ({
    id: tx._id ?? tx.id ?? "",
    type:
      tx.type === "debit" || tx.type === "Withdrawal"
        ? "Withdrawal"
        : tx.type === "credit" || tx.type === "Deposit"
          ? "Deposit"
          : tx.type ?? "Deposit",
    amount: tx.amount ?? 0,
    status:
      tx.status === "success" || tx.status === "completed" || tx.status === "successful"
        ? "successful"
        : tx.status === "pending"
          ? "pending"
          : "failed",
    date: formatTxDate(tx.createdAt ?? tx.dateInitiated ?? tx.date ?? ""),
  }));
}

// ============================================================
// Pools
// ============================================================

export type PoolConfig = {
  amount?: number;
  paid?: boolean;
  code?: string;
  poolSharing?: string;
};

export type PoolDoc = {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  privacy?: string;
  competition?: string | { _id?: string; name?: string; code?: string };
  icon?: string;
  config?: PoolConfig;
  members?: unknown[] | { length?: number };
  totalMembers?: number;
  maxMembers?: number;
  createdBy?: string | { _id?: string; firstName?: string; lastName?: string; username?: string };
  isCreator?: boolean;
  isActive?: boolean;
  code?: string;
};

function normalizePool(pool: PoolDoc | Pool, opts?: { mine?: boolean }): Pool {
  if ("players" in pool && "type" in pool && pool.name) {
    return pool as unknown as Pool;
  }
  const p = pool as PoolDoc;
  const competition =
    typeof p.competition === "object" && p.competition
      ? p.competition.name ?? p.competition.code ?? ""
      : (p.competition ?? "");
  const competitionId =
    typeof p.competition === "object" && p.competition
      ? p.competition._id
      : undefined;
  const isPaid = p.config?.paid === true;
  const players = p.totalMembers ?? (Array.isArray(p.members)
    ? p.members.length
    : typeof p.members === "object" && p.members
      ? ((p.members as { length?: number }).length ?? 0)
      : 0);
  const entryFee = p.config?.amount ?? 0;
  const creatorId =
    typeof p.createdBy === "object" && p.createdBy
      ? p.createdBy._id
      : typeof p.createdBy === "string"
        ? p.createdBy
        : undefined;

  return {
    id: p._id ?? p.id ?? "",
    name: p.name ?? p.title ?? "Untitled pool",
    competition,
    competitionId,
    entryFee,
    players,
    maxPlayers: p.maxMembers ?? players,
    prizePool: isPaid ? Math.round(entryFee * players * 0.9) : 0,
    privacy: p.privacy === "public" ? "public" : "private",
    progress: 0,
    rank: opts?.mine ? 1 : undefined,
    type: isPaid ? "monetized" : "free",
    poolFor: "open",
    prizeType: isPaid ? "prizes" : "fun",
    introduction: p.description,
    platformFeePercentage: isPaid ? 10 : 0,
    createdBy: creatorId,
    isCreator: p.isCreator,
    inviteCode: p.config?.code,
  };
}

export type { PoolDoc as AdminPoolDoc };

type PaginatedResponse<T> = {
  docs?: T[];
  totalDocs?: number;
  totalPages?: number;
  limit?: number;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
  hasMore?: boolean;
};

export async function getPools(
  options: { page?: number; name?: string; privacy?: string; personal?: boolean } = {},
): Promise<Pool[]> {
  const params = new URLSearchParams();
  params.set("page", String(options.page ?? 1));
  if (options.name) params.set("name", options.name);
  if (options.privacy) params.set("privacy", options.privacy);
  if (options.personal) params.set("personal", "true");
  const qs = params.toString();
  const res = await apiFetch<{ data?: PaginatedResponse<PoolDoc> } | PaginatedResponse<PoolDoc> | PoolDoc[]>(`/v1/pools?${qs}`, {
    token: getToken(),
    unwrap: false,
  });
  const list = Array.isArray(res) ? res
    : (res as { data?: PaginatedResponse<PoolDoc> })?.data?.docs
    ?? (res as PaginatedResponse<PoolDoc>)?.docs
    ?? (res as { data?: PoolDoc[] })?.data
    ?? (res as { pools?: PoolDoc[] })?.pools
    ?? [];
  return list.map((pool) => normalizePool(pool));
}