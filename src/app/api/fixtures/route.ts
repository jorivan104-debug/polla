import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { fetchUpcomingColombiaFixtures } from "@/lib/api-football";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const fixtures = await fetchUpcomingColombiaFixtures(15);
    const simplified = fixtures.map((f) => ({
      id: f.fixture.id,
      date: f.fixture.date,
      status: f.fixture.status.short,
      league: f.league.name,
      round: f.league.round,
      home: { id: f.teams.home.id, name: f.teams.home.name, logo: f.teams.home.logo },
      away: { id: f.teams.away.id, name: f.teams.away.name, logo: f.teams.away.logo },
      venue: f.fixture.venue.name,
    }));
    return NextResponse.json({ fixtures: simplified });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
