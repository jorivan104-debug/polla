import { prisma } from "@/lib/db";
import {
  fetchFixtureById,
  fetchFixtureStatistics,
  fetchPredictions,
  isFinishedStatus,
  isLiveStatus,
  parsePossessionPercent,
} from "@/lib/api-football";
import { isManualPolla } from "@/lib/constants";
import { computeHoldProbability } from "@/lib/probability";
import type { Polla } from "@prisma/client";

export interface SyncResult {
  pollaId: string;
  status: string;
  homeScore: number;
  awayScore: number;
  minute: number | null;
  homePossession: number | null;
  awayPossession: number | null;
  holdProbability: number;
  likelyWinner: string | null;
  changed: boolean;
  finished: boolean;
}

export async function syncPolla(polla: Polla): Promise<SyncResult | null> {
  if (polla.status === "FINISHED" || polla.status === "CANCELLED") {
    return null;
  }

  if (isManualPolla(polla.fixtureId)) {
    return null;
  }

  const fixture = await fetchFixtureById(polla.fixtureId);
  if (!fixture) return null;

  const statusShort = fixture.fixture.status.short;
  const homeScore = fixture.goals.home ?? 0;
  const awayScore = fixture.goals.away ?? 0;
  const minute = fixture.fixture.status.elapsed ?? null;

  let homePossession: number | null = null;
  let awayPossession: number | null = null;
  if (isLiveStatus(statusShort)) {
    try {
      const stats = await fetchFixtureStatistics(polla.fixtureId);
      const homeStat = stats.find((s) => s.team.id === fixture.teams.home.id);
      const awayStat = stats.find((s) => s.team.id === fixture.teams.away.id);
      const findPos = (arr: typeof stats[number] | undefined) =>
        arr?.statistics.find((s) => s.type === "Ball Possession")?.value ?? null;
      homePossession = parsePossessionPercent(findPos(homeStat));
      awayPossession = parsePossessionPercent(findPos(awayStat));
    } catch {
      // ignore stats failures, posesión es opcional
    }
  }

  let likelyWinner: string | null = null;
  const last = await prisma.matchSnapshot.findFirst({
    where: { pollaId: polla.id },
    orderBy: { fetchedAt: "desc" },
  });

  if (last?.likelyWinner) {
    likelyWinner = last.likelyWinner;
  } else if (statusShort !== "NS") {
    try {
      const pred = await fetchPredictions(polla.fixtureId);
      if (pred) {
        const homePct = Number(pred.predictions.percent.home.replace("%", "")) || 0;
        const awayPct = Number(pred.predictions.percent.away.replace("%", "")) || 0;
        const drawPct = Number(pred.predictions.percent.draw.replace("%", "")) || 0;
        const max = Math.max(homePct, awayPct, drawPct);
        if (max === homePct) likelyWinner = polla.homeTeam;
        else if (max === awayPct) likelyWinner = polla.awayTeam;
        else likelyWinner = "Empate";
      }
    } catch {
      // ignore prediction failures
    }
  }

  if (!likelyWinner) {
    if (homeScore > awayScore) likelyWinner = polla.homeTeam;
    else if (awayScore > homeScore) likelyWinner = polla.awayTeam;
    else likelyWinner = "Empate";
  }

  const { holdProbability } = computeHoldProbability({
    minute,
    status: statusShort,
    homeScore,
    awayScore,
    homePossession,
    awayPossession,
  });

  const changed =
    !last ||
    last.homeScore !== homeScore ||
    last.awayScore !== awayScore ||
    last.status !== statusShort ||
    last.minute !== minute;

  await prisma.matchSnapshot.create({
    data: {
      pollaId: polla.id,
      homeScore,
      awayScore,
      minute,
      status: statusShort,
      homePossession,
      awayPossession,
      likelyWinner,
      holdProbability,
    },
  });

  let nextStatus: string = polla.status;
  if (isFinishedStatus(statusShort)) nextStatus = "FINISHED";
  else if (isLiveStatus(statusShort)) nextStatus = "LIVE";
  else if (polla.status === "OPEN" || polla.status === "DRAFT") nextStatus = polla.status;

  if (nextStatus !== polla.status) {
    await prisma.polla.update({
      where: { id: polla.id },
      data: { status: nextStatus },
    });
  }

  return {
    pollaId: polla.id,
    status: statusShort,
    homeScore,
    awayScore,
    minute,
    homePossession,
    awayPossession,
    holdProbability,
    likelyWinner,
    changed,
    finished: isFinishedStatus(statusShort),
  };
}

export async function syncAllActivePollas(): Promise<SyncResult[]> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const threeHoursAhead = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  const pollas = await prisma.polla.findMany({
    where: {
      status: { in: ["LOCKED", "LIVE", "OPEN"] },
      matchDate: { gte: oneHourAgo, lte: threeHoursAhead },
    },
  });

  const results: SyncResult[] = [];
  for (const polla of pollas) {
    const r = await syncPolla(polla);
    if (r) results.push(r);
  }
  return results;
}
