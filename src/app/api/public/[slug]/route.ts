import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteCtx {
  params: Promise<{ slug: string }>;
}

export async function GET(_: Request, ctx: RouteCtx) {
  const { slug } = await ctx.params;
  const polla = await prisma.polla.findUnique({
    where: { slug },
    include: {
      bets: { orderBy: { createdAt: "asc" } },
      snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 },
    },
  });
  if (!polla) {
    return NextResponse.json({ error: "Polla no existe" }, { status: 404 });
  }
  const snapshot = polla.snapshots[0] ?? null;
  return NextResponse.json({
    polla: {
      id: polla.id,
      slug: polla.slug,
      title: polla.title,
      homeTeam: polla.homeTeam,
      awayTeam: polla.awayTeam,
      homeLogo: polla.homeLogo,
      awayLogo: polla.awayLogo,
      matchDate: polla.matchDate,
      status: polla.status,
    },
    snapshot,
    bets: polla.bets.map((b) => ({
      id: b.id,
      participantName: b.participantName,
      homeScore: b.homeScore,
      awayScore: b.awayScore,
      amount: b.amount,
      createdAt: b.createdAt,
    })),
  });
}
