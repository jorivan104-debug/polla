import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ slug: string }>;
}

async function buildPayload(slug: string) {
  const polla = await prisma.polla.findUnique({
    where: { slug },
    include: {
      bets: { orderBy: { createdAt: "asc" } },
      snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 },
    },
  });
  if (!polla) return null;
  return {
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
    snapshot: polla.snapshots[0] ?? null,
    bets: polla.bets.map((b) => ({
      id: b.id,
      participantName: b.participantName,
      homeScore: b.homeScore,
      awayScore: b.awayScore,
      amount: b.amount,
      createdAt: b.createdAt,
    })),
  };
}

export async function GET(_req: Request, ctx: RouteCtx) {
  const { slug } = await ctx.params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let lastSerialized = "";

      const send = (event: string, data: unknown) => {
        if (closed) return;
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      const tick = async () => {
        try {
          const payload = await buildPayload(slug);
          if (!payload) {
            send("error", { message: "Polla no existe" });
            controller.close();
            closed = true;
            return;
          }
          const serialized = JSON.stringify(payload);
          if (serialized !== lastSerialized) {
            lastSerialized = serialized;
            send("snapshot", payload);
          } else {
            send("ping", { t: Date.now() });
          }
          if (payload.polla.status === "FINISHED" || payload.polla.status === "CANCELLED") {
            setTimeout(() => {
              if (!closed) {
                controller.close();
                closed = true;
              }
            }, 30_000);
          }
        } catch {
          send("error", { message: "Error servidor" });
        }
      };

      await tick();
      const interval = setInterval(tick, 5000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {}
      };

      _req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
