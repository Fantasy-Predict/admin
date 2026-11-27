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
  totalPools: number;
  freePools: number;
  monetizedPools: number;
  totalWalletBalance: number;
  totalInflow: number;
  totalOutflow: number;
  recentUsers: DashboardUser[];
  recentWithdrawals: DashboardWithdrawal[];
};

export type MonthlyBreakdown = {
  year: number;
  month: number;
  inflow: number;
  outflow: number;
};

export type WalletStats = {
  totalInflow: number;
  totalOutflow: number;
  currentBalance: number;
  monthly: MonthlyBreakdown[];
};

export type UserWalletStats = {
  balance: number;
  totalInflow: number;
  totalOutflow: number;
  monthly: MonthlyBreakdown[];
};

export type DashboardUser = {
  _id: string;
  username: string;
  name: string;
  email: string;
  countryCode: string;
  isActive: boolean;
  joined: string;
};

export type DashboardWithdrawal = {
  _id: string;
  amount: number;
  status: string;
  initiated: string;
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
// Real response shape (2026-09-14): data { totalUser, totalPrediction,
// totalPools, totalWallet: [{ totalBalance }], recentWithdrawals, recentUsers }.
export async function getAdminDashboard(): Promise<AdminDashboard> {
  type DashboardUserDoc = {
    _id?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    countryCode?: string;
    isActive?: boolean;
    createdAt?: string;
  };
  type DashboardWithdrawalDoc = {
    _id?: string;
    id?: string;
    amount?: number;
    status?: string;
    createdAt?: string;
    dateInitiated?: string;
    date?: string;
  };
  type DashboardEnvelope = {
    data?: {
      totalUser?: number;
      totalPools?: number;
      freePools?: number;
      monetizedPools?: number;
      totalInflow?: number;
      totalOutflow?: number;
      totalWallet?: { _id?: string | null; totalBalance?: number }[];
      recentWithdrawals?: DashboardWithdrawalDoc[];
      recentUsers?: DashboardUserDoc[];
    };
  };
  const res = await apiFetch<DashboardEnvelope>("/v1/admins/dashboard", {
    token: getToken(),
    unwrap: false,
  });
  const d = res?.data ?? {};
  const wallet =
    Array.isArray(d.totalWallet) && d.totalWallet.length
      ? (d.totalWallet[0].totalBalance ?? 0)
      : 0;
  return {
    totalUsers: d.totalUser ?? 0,
    totalPools: d.totalPools ?? 0,
    freePools: d.freePools ?? 0,
    monetizedPools: d.monetizedPools ?? 0,
    totalInflow: d.totalInflow ?? 0,
    totalOutflow: d.totalOutflow ?? 0,
    totalWalletBalance: wallet,
    recentUsers: (d.recentUsers ?? []).map((u) => ({
      _id: u._id ?? "",
      username: u.username ?? ([u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || ""),
      name: [u.firstName, u.lastName].filter(Boolean).join(" "),
      email: u.email ?? "",
      countryCode: u.countryCode ?? "",
      isActive: u.isActive ?? true,
      joined: formatUserDate(u.createdAt),
    })),
    recentWithdrawals: (d.recentWithdrawals ?? []).map((w) => ({
      _id: w._id ?? w.id ?? "",
      amount: w.amount ?? 0,
      status: w.status ?? "",
      initiated: formatTxDate(w.createdAt ?? w.dateInitiated ?? w.date ?? ""),
    })),
  };
}

// ============================================================
// Platform users (players) — GET /v1/users
// The /users admin page shows PLAYER accounts, fetched from
// /v1/users (NOT /v1/admins, which lists admin accounts).
// ============================================================

export type PlatformUser = {
  id: string;
  username: string;
  email: string;
  country: string;
  joined: string;
  balance: number;
  status: string;
  hasFplTeam: boolean;
};

type PlatformUserDoc = {
  _id?: string;
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  countryCode?: string;
  phoneNumber?: string;
  isActive?: boolean;
  createdAt?: string;
};

function formatUserDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function toPlatformUser(u: PlatformUserDoc, fplSet: Set<string>): PlatformUser {
  const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
  const id = u._id ?? u.id ?? "";
  return {
    id,
    username: u.username ?? (fullName || (u.email ? u.email.split("@")[0] : "Unknown user")),
    email: u.email ?? "",
    country: u.countryCode ?? "",
    joined: formatUserDate(u.createdAt),
    balance: 0,
    status: u.isActive === false ? "suspended" : "active",
    hasFplTeam: fplSet.has(id),
  };
}

export async function getUsers(
  filters: { username?: string; firstName?: string; lastName?: string; email?: string; phoneNumber?: string } = {},
): Promise<PlatformUser[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const qs = params.toString();
  const [res, fplRes] = await Promise.all([
    apiFetch<{ docs?: PlatformUserDoc[] } | PlatformUserDoc[]>(
      `/v1/users${qs ? `?${qs}` : ""}`,
      { token: getToken() }
    ),
    apiFetch<{ userIds: string[] }>("/v1/admins/fpl/team-user-ids", { token: getToken() }).catch(() => ({ userIds: [] as string[] })),
  ]);
  const fplSet = new Set<string>(fplRes.userIds ?? []);
  const list = Array.isArray(res) ? res : (res?.docs ?? []);
  return list.map((u) => toPlatformUser(u, fplSet));
}

// Suspend a platform user — PATCH /v1/admins/users/:id/suspend
export async function suspendUser(userId: string): Promise<unknown> {
  return apiFetch<unknown>(`/v1/admins/users/${userId}/suspend`, {
    method: "PATCH",
    token: getToken(),
  });
}

// Unsuspend a platform user — PATCH /v1/admins/users/:id/unsuspend
export async function unsuspendUser(userId: string): Promise<unknown> {
  return apiFetch<unknown>(`/v1/admins/users/${userId}/unsuspend`, {
    method: "PATCH",
    token: getToken(),
  });
}

// Remove a user's FPL team for the current season — DELETE /v1/admins/users/:id/fpl-team
export async function deleteUserFplTeam(userId: string): Promise<unknown> {
  return apiFetch<unknown>(`/v1/admins/users/${userId}/fpl-team`, {
    method: "DELETE",
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

export async function getAdminMatches(competition: string): Promise<Match[]> {
  const res = await apiFetch<unknown>(`/v1/admins/matches?competition=${encodeURIComponent(competition)}`, {
    token: getToken(),
    unwrap: false,
  });

  type AdminMatchDoc = {
    _id?: string;
    id?: string;
    competition?: string | { _id?: string; name?: string };
    matchday?: string;
    homeTeam?: string | TeamObject;
    awayTeam?: string | TeamObject;
    home?: string | TeamObject;
    away?: string | TeamObject;
    home_team?: string | TeamObject;
    away_team?: string | TeamObject;
    homeShort?: string;
    awayShort?: string;
    home_short?: string;
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
    matchId?: string;
    stage?: string;
    isActive?: boolean;
  };

  let list: AdminMatchDoc[] = [];
  if (Array.isArray(res)) {
    list = res as AdminMatchDoc[];
  } else if (res && typeof res === "object") {
    const r = res as Record<string, unknown>;
    if (Array.isArray(r.data)) list = r.data as AdminMatchDoc[];
    else if (Array.isArray(r.docs)) list = r.docs as AdminMatchDoc[];
    else if (r.data && typeof r.data === "object" && Array.isArray((r.data as Record<string, unknown>).docs)) {
      list = (r.data as Record<string, unknown>).docs as AdminMatchDoc[];
    }
  }

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

// All platform transactions (admin-scoped) — GET /v1/admins/transactions
export async function getAdminTransactions(page = 1): Promise<Transaction[]> {
  const res = await apiFetch<TransactionDoc[] | { docs?: TransactionDoc[] }>(
    `/v1/admins/transactions?page=${page}`,
    { token: getToken() }
  );
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
// Withdrawals (admin-scoped)
// ============================================================

export type AdminWithdrawal = {
  id: string;
  amount: number;
  status: string;
  date: string;
  userEmail?: string;
};

type WithdrawalDoc = {
  _id?: string;
  id?: string;
  amount?: number;
  status?: string;
  createdAt?: string;
  dateInitiated?: string;
  date?: string;
  user?: string | { email?: string };
};

export async function getAdminWithdrawals(page = 1, status?: string): Promise<AdminWithdrawal[]> {
  let path = `/v1/admins/withdrawals?page=${page}`;
  if (status) path += `&status=${encodeURIComponent(status)}`;
  const res = await apiFetch<WithdrawalDoc[] | { docs?: WithdrawalDoc[] }>(path, {
    token: getToken(),
  });
  const list = Array.isArray(res) ? res : (res?.docs ?? []);
  return list.map((w) => ({
    id: w._id ?? w.id ?? "",
    amount: w.amount ?? 0,
    status: w.status ?? "pending",
    date: formatTxDate(w.createdAt ?? w.dateInitiated ?? w.date ?? ""),
    userEmail: typeof w.user === "object" ? w.user?.email : undefined,
  }));
}

// Matches that kicked off hours ago and still have no score — GET /v1/admins/matches/unscored
export type UnscoredMatch = {
  _id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  status: string;
  competitionName: string;
  competitionCode: string;
  hoursOverdue: number;
  lastCheckedAt: string | null;
};

export type UnscoredMatches = {
  thresholdHours: number;
  count: number;
  olderCount: number;
  matches: UnscoredMatch[];
};

export async function getUnscoredMatches(hours = 3): Promise<UnscoredMatches> {
  const res = await apiFetch<UnscoredMatches>(`/v1/admins/matches/unscored?hours=${hours}`, {
    token: getToken(),
  });
  return {
    thresholdHours: res.thresholdHours ?? hours,
    count: res.count ?? 0,
    olderCount: res.olderCount ?? 0,
    matches: res.matches ?? [],
  };
}

// Manually settle a match — POST /v1/admins/matches/:matchId/settle
export async function settleMatch(
  matchId: string,
  homeScore: number,
  awayScore: number
): Promise<unknown> {
  return apiFetch<unknown>(`/v1/admins/matches/${matchId}/settle`, {
    method: "POST",
    token: getToken(),
    body: { homeScore, awayScore },
  });
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
  settled?: boolean;
  prizeDistribution?: { position: number; percentage: number }[];
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
    isActive: p.isActive !== false,
    settled: p.settled === true,
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

export type PoolMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  username: string;
  role: "captain" | "player";
  status: "approved" | "pending" | "declined";
  amountSpent: number;
  joined: string;
};

type PoolMemberDoc = {
  _id?: string;
  id?: string;
  pool?: string;
  user?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    isActive?: boolean;
    createdAt?: string;
  } | string;
  type?: string;
  status?: string;
  totalAmountSpent?: number;
  createdAt?: string;
};

export async function getAdminPool(poolId: string): Promise<Pool> {
  const res = await apiFetch<unknown>(`/v1/admins/pools/${poolId}`, {
    token: getToken(),
    unwrap: false,
  });
  type Envelope = { data?: PoolDoc };
  const doc = ((res as Envelope)?.data ?? res) as PoolDoc;
  return normalizePool(doc);
}

export async function getAdminPoolMembers(poolId: string): Promise<PoolMember[]> {
  const res = await apiFetch<unknown>(`/v1/admins/pools/${poolId}/members`, {
    token: getToken(),
    unwrap: false,
  });
  type Envelope = { data?: { docs?: PoolMemberDoc[] } | PoolMemberDoc[]; docs?: PoolMemberDoc[] };
  const r = res as Envelope;
  let list: PoolMemberDoc[] = [];
  if (Array.isArray(r)) list = r as PoolMemberDoc[];
  else if (Array.isArray(r?.data)) list = r.data as PoolMemberDoc[];
  else if (r?.data && !Array.isArray(r.data) && Array.isArray((r.data as { docs?: PoolMemberDoc[] }).docs)) list = (r.data as { docs: PoolMemberDoc[] }).docs;
  else if (Array.isArray(r?.docs)) list = r.docs!;

  return list.map((m) => {
    const u = typeof m.user === "object" && m.user ? m.user : {};
    const firstName = (u as { firstName?: string }).firstName ?? "";
    const lastName = (u as { lastName?: string }).lastName ?? "";
    const userId = (u as { _id?: string })._id ?? (typeof m.user === "string" ? m.user : "");
    return {
      id: m._id ?? m.id ?? "",
      userId,
      name: [firstName, lastName].filter(Boolean).join(" ") || ((u as { username?: string }).username ?? "Unknown"),
      email: (u as { email?: string }).email ?? "",
      username: (u as { username?: string }).username ?? "",
      role: (m.type === "captain" ? "captain" : "player") as PoolMember["role"],
      status: (["approved", "pending", "declined"].includes(m.status ?? "") ? m.status : "approved") as PoolMember["status"],
      amountSpent: m.totalAmountSpent ?? 0,
      joined: formatUserDate(m.createdAt),
    };
  });
}

export async function closePool(poolId: string): Promise<void> {
  await apiFetch(`/v1/admins/pools/${poolId}/close`, {
    method: "PATCH",
    token: getToken(),
  });
}

export async function reopenPool(poolId: string): Promise<void> {
  await apiFetch(`/v1/admins/pools/${poolId}/reopen`, {
    method: "PATCH",
    token: getToken(),
  });
}

export async function settlePool(poolId: string): Promise<void> {
  await apiFetch(`/v1/admins/pools/${poolId}/settle`, {
    method: "POST",
    token: getToken(),
  });
}

export async function getAdminWalletStats(): Promise<WalletStats> {
  type Envelope = { data?: { totalInflow?: number; totalOutflow?: number; currentBalance?: number; monthly?: MonthlyBreakdown[] } };
  const res = await apiFetch<Envelope>("/v1/admins/wallet/stats", { token: getToken(), unwrap: false });
  const d = (res as Envelope)?.data ?? {};
  return {
    totalInflow: d.totalInflow ?? 0,
    totalOutflow: d.totalOutflow ?? 0,
    currentBalance: d.currentBalance ?? 0,
    monthly: d.monthly ?? [],
  };
}

export async function getUserWalletStats(userId: string): Promise<UserWalletStats> {
  type Envelope = { data?: { balance?: number; totalInflow?: number; totalOutflow?: number; monthly?: MonthlyBreakdown[] } };
  const res = await apiFetch<Envelope>(`/v1/admins/users/${userId}/wallet`, { token: getToken(), unwrap: false });
  const d = (res as Envelope)?.data ?? {};
  return {
    balance: d.balance ?? 0,
    totalInflow: d.totalInflow ?? 0,
    totalOutflow: d.totalOutflow ?? 0,
    monthly: d.monthly ?? [],
  };
}

export async function resetUserWalletBalance(userId: string): Promise<void> {
  await apiFetch(`/v1/admins/users/${userId}/wallet/reset`, { method: "POST", token: getToken() });
}

// ─── Fantasy XI (FPL) ────────────────────────────────────────────────────────

export type FplAdminStats = {
  totalFplTeams: number;
  totalFplLeagues: number;
  currentGwNumber: number | null;
  currentGwAvgScore: number | null;
};

export type AdminFplLeague = {
  _id: string;
  name: string;
  code: string;
  type: "classic" | "h2h";
  creatorId: string;
  season: string;
  isPrivate: boolean;
  isFree: boolean;
  entryFee: number;
  totalMembers: number;
  maxMembers: number | null;
  createdAt: string;
};

export async function getFplAdminStats(): Promise<FplAdminStats> {
  const res = await apiFetch<FplAdminStats>("/v1/admins/fpl/stats", { token: getToken() });
  return {
    totalFplTeams: res.totalFplTeams ?? 0,
    totalFplLeagues: res.totalFplLeagues ?? 0,
    currentGwNumber: res.currentGwNumber ?? null,
    currentGwAvgScore: res.currentGwAvgScore ?? null,
  };
}

export async function getAdminFplLeagues(
  options: { page?: number; limit?: number } = {},
): Promise<{ leagues: AdminFplLeague[]; total: number; pages: number }> {
  const params = new URLSearchParams();
  params.set("page", String(options.page ?? 1));
  params.set("limit", String(options.limit ?? 20));
  const res = await apiFetch<{ leagues: AdminFplLeague[]; total: number; pages: number }>(
    `/v1/admins/fpl/leagues?${params.toString()}`,
    { token: getToken() },
  );
  return {
    leagues: res.leagues ?? [],
    total: res.total ?? 0,
    pages: res.pages ?? 1,
  };
}

export async function deleteAdminFplLeague(leagueId: string): Promise<void> {
  await apiFetch(`/v1/admins/fpl/leagues/${leagueId}`, { method: "DELETE", token: getToken() });
}

export async function triggerAdminFplSync(): Promise<void> {
  await apiFetch("/v1/admins/fpl/sync", { method: "POST", token: getToken() });
}

export type LeaderboardSnapshotResult = {
  ran: boolean;
  matchdayLabel: string;
  global: number;
  nigeria: number;
  pool: number;
};

export async function triggerLeaderboardSnapshot(): Promise<LeaderboardSnapshotResult> {
  const res = await apiFetch<LeaderboardSnapshotResult>("/v1/admins/leaderboard/snapshot", {
    method: "POST",
    token: getToken(),
  });
  return {
    ran: res?.ran ?? false,
    matchdayLabel: res?.matchdayLabel ?? "",
    global: res?.global ?? 0,
    nigeria: res?.nigeria ?? 0,
    pool: res?.pool ?? 0,
  };
}


export type PlatformFeeStats = {
  season: string;
  totalCollected: number;
  totalPaidOut: number;
  net: number;
  breakdown: Record<string, { count: number; total: number }>;
};

export async function getPlatformFeeStats(season?: string): Promise<PlatformFeeStats> {
  const params = season ? `?season=${encodeURIComponent(season)}` : "";
  const res = await apiFetch<PlatformFeeStats>(`/v1/admins/fpl/fees${params}`, { token: getToken() });
  return {
    season: res.season ?? "2026/27",
    totalCollected: res.totalCollected ?? 0,
    totalPaidOut: res.totalPaidOut ?? 0,
    net: res.net ?? 0,
    breakdown: res.breakdown ?? {},
  };
}

// ─────────────────────────────────────────────────────────────────────────────

// ============================================================
// Admin platform wallet (10% fee earnings)
// ============================================================

export type AdminWallet = {
  season: string;
  totalEarned: number;
  totalWithdrawn: number;
  availableBalance: number;
};

export type AdminEarningsWithdrawal = {
  id: string;
  amount: number;
  accountNumber: string;
  bankName: string;
  accountName: string;
  paystackReference: string;
  status: "pending" | "success" | "failed";
  date: string;
};

export async function getAdminWallet(season?: string): Promise<AdminWallet> {
  const params = season ? `?season=${encodeURIComponent(season)}` : "";
  const res = await apiFetch<AdminWallet>(`/v1/admins/admin-wallet${params}`, { token: getToken() });
  return {
    season: res.season ?? "2026/27",
    totalEarned: res.totalEarned ?? 0,
    totalWithdrawn: res.totalWithdrawn ?? 0,
    availableBalance: res.availableBalance ?? 0,
  };
}

export async function adminPlatformWithdraw(payload: {
  amount: number;
  accountNumber: string;
  bankCode: string;
  accountName: string;
  bankName: string;
  password: string;
}): Promise<void> {
  await apiFetch<unknown>("/v1/admins/admin-wallet/withdraw", {
    method: "POST",
    token: getToken(),
    body: payload,
  });
}

type EarningsWithdrawalDoc = {
  _id?: string;
  id?: string;
  amount?: number;
  accountNumber?: string;
  bankName?: string;
  accountName?: string;
  paystackReference?: string;
  status?: "pending" | "success" | "failed";
  createdAt?: string;
};

export async function getAdminEarningsWithdrawals(): Promise<AdminEarningsWithdrawal[]> {
  const res = await apiFetch<EarningsWithdrawalDoc[] | { data?: EarningsWithdrawalDoc[] }>(
    "/v1/admins/admin-wallet/withdrawals",
    { token: getToken() }
  );
  const list = Array.isArray(res) ? res : (res?.data ?? []);
  return list.map((w) => ({
    id: w._id ?? w.id ?? "",
    amount: w.amount ?? 0,
    accountNumber: w.accountNumber ?? "",
    bankName: w.bankName ?? "",
    accountName: w.accountName ?? "",
    paystackReference: w.paystackReference ?? "",
    status: w.status ?? "pending",
    date: formatTxDate(w.createdAt ?? ""),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────

export async function getPools(
  options: { page?: number; name?: string; privacy?: string; personal?: boolean } = {},
): Promise<Pool[]> {
  const params = new URLSearchParams();
  params.set("page", String(options.page ?? 1));
  if (options.name) params.set("name", options.name);
  if (options.privacy) params.set("privacy", options.privacy);
  if (options.personal) params.set("personal", "true");
  const qs = params.toString();
  const res = await apiFetch<{ data?: PaginatedResponse<PoolDoc> } | PaginatedResponse<PoolDoc> | PoolDoc[]>(`/v1/admins/pools?${qs}`, {
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