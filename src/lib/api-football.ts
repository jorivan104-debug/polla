const BASE_URL = "https://v3.football.api-sports.io";

export const COLOMBIA_TEAM_ID = 1138;

export interface ApiFootballTeam {
  id: number;
  name: string;
  logo: string;
}

export interface ApiFootballFixture {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    status: { short: string; long: string; elapsed: number | null };
    venue: { name: string | null; city: string | null };
  };
  league: { id: number; name: string; round: string; logo: string };
  teams: {
    home: ApiFootballTeam & { winner: boolean | null };
    away: ApiFootballTeam & { winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
  };
}

interface ApiResponse<T> {
  errors: unknown;
  results: number;
  response: T;
}

class ApiFootballError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiFootballError";
    this.status = status;
  }
}

async function apiGet<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    throw new ApiFootballError(
      "Falta API_FOOTBALL_KEY en las variables de entorno. Regístrate gratis en dashboard.api-football.com."
    );
  }

  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) search.set(k, String(v));

  const url = `${BASE_URL}${path}?${search.toString()}`;
  const res = await fetch(url, {
    headers: {
      "x-apisports-key": key,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new ApiFootballError(
      `API-Football respondió ${res.status} ${res.statusText}`,
      res.status
    );
  }

  const json = (await res.json()) as ApiResponse<T>;

  if (json.errors && typeof json.errors === "object" && Object.keys(json.errors as object).length > 0) {
    throw new ApiFootballError(
      `API-Football errores: ${JSON.stringify(json.errors)}`
    );
  }

  return json.response;
}

export async function fetchUpcomingColombiaFixtures(next = 10): Promise<ApiFootballFixture[]> {
  return apiGet<ApiFootballFixture[]>("/fixtures", {
    team: COLOMBIA_TEAM_ID,
    next,
  });
}

export async function fetchRecentColombiaFixtures(last = 5): Promise<ApiFootballFixture[]> {
  return apiGet<ApiFootballFixture[]>("/fixtures", {
    team: COLOMBIA_TEAM_ID,
    last,
  });
}

export async function fetchFixtureById(id: number): Promise<ApiFootballFixture | null> {
  const res = await apiGet<ApiFootballFixture[]>("/fixtures", { id });
  return res[0] ?? null;
}

export interface FixtureStatistic {
  team: { id: number; name: string; logo: string };
  statistics: Array<{ type: string; value: string | number | null }>;
}

export async function fetchFixtureStatistics(fixtureId: number): Promise<FixtureStatistic[]> {
  return apiGet<FixtureStatistic[]>("/fixtures/statistics", { fixture: fixtureId });
}

export interface PredictionResponse {
  predictions: {
    winner: { id: number | null; name: string | null; comment: string | null };
    win_or_draw: boolean;
    under_over: string | null;
    goals: { home: string | null; away: string | null };
    advice: string;
    percent: { home: string; draw: string; away: string };
  };
  teams: {
    home: ApiFootballTeam;
    away: ApiFootballTeam;
  };
}

export async function fetchPredictions(fixtureId: number): Promise<PredictionResponse | null> {
  const res = await apiGet<PredictionResponse[]>("/predictions", { fixture: fixtureId });
  return res[0] ?? null;
}

export function isLiveStatus(status: string): boolean {
  return ["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(status);
}

export function isFinishedStatus(status: string): boolean {
  return ["FT", "AET", "PEN", "AWD", "WO"].includes(status);
}

export function parsePossessionPercent(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  const cleaned = value.replace("%", "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
