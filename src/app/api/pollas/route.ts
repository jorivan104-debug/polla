import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { randomSuffix, slugify } from "@/lib/slug";

import { MANUAL_FIXTURE_ID } from "@/lib/constants";

const CreateSchema = z.object({
  title: z.string().min(3).max(100),
  fixtureId: z.number().int().min(0),
  homeTeam: z.string().min(1),
  awayTeam: z.string().min(1),
  homeLogo: z.string().url().optional().nullable(),
  awayLogo: z.string().url().optional().nullable(),
  matchDate: z.string().min(1),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const pollas = await prisma.polla.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { bets: true } },
      bets: { select: { amount: true } },
    },
  });
  return NextResponse.json({
    pollas: pollas.map((p) => ({
      ...p,
      totalPot: p.bets.reduce((s, b) => s + b.amount, 0),
      betCount: p._count.bets,
      bets: undefined,
      _count: undefined,
    })),
  });
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const home = data.homeTeam.toLowerCase();
  const away = data.awayTeam.toLowerCase();
  if (!home.includes("colombia") && !away.includes("colombia")) {
    return NextResponse.json(
      { error: "Solo se permiten partidos de la Selección Colombia" },
      { status: 400 }
    );
  }

  const baseSlug = slugify(data.title) || "polla";
  let slug = baseSlug;
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.polla.findUnique({ where: { slug } });
    if (!exists) break;
    slug = `${baseSlug}-${randomSuffix()}`;
  }

  const polla = await prisma.polla.create({
    data: {
      slug,
      title: data.title,
      fixtureId: data.fixtureId,
      homeTeam: data.homeTeam,
      awayTeam: data.awayTeam,
      homeLogo: data.homeLogo ?? null,
      awayLogo: data.awayLogo ?? null,
      matchDate: new Date(data.matchDate),
      status: "OPEN",
    },
  });

  return NextResponse.json({ polla });
}
