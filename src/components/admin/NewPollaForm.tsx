"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Calendar, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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

export function NewPollaForm() {
  const router = useRouter();
  const [fixtures, setFixtures] = useState<FixtureOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FixtureOption | null>(null);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadFixtures() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fixtures");
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "No se pudieron cargar los partidos");
        setFixtures([]);
      } else {
        setFixtures(data.fixtures);
      }
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFixtures();
  }, []);

  function handleSelect(fixture: FixtureOption) {
    setSelected(fixture);
    if (!title) {
      const date = new Date(fixture.date).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
      });
      setTitle(`${fixture.home.name} vs ${fixture.away.name} (${date})`);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/pollas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          fixtureId: selected.id,
          homeTeam: selected.home.name,
          awayTeam: selected.away.name,
          homeLogo: selected.home.logo,
          awayLogo: selected.away.logo,
          matchDate: selected.date,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "No se pudo crear la polla");
        setSubmitting(false);
        return;
      }
      router.push(`/admin/pollas/${data.polla.id}`);
      router.refresh();
    } catch {
      setError("Error de red");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-display text-xl text-victory">Próximos partidos</h2>
          <button
            type="button"
            onClick={loadFixtures}
            className="inline-flex items-center gap-1.5 text-xs text-score-white/70 transition hover:text-victory"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refrescar
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-passion-red/40 bg-passion-red/10 px-3 py-2 text-sm text-passion-red">
            {error}
          </div>
        )}

        {loading && fixtures.length === 0 ? (
          <p className="text-sm text-score-white/70">Cargando partidos...</p>
        ) : fixtures.length === 0 ? (
          <div className="rounded-lg border border-sport-blue/20 bg-stadium-deep/40 p-4 text-sm text-score-white/70">
            <Trophy className="mb-2 h-5 w-5 text-victory" />
            No hay partidos próximos de Colombia en los próximos 6 meses. Verifica{" "}
            <code>API_FOOTBALL_KEY</code> en Dokploy o que haya fechas programadas.
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
                  <div className="flex-1 min-w-0">
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
            <label htmlFor="title" className="label-base">
              Título
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
