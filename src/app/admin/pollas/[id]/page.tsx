import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { ManagePollaPanel } from "@/components/admin/ManagePollaPanel";
import { Badge } from "@/components/ui/Badge";
import { STATUS_BADGE, type PollaStatus } from "@/lib/design-tokens";
import { formatMatchDate } from "@/lib/format";

interface PageCtx {
  params: Promise<{ id: string }>;
}

export default async function PollaAdminPage({ params }: PageCtx) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
  const { id } = await params;
  const polla = await prisma.polla.findUnique({
    where: { id },
    include: {
      bets: { orderBy: { createdAt: "desc" } },
      snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 },
    },
  });
  if (!polla) notFound();

  const status = STATUS_BADGE[polla.status as PollaStatus] ?? STATUS_BADGE.DRAFT;
  const totalPot = polla.bets.reduce((s, b) => s + b.amount, 0);
  const lastSync = polla.snapshots[0] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-score-white/70 transition hover:text-victory"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al listado
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-display text-3xl text-score-white sm:text-4xl">
              {polla.title}
            </h1>
            <p className="mt-1 text-sm text-score-white/70">
              {polla.homeTeam} vs {polla.awayTeam} — {formatMatchDate(polla.matchDate)}
            </p>
          </div>
          <Badge kind={status.kind} pulse={status.kind === "live"}>
            {status.label}
          </Badge>
        </div>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-score-white/80">
          <span className="text-score-white/60">Link público:</span>{" "}
          <code className="rounded bg-stadium-deep/60 px-2 py-1 text-victory">
            /p/{polla.slug}
          </code>
        </div>
        <Link
          href={`/p/${polla.slug}`}
          target="_blank"
          className="btn-secondary text-sm"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir vista pública
        </Link>
      </div>

      <ManagePollaPanel
        polla={{
          id: polla.id,
          slug: polla.slug,
          title: polla.title,
          status: polla.status,
          homeTeam: polla.homeTeam,
          awayTeam: polla.awayTeam,
          fixtureId: polla.fixtureId,
        }}
        bets={polla.bets.map((b) => ({
          id: b.id,
          participantName: b.participantName,
          homeScore: b.homeScore,
          awayScore: b.awayScore,
          amount: b.amount,
          createdAt: b.createdAt.toISOString(),
        }))}
        totalPot={totalPot}
        lastSync={
          lastSync
            ? {
                homeScore: lastSync.homeScore,
                awayScore: lastSync.awayScore,
                minute: lastSync.minute,
                status: lastSync.status,
                fetchedAt: lastSync.fetchedAt.toISOString(),
              }
            : null
        }
      />
    </div>
  );
}
