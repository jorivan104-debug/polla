import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

const PatchSchema = z.object({
  status: z.enum(["DRAFT", "OPEN", "LOCKED", "LIVE", "FINISHED", "CANCELLED"]).optional(),
  title: z.string().min(3).max(100).optional(),
});

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, ctx: RouteCtx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const polla = await prisma.polla.findUnique({
    where: { id },
    include: { bets: { orderBy: { createdAt: "desc" } } },
  });
  if (!polla) {
    return NextResponse.json({ error: "No existe" }, { status: 404 });
  }
  return NextResponse.json({ polla });
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const polla = await prisma.polla.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ polla });
}

export async function DELETE(_: Request, ctx: RouteCtx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await prisma.polla.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
