"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MANUAL_FIXTURE_ID } from "@/lib/constants";

function defaultDateTimeLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function NewPollaForm() {
  const router = useRouter();
  const [homeTeam, setHomeTeam] = useState("Colombia");
  const [awayTeam, setAwayTeam] = useState("");
  const [matchDateTime, setMatchDateTime] = useState(defaultDateTimeLocal);
  const [manualTitle, setManualTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
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

      const res = await fetch("/api/pollas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          fixtureId: MANUAL_FIXTURE_ID,
          homeTeam: home,
          awayTeam: opponent,
          matchDate: date.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "No se pudo crear la polla");
      }
      router.push(`/admin/pollas/${data.polla.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-passion-red/40 bg-passion-red/10 px-3 py-2 text-sm text-passion-red">
          {error}
        </div>
      )}

      <Card>
        <h2 className="text-display mb-1 text-xl text-victory">Crear partido</h2>
        <p className="mb-4 text-sm text-score-white/70">
          Crea la polla manualmente. Tú registras las apuestas y actualizas el marcador durante el partido.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            {submitting ? "Creando..." : "Crear polla"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
