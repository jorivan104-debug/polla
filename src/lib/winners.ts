import type { Bet } from "@prisma/client";

export interface WinnerResult {
  totalPot: number;
  winners: Array<{
    bet: Bet;
    prize: number;
  }>;
  prizePerWinner: number;
  hasWinners: boolean;
}

export function computeWinners(
  bets: Bet[],
  finalHomeScore: number,
  finalAwayScore: number
): WinnerResult {
  const totalPot = bets.reduce((sum, b) => sum + b.amount, 0);
  const winningBets = bets.filter(
    (b) => b.homeScore === finalHomeScore && b.awayScore === finalAwayScore
  );
  const hasWinners = winningBets.length > 0;
  const prizePerWinner = hasWinners ? totalPot / winningBets.length : 0;

  return {
    totalPot,
    winners: winningBets.map((bet) => ({ bet, prize: prizePerWinner })),
    prizePerWinner,
    hasWinners,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
