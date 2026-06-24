import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { syncPolla } from "@/lib/sync";

interface RouteCtx {
  params: Promise<{ pollaId: string }>;
}

export async function POST(_: Request, ctx: RouteCtx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { pollaId } = await ctx.params;
  const polla = await prisma.polla.findUnique({ where: { id: pollaId } });
  if (!polla) {
    return NextResponse.json({ error: "Polla no existe" }, { status: 404 });
  }
  try {
    const result = await syncPolla(polla);
    return NextResponse.json({ result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
