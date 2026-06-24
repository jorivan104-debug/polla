import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

const BetSchema = z.object({
  participantName: z.string().min(1).max(60),
  homeScore: z.number().int().min(0).max(20),
  awayScore: z.number().int().min(0).max(20),
  amount: z.number().nonnegative().max(1_000_000_000),
});

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, ctx: RouteCtx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const polla = await prisma.polla.findUnique({ where: { id } });
  if (!polla) {
    return NextResponse.json({ error: "Polla no existe" }, { status: 404 });
  }
  if (polla.status === "LOCKED" || polla.status === "LIVE" || polla.status === "FINISHED") {
    return NextResponse.json(
      { error: "La polla está bloqueada y no admite nuevas apuestas" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = BetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const bet = await prisma.bet.create({
    data: { ...parsed.data, pollaId: id },
  });
  return NextResponse.json({ bet });
}
