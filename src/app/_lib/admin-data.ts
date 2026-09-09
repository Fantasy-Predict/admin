export type AdminUser = {
  id: string;
  username: string;
  email: string;
  country: string;
  joined: string;
  balance: number;
  status: "active" | "suspended" | "pending KYC";
};

export type AdminPayout = {
  id: string;
  user: string;
  amount: number;
  method: string;
  requested: string;
  status: "awaiting review" | "approved" | "rejected";
};

export type AdminResult = {
  id: string;
  fixture: string;
  kickoff: string;
  score?: string;
  status: "scheduled" | "awaiting result" | "settled";
};

export type AdminActivity = [
  title: string,
  description: string,
  time: string
];

export const adminStats = {
  totalUsers: 8412,
  activeUsers: 3187,
  totalPools: 380,
  predictionsThisWeek: 24190,
  depositsThisMonth: 4820000,
  withdrawalsThisMonth: 1965000,
  pendingPayouts: 7,
  platformRevenue: 612000,
  // NEW: Platform fees collected this month (10% from monetized pools)
  platformFeesThisMonth: 124500,
  // NEW: Breakdown of free vs monetized pools (will be calculated in components)
};

export const adminUsers: AdminUser[] = [
  { id: "au1", username: "adaokoye", email: "ada@example.com", country: "Nigeria", joined: "12 Mar 2026", balance: 42500, status: "active" },
  { id: "au2", username: "tunde.b", email: "tunde@example.com", country: "Nigeria", joined: "02 Apr 2026", balance: 18300, status: "active" },
  { id: "au3", username: "mo.hassan", email: "mo@example.com", country: "Egypt", joined: "19 Apr 2026", balance: 6500, status: "pending KYC" },
  { id: "au4", username: "kwesi_a", email: "kwesi@example.com", country: "Ghana", joined: "05 May 2026", balance: 0, status: "suspended" },
  { id: "au5", username: "sarah.k", email: "sarah@example.com", country: "Kenya", joined: "21 May 2026", balance: 27400, status: "active" },
  { id: "au6", username: "danielp", email: "daniel@example.com", country: "South Africa", joined: "08 Jun 2026", balance: 9100, status: "active" },
];

export const adminPayouts: AdminPayout[] = [
  { id: "p1", user: "adaokoye", amount: 15000, method: "GTBank ••4412", requested: "03 Jul 2026", status: "awaiting review" },
  { id: "p2", user: "sarah.k", amount: 40000, method: "M-Pesa ••7781", requested: "02 Jul 2026", status: "awaiting review" },
  { id: "p3", user: "tunde.b", amount: 8000, method: "Access ••1190", requested: "30 Jun 2026", status: "approved" },
  { id: "p4", user: "kwesi_a", amount: 22000, method: "MTN MoMo ••3320", requested: "27 Jun 2026", status: "rejected" },
];

export const adminResults: AdminResult[] = [
  { id: "r1", fixture: "Arsenal vs Chelsea", kickoff: "Sat 15:00", status: "scheduled" },
  { id: "r2", fixture: "Liverpool vs Man City", kickoff: "Sat 17:30", status: "scheduled" },
  { id: "r3", fixture: "Aston Villa vs Brighton", kickoff: "Fri 20:00", status: "awaiting result" },
  { id: "r4", fixture: "Inter vs Napoli", kickoff: "Wed 19:45", score: "2 - 0", status: "settled" },
];

export const adminActivity: AdminActivity[] = [
  ["Payout approved", "₦8,000 to tunde.b", "12 minutes ago"],
  ["Pool created", "Weekend Warriors II · ₦1,000 entry · Free pool", "1 hour ago"],
  ["Result settled", "Inter 2 - 0 Napoli · 1,204 predictions scored", "3 hours ago"],
  ["User suspended", "kwesi_a flagged for duplicate accounts", "Yesterday"],
  ["Platform fee collected", "₦12,500 from Premier Predictors (10%)", "2 days ago"],
] as const;