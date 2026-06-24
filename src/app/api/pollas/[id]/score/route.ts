import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { applyMatchSnapshot } from "@/lib/snapshot";

const ScoreSchema = z.object({
  homeScore: z.number().int().min(0).max(20),
  awayScore: z.number().int().min(0).max(20),
  minute: z.number().int().min(0).max(130).nullable().optional(),
  status: z.enum(["NS", "1H", "HT", "2H", "ET", "BT", "P", "FT", "AET", "PEN", "CANC"]),
  homePossession: z.number().int().min(0).max(100).nullable().optional(),
  awayPossession: z.number().int().min(0).max(100).nullable().optional(),
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

  const body = await req.json().catch(() => null);
  const parsed = ScoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const data = parsed.data;
  const result = await applyMatchSnapshot(
    polla.id,
    { homeTeam: polla.homeTeam, awayTeam: polla.awayTeam },
    polla.status,
    {
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      minute: data.minute ?? null,
      status: data.status,
      homePossession: data.homePossession,
      awayPossession: data.awayPossession,
    }
  );

  return NextResponse.json({ result });
}
