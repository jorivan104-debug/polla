interface ProbInput {
  minute: number | null | undefined;
  status: string;
  homeScore: number;
  awayScore: number;
  homePossession?: number | null;
  awayPossession?: number | null;
}

interface ProbOutput {
  holdProbability: number;
  leaderTeam: "home" | "away" | "draw";
}

const BASE_TABLE: Array<{ minute: number; one: number; draw: number; two: number }> = [
  { minute: 0, one: 50, draw: 50, two: 60 },
  { minute: 15, one: 52, draw: 50, two: 70 },
  { minute: 30, one: 55, draw: 50, two: 75 },
  { minute: 45, one: 60, draw: 50, two: 80 },
  { minute: 60, one: 68, draw: 50, two: 88 },
  { minute: 75, one: 78, draw: 52, two: 92 },
  { minute: 80, one: 82, draw: 55, two: 95 },
  { minute: 85, one: 86, draw: 60, two: 96 },
  { minute: 90, one: 92, draw: 70, two: 98 },
];

function lookupBase(minute: number, goalDiff: number): number {
  const cap = Math.min(95, Math.max(0, minute));
  let bucket = BASE_TABLE[0];
  for (const row of BASE_TABLE) {
    if (cap >= row.minute) bucket = row;
  }
  if (goalDiff === 0) return bucket.draw;
  if (Math.abs(goalDiff) >= 2) return bucket.two;
  return bucket.one;
}

export function computeHoldProbability(input: ProbInput): ProbOutput {
  const { minute, status, homeScore, awayScore, homePossession, awayPossession } = input;
  const diff = homeScore - awayScore;
  const leader: ProbOutput["leaderTeam"] = diff === 0 ? "draw" : diff > 0 ? "home" : "away";

  if (status === "FT" || status === "AET" || status === "PEN") {
    return { holdProbability: 100, leaderTeam: leader };
  }
  if (status === "NS" || status === "TBD" || status === "PST" || status === "CANC") {
    return { holdProbability: 0, leaderTeam: leader };
  }

  const safeMinute = minute ?? (status === "HT" ? 45 : 0);
  let prob = lookupBase(safeMinute, diff);

  const leaderPos =
    leader === "home" ? homePossession : leader === "away" ? awayPossession : null;
  if (leaderPos != null && Number.isFinite(leaderPos)) {
    prob += (leaderPos - 50) * 0.3;
  }

  if (leader === "draw" && homePossession != null && awayPossession != null) {
    const dominance = Math.abs(homePossession - awayPossession);
    prob -= dominance * 0.15;
  }

  return {
    holdProbability: Math.round(Math.max(5, Math.min(95, prob))),
    leaderTeam: leader,
  };
}
