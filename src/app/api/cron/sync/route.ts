import { NextResponse } from "next/server";
import { syncAllActivePollas } from "@/lib/sync";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const results = await syncAllActivePollas();
    return NextResponse.json({
      synced: results.length,
      results: results.map((r) => ({
        pollaId: r.pollaId,
        status: r.status,
        score: `${r.homeScore}-${r.awayScore}`,
        minute: r.minute,
        finished: r.finished,
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
