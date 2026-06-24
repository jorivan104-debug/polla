import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PollaComposer } from "@/components/PollaComposer";

export const dynamic = "force-dynamic";

interface PageCtx {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageCtx) {
  const { slug } = await params;
  const polla = await prisma.polla.findUnique({ where: { slug } });
  if (!polla) return { title: "Polla no encontrada" };
  return {
    title: `${polla.title} • Polla Mundialista`,
    description: `Polla de marcador exacto: ${polla.homeTeam} vs ${polla.awayTeam}.`,
  };
}

export default async function PublicPollaPage({ params }: PageCtx) {
  const { slug } = await params;
  const polla = await prisma.polla.findUnique({
    where: { slug },
    include: {
      bets: { orderBy: { createdAt: "asc" } },
      snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 },
    },
  });
  if (!polla) notFound();

  const initial = {
    polla: {
      id: polla.id,
      slug: polla.slug,
      title: polla.title,
      homeTeam: polla.homeTeam,
      awayTeam: polla.awayTeam,
      homeLogo: polla.homeLogo,
      awayLogo: polla.awayLogo,
      matchDate: polla.matchDate.toISOString(),
      status: polla.status,
    },
    snapshot: polla.snapshots[0]
      ? {
          homeScore: polla.snapshots[0].homeScore,
          awayScore: polla.snapshots[0].awayScore,
          minute: polla.snapshots[0].minute,
          status: polla.snapshots[0].status,
          homePossession: polla.snapshots[0].homePossession,
          awayPossession: polla.snapshots[0].awayPossession,
          likelyWinner: polla.snapshots[0].likelyWinner,
          holdProbability: polla.snapshots[0].holdProbability,
          fetchedAt: polla.snapshots[0].fetchedAt.toISOString(),
        }
      : null,
    bets: polla.bets.map((b) => ({
      id: b.id,
      participantName: b.participantName,
      homeScore: b.homeScore,
      awayScore: b.awayScore,
      amount: b.amount,
      createdAt: b.createdAt.toISOString(),
    })),
  };

  return <PollaComposer slug={slug} initial={initial} />;
}
