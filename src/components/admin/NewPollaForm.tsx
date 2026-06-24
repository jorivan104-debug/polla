"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Calendar, PenLine, RefreshCw, Trophy, Wifi } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MANUAL_FIXTURE_ID } from "@/lib/constants";

type Mode = "manual" | "api";

interface FixtureOption {
  id: number;
  date: string;
  status: string;
  league: string;
  round: string;
  home: { id: number; name: string; logo: string };
  away: { id: number; name: string; logo: string };
  venue: string | null;
}

function defaultDateTimeLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function NewPollaForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("manual");

  // Manual
  const [homeTeam, setHomeTeam] = useState("Colombia");
  const [awayTeam, setAwayTeam] = useState("");
  const [matchDateTime, setMatchDateTime] = useState(defaultDateTimeLocal);
  const [manualTitle, setManualTitle] = useState("");

  // API
  const [fixtures, setFixtures] = useState<FixtureOption[]>([]);
  const [apiHint, setApiHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FixtureOption | null>(null);
  const [apiTitle, setApiTitle] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadFixtures() {
    setLoading(true);
    setError(null);
    setApiHint(null);
    try {
      const res = await fetch("/api/fixtures");
      const data = await res.json();
      setFixtures(data.fixtures ?? []);
      if (data.apiUnavailable) {
        setApiHint(data.hint ?? data.error);
      }
      if (data.manualRecommended) {
        setApiHint(
          data.hint ??
            "API-Football no disponible en plan gratuito para esta temporada. Usa el modo manual."
        );
      }
    } catch {
      setError("Error de red al cargar partidos");
      setFixtures([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (mode === "api") void loadFixtures();
  }, [mode]);

  function handleSelect(fixture: FixtureOption) {
    setSelected(fixture);
    if (!apiTitle) {
      const date = new Date(fixture.date).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
      });
      setApiTitle(`${fixture.home.name} vs ${fixture.away.name} (${date})`);
    }
  }

  async function createPolla(payload: {
    title: string;
    fixtureId: number;
    homeTeam: string;
    awayTeam: string;
    homeLogo?: string | null;
    awayLogo?: string | null;
    matchDate: string;
  }) {
    const res = await fetch("/api/pollas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error ?? "No se pudo crear la polla");
    }
    router.push(`/admin/pollas/${data.polla.id}`);
    router.refresh();
  }

  async function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const opponent = awayTeam.trim();
      const home = homeTeam.trim();
      if (!home.toLowerCase().includes("colombia") && !opponent.toLowerCase().includes("colombia")) {
        setError("Uno de los equipos debe ser Colombia");
        setSubmitting(false);
        return;
      }
      const date = new Date(matchDateTime);
      const title =
        manualTitle.trim() ||
        `${home} vs ${opponent} (${date.toLocaleDateString("es-CO", {
          day: "numeric",
          month: "short",
        })})`;

      await createPolla({
        title,
        fixtureId: MANUAL_FIXTURE_ID,
        homeTeam: home,
        awayTeam: opponent,
        matchDate: date.toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear");
      setSubmitting(false);
    }
  }

  async function handleApiSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await createPolla({
        title: apiTitle,
        fixtureId: selected.id,
        homeTeam: selected.home.name,
        awayTeam: selected.away.name,
        homeLogo: selected.home.logo,
        awayLogo: selected.away.logo,
        matchDate: selected.date,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-xl border border-sport-blue/20 bg-stadium-deep/40 p-1">
        <ModeTab active={mode === "manual"} onClick={() => setMode("manual")} icon={<PenLine className="h-4 w-4" />}>
          Manual (recomendado)
        </ModeTab>
        <ModeTab active={mode === "api"} onClick={() => setMode("api")} icon={<Wifi className="h-4 w-4" />}>
          Desde API
        </ModeTab>
      </div>

      {error && (
        <div className="rounded-lg border border-passion-red/40 bg-passion-red/10 px-3 py-2 text-sm text-passion-red">
          {error}
        </div>
      )}

      {mode === "manual" ? (
        <Card>
          <h2 className="text-display mb-1 text-xl text-victory">Crear partido manualmente</h2>
          <p className="mb-4 text-sm text-score-white/70">
            Sin API externa. Tú actualizas el marcador durante el partido desde el panel de la polla.
          </p>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="homeTeam" className="label-base">
                  Equipo local
                </label>
                <input
                  id="homeTeam"
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  className="input-base"
                  required
                />
              </div>
              <div>
                <label htmlFor="awayTeam" className="label-base">
                  Equipo visitante
                </label>
                <input
                  id="awayTeam"
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  className="input-base"
                  required
                  placeholder="Ej: Brasil"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="matchDateTime" className="label-base">
                  Fecha y hora del partido
                </label>
                <input
                  id="matchDateTime"
                  type="datetime-local"
                  value={matchDateTime}
                  onChange={(e) => setMatchDateTime(e.target.value)}
                  className="input-base"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="manualTitle" className="label-base">
                  Título de la polla (opcional)
                </label>
                <input
                  id="manualTitle"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="input-base"
                  placeholder="Se genera automáticamente si lo dejas vacío"
                  maxLength={100}
                />
              </div>
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creando..." : "Crear polla manual"}
            </Button>
          </form>
        </Card>
      ) : (
        <form onSubmit={handleApiSubmit} className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-display text-xl text-victory">Próximos partidos (API)</h2>
              <button
                type="button"
                onClick={loadFixtures}
                className="inline-flex items-center gap-1.5 text-xs text-score-white/70 transition hover:text-victory"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Refrescar
              </button>
            </div>

            {apiHint && (
              <div className="mb-3 rounded-lg border border-sport-blue/30 bg-sport-blue/10 px-3 py-2 text-sm text-score-white/80">
                {apiHint}
              </div>
            )}

            {loading && fixtures.length === 0 ? (
              <p className="text-sm text-score-white/70">Cargando partidos...</p>
            ) : fixtures.length === 0 ? (
              <div className="rounded-lg border border-sport-blue/20 bg-stadium-deep/40 p-4 text-sm text-score-white/70">
                <Trophy className="mb-2 h-5 w-5 text-victory" />
                No hay partidos desde la API. Usa el modo <strong>Manual</strong>.
              </div>
            ) : (
              <div className="space-y-2">
                {fixtures.map((f) => {
                  const isSel = selected?.id === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleSelect(f)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                        isSel
                          ? "border-victory bg-victory/10"
                          : "border-sport-blue/20 bg-stadium-deep/40 hover:border-sport-blue/60"
                      }`}
                    >
                      <FixtureLogo src={f.home.logo} alt={f.home.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-score-white">
                          {f.home.name} <span className="text-score-white/50">vs</span> {f.away.name}
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-score-white/60">
                          <Calendar className="h-3 w-3" />
                          {new Date(f.date).toLocaleString("es-CO", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          <span className="text-score-white/40">•</span>
                          <span className="truncate">{f.league}</span>
                        </p>
                      </div>
                      <FixtureLogo src={f.away.logo} alt={f.away.name} />
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {selected && (
            <Card>
              <h2 className="text-display mb-4 text-xl text-victory">Datos de la polla</h2>
              <div>
                <label htmlFor="apiTitle" className="label-base">
                  Título
                </label>
                <input
                  id="apiTitle"
                  value={apiTitle}
                  onChange={(e) => setApiTitle(e.target.value)}
                  className="input-base"
                  required
                  minLength={3}
                  maxLength={100}
                />
              </div>
              <Button type="submit" disabled={submitting} className="mt-4 w-full sm:w-auto">
                {submitting ? "Creando..." : "Crear polla"}
              </Button>
            </Card>
          )}
        </form>
      )}
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-victory text-stadium-dark"
          : "text-score-white/70 hover:bg-stadium-dark/60 hover:text-score-white"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function FixtureLogo({ src, alt }: { src: string; alt: string }) {
  if (!src) {
    return <div className="h-9 w-9 rounded-full bg-stadium-dark" />;
  }
  return (
    <div className="relative h-9 w-9 shrink-0 rounded-full bg-score-white/95 p-1">
      <Image
        src={src}
        alt={alt}
        width={36}
        height={36}
        className="h-full w-full object-contain"
        unoptimized
      />
    </div>
  );
}
