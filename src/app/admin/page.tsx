import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Users, Trophy } from "lucide-react";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { STATUS_BADGE, type PollaStatus } from "@/lib/design-tokens";
import { formatCurrency } from "@/lib/winners";
import { formatMatchDate } from "@/lib/format";

export default async function AdminHome() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const pollas = await prisma.polla.findMany({
    orderBy: { matchDate: "desc" },
    include: {
      _count: { select: { bets: true } },
      bets: { select: { amount: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-display text-3xl text-score-white sm:text-4xl">
            POLLAS
          </h1>
          <p className="text-sm text-score-white/70">
            Gestiona pollas de la Selección Colombia.
          </p>
        </div>
        <Link href="/admin/pollas/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nueva polla
        </Link>
      </div>

      {pollas.length === 0 ? (
        <Card className="text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-victory" />
          <p className="mb-4 text-score-white/80">
            Aún no hay pollas creadas. Crea la primera y comparte el link.
          </p>
          <Link href="/admin/pollas/new" className="btn-primary inline-flex">
            <Plus className="h-4 w-4" />
            Crear primera polla
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pollas.map((p) => {
            const total = p.bets.reduce((s, b) => s + b.amount, 0);
            const status = STATUS_BADGE[p.status as PollaStatus] ?? STATUS_BADGE.DRAFT;
            return (
              <Link
                key={p.id}
                href={`/admin/pollas/${p.id}`}
                className="block transition-transform hover:-translate-y-1"
              >
                <Card hover className="h-full">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h2 className="text-display text-2xl leading-tight text-score-white">
                      {p.title}
                    </h2>
                    <Badge kind={status.kind} pulse={status.kind === "live"}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="mb-1 text-sm font-semibold text-score-white">
                    {p.homeTeam} <span className="text-score-white/50">vs</span> {p.awayTeam}
                  </p>
                  <p className="mb-3 text-xs text-score-white/60">
                    {formatMatchDate(p.matchDate)}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-sport-blue/20 pt-3 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-score-white/80">
                      <Users className="h-4 w-4" />
                      {p._count.bets} {p._count.bets === 1 ? "apuesta" : "apuestas"}
                    </span>
                    <span className="text-display text-xl text-victory">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
