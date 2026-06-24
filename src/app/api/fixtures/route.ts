import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { API_FOOTBALL_ENABLED } from "@/lib/constants";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!API_FOOTBALL_ENABLED) {
    return NextResponse.json(
      {
        fixtures: [],
        apiUnavailable: true,
        manualRecommended: true,
        error: "API-Football desactivada",
        hint: "Usa el modo manual para crear pollas.",
      },
      { status: 403 }
    );
  }

  return NextResponse.json(
    { fixtures: [], apiUnavailable: true, error: "No implementado" },
    { status: 501 }
  );
}
