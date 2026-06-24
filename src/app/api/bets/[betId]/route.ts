import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

interface RouteCtx {
  params: Promise<{ betId: string }>;
}

export async function DELETE(_: Request, ctx: RouteCtx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { betId } = await ctx.params;
  const bet = await prisma.bet.findUnique({
    where: { id: betId },
    include: { polla: true },
  });
  if (!bet) {
    return NextResponse.json({ error: "Apuesta no existe" }, { status: 404 });
  }
  if (bet.polla.status === "LOCKED" || bet.polla.status === "LIVE" || bet.polla.status === "FINISHED") {
    return NextResponse.json(
      { error: "La polla está bloqueada y no se puede modificar" },
      { status: 400 }
    );
  }
  await prisma.bet.delete({ where: { id: betId } });
  return NextResponse.json({ ok: true });
}
