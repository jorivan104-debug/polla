import { prisma } from "@/lib/db";
import { isFinishedStatus, isLiveStatus } from "@/lib/api-football";
import { computeHoldProbability } from "@/lib/probability";
import type { SyncResult } from "@/lib/sync";

interface SnapshotInput {
  homeScore: number;
  awayScore: number;
  minute: number | null;
  status: string;
  homePossession?: number | null;
  awayPossession?: number | null;
}

export async function applyMatchSnapshot(
  pollaId: string,
  teams: { homeTeam: string; awayTeam: string },
  currentPollaStatus: string,
  input: SnapshotInput
): Promise<SyncResult> {
  const { homeScore, awayScore, minute, status, homePossession, awayPossession } = input;

  let likelyWinner: string;
  if (homeScore > awayScore) likelyWinner = teams.homeTeam;
  else if (awayScore > homeScore) likelyWinner = teams.awayTeam;
  else likelyWinner = "Empate";

  const { holdProbability } = computeHoldProbability({
    minute,
    status,
    homeScore,
    awayScore,
    homePossession: homePossession ?? null,
    awayPossession: awayPossession ?? null,
  });

  const last = await prisma.matchSnapshot.findFirst({
    where: { pollaId },
    orderBy: { fetchedAt: "desc" },
  });

  const changed =
    !last ||
    last.homeScore !== homeScore ||
    last.awayScore !== awayScore ||
    last.status !== status ||
    last.minute !== minute;

  await prisma.matchSnapshot.create({
    data: {
      pollaId,
      homeScore,
      awayScore,
      minute,
      status,
      homePossession: homePossession ?? null,
      awayPossession: awayPossession ?? null,
      likelyWinner,
      holdProbability,
    },
  });

  let nextStatus = currentPollaStatus;
  if (isFinishedStatus(status)) nextStatus = "FINISHED";
  else if (isLiveStatus(status) || status === "HT") nextStatus = "LIVE";
  else if (currentPollaStatus === "LOCKED" && status === "NS") nextStatus = "LOCKED";

  if (nextStatus !== currentPollaStatus) {
    await prisma.polla.update({
      where: { id: pollaId },
      data: { status: nextStatus },
    });
  }

  return {
    pollaId,
    status,
    homeScore,
    awayScore,
    minute,
    homePossession: homePossession ?? null,
    awayPossession: awayPossession ?? null,
    holdProbability,
    likelyWinner,
    changed,
    finished: isFinishedStatus(status),
  };
}
