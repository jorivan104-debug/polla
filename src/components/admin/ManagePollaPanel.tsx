"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Lock,
  Unlock,
  RefreshCw,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  Radio,
} from "lucide-react";
import { isManualPolla } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/winners";
import { timeAgo } from "@/lib/format";

interface BetView {
  id: string;
  participantName: string;
  homeScore: number;
  awayScore: number;
  amount: number;
  createdAt: string;
}

interface PollaView {
  id: string;
  slug: string;
  title: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
  fixtureId: number;
}

interface SyncView {
  homeScore: number;
  awayScore: number;
  minute: number | null;
  status: string;
  fetchedAt: string;
}

interface Props {
  polla: PollaView;
  bets: BetView[];
  totalPot: number;
  lastSync: SyncView | null;
}

export function ManagePollaPanel({ polla, bets, totalPot, lastSync }: Props) {
  const router = useRouter();
  const isManual = isManualPolla(polla.fixtureId);

  const [participantName, setParticipantName] = useState("");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [amount, setAmount] = useState<string>("");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [liveHome, setLiveHome] = useState(lastSync?.homeScore ?? 0);
  const [liveAway, setLiveAway] = useState(lastSync?.awayScore ?? 0);
  const [liveMinute, setLiveMinute] = useState<string>(
    lastSync?.minute != null ? String(lastSync.minute) : ""
  );
  const [liveStatus, setLiveStatus] = useState(lastSync?.status ?? "NS");
  const [liveHomePos, setLiveHomePos] = useState("");
  const [liveAwayPos, setLiveAwayPos] = useState("");

  const isLocked = ["LOCKED", "LIVE", "FINISHED"].includes(polla.status);

  async function handleAddBet(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/pollas/${polla.id}/bets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName: participantName.trim(),
          homeScore,
          awayScore,
          amount: Number(amount) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ kind: "err", msg: data?.error ?? "Error al guardar" });
        return;
      }
      setParticipantName("");
      setHomeScore(0);
      setAwayScore(0);
      setAmount("");
      setFeedback({ kind: "ok", msg: "Apuesta registrada" });
      router.refresh();
    } catch {
      setFeedback({ kind: "err", msg: "Error de red" });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteBet(betId: string) {
    if (!confirm("¿Eliminar esta apuesta?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/bets/${betId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFeedback({ kind: "err", msg: data?.error ?? "Error al eliminar" });
      } else {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleStatus(next: string) {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/pollas/${polla.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFeedback({ kind: "err", msg: data?.error ?? "Error" });
      } else {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSync() {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/sync/${polla.id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ kind: "err", msg: data?.error ?? "Error al sincronizar" });
      } else {
        setFeedback({ kind: "ok", msg: "Sincronizado con API-Football" });
        router.refresh();
      }
    } catch {
      setFeedback({ kind: "err", msg: "Error de red" });
    } finally {
      setBusy(false);
    }
  }

  async function handleManualScore(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/pollas/${polla.id}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeScore: liveHome,
          awayScore: liveAway,
          minute: liveMinute ? Number(liveMinute) : null,
          status: liveStatus,
          homePossession: liveHomePos ? Number(liveHomePos) : null,
          awayPossession: liveAwayPos ? Number(liveAwayPos) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ kind: "err", msg: data?.error ?? "Error al actualizar marcador" });
      } else {
        setFeedback({ kind: "ok", msg: "Marcador actualizado en la vista pública" });
        router.refresh();
      }
    } catch {
      setFeedback({ kind: "err", msg: "Error de red" });
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/p/${polla.slug}`;
    await navigator.clipboard.writeText(url);
    setFeedback({ kind: "ok", msg: "Link copiado al portapapeles" });
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            feedback.kind === "ok"
              ? "border-victory/40 bg-victory/10 text-victory"
              : "border-passion-red/40 bg-passion-red/10 text-passion-red"
          }`}
        >
          {feedback.kind === "ok" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {feedback.msg}
        </div>
      )}

      <Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Pozo total" value={formatCurrency(totalPot)} highlight />
          <Stat label="Apuestas" value={`${bets.length}`} />
          <Stat
            label="Marcador en vivo"
            value={lastSync ? `${lastSync.homeScore} - ${lastSync.awayScore}` : "—"}
          />
          <Stat
            label="Estado"
            value={lastSync?.status ?? "—"}
            sub={lastSync ? `${timeAgo(lastSync.fetchedAt)}` : "Sin datos"}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-sport-blue/20 pt-4">
          <Button variant="secondary" onClick={handleCopyLink} type="button">
            <Copy className="h-4 w-4" />
            Copiar link
          </Button>
          {polla.status === "OPEN" && (
            <Button onClick={() => handleStatus("LOCKED")} disabled={busy} type="button">
              <Lock className="h-4 w-4" />
              Bloquear apuestas
            </Button>
          )}
          {polla.status === "LOCKED" && (
            <Button
              variant="secondary"
              onClick={() => handleStatus("OPEN")}
              disabled={busy}
              type="button"
            >
              <Unlock className="h-4 w-4" />
              Reabrir
            </Button>
          )}
          {(polla.status === "LOCKED" || polla.status === "LIVE") && !isManual && (
            <Button variant="secondary" onClick={handleSync} disabled={busy} type="button">
              <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
              Sincronizar API
            </Button>
          )}
        </div>
        {isManual && (
          <p className="mt-3 text-xs text-score-white/60">
            Modo manual — actualiza el marcador abajo durante el partido.
          </p>
        )}
      </Card>

      {isManual && polla.status !== "FINISHED" && (
        <Card>
          <h2 className="text-display mb-1 flex items-center gap-2 text-xl text-victory">
            <Radio className="h-5 w-5" />
            Marcador en vivo (manual)
          </h2>
          <p className="mb-4 text-sm text-score-white/70">
            Ingresa el marcador, minuto y estado. La vista pública se actualiza al guardar.
          </p>
          <form onSubmit={handleManualScore} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ScoreInput label={polla.homeTeam} value={liveHome} onChange={setLiveHome} />
              <ScoreInput label={polla.awayTeam} value={liveAway} onChange={setLiveAway} />
              <div>
                <label htmlFor="minute" className="label-base">
                  Minuto
                </label>
                <input
                  id="minute"
                  type="number"
                  min={0}
                  max={130}
                  value={liveMinute}
                  onChange={(e) => setLiveMinute(e.target.value)}
                  className="input-base"
                  placeholder="67"
                />
              </div>
              <div>
                <label htmlFor="status" className="label-base">
                  Estado del partido
                </label>
                <select
                  id="status"
                  value={liveStatus}
                  onChange={(e) => setLiveStatus(e.target.value)}
                  className="input-base"
                >
                  <option value="NS">Por jugar</option>
                  <option value="1H">1er tiempo</option>
                  <option value="HT">Descanso</option>
                  <option value="2H">2do tiempo</option>
                  <option value="ET">Prórroga</option>
                  <option value="FT">Finalizado</option>
                </select>
              </div>
              <div>
                <label htmlFor="homePos" className="label-base">
                  Posesión {polla.homeTeam} (%)
                </label>
                <input
                  id="homePos"
                  type="number"
                  min={0}
                  max={100}
                  value={liveHomePos}
                  onChange={(e) => setLiveHomePos(e.target.value)}
                  className="input-base"
                  placeholder="55"
                />
              </div>
              <div>
                <label htmlFor="awayPos" className="label-base">
                  Posesión {polla.awayTeam} (%)
                </label>
                <input
                  id="awayPos"
                  type="number"
                  min={0}
                  max={100}
                  value={liveAwayPos}
                  onChange={(e) => setLiveAwayPos(e.target.value)}
                  className="input-base"
                  placeholder="45"
                />
              </div>
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? "Guardando..." : "Publicar marcador"}
            </Button>
          </form>
        </Card>
      )}

      {!isLocked && (
        <Card>
          <h2 className="text-display mb-4 text-xl text-victory">Registrar apuesta</h2>
          <form onSubmit={handleAddBet} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="label-base">
                  Nombre del participante
                </label>
                <input
                  id="name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  className="input-base"
                  required
                  maxLength={60}
                />
              </div>
              <ScoreInput
                label={polla.homeTeam}
                value={homeScore}
                onChange={setHomeScore}
              />
              <ScoreInput
                label={polla.awayTeam}
                value={awayScore}
                onChange={setAwayScore}
              />
              <div className="sm:col-span-2">
                <label htmlFor="amount" className="label-base">
                  Monto (COP)
                </label>
                <input
                  id="amount"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={100}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-base"
                  required
                  placeholder="50000"
                />
              </div>
            </div>
            <Button type="submit" disabled={busy}>
              <Plus className="h-4 w-4" />
              {busy ? "Guardando..." : "Agregar apuesta"}
            </Button>
          </form>
        </Card>
      )}

      <Card>
        <h2 className="text-display mb-4 text-xl text-victory">
          Apuestas registradas ({bets.length})
        </h2>
        {bets.length === 0 ? (
          <p className="text-sm text-score-white/70">
            Aún no hay apuestas. Agrega la primera arriba.
          </p>
        ) : (
          <ul className="divide-y divide-sport-blue/15">
            {bets.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-score-white">{b.participantName}</p>
                  <p className="text-xs text-score-white/60">{timeAgo(b.createdAt)}</p>
                </div>
                <div className="text-display text-2xl text-score-white">
                  {b.homeScore} <span className="text-score-white/40">-</span> {b.awayScore}
                </div>
                <div className="text-right">
                  <p className="text-display text-lg text-victory">{formatCurrency(b.amount)}</p>
                </div>
                {!isLocked && (
                  <button
                    onClick={() => handleDeleteBet(b.id)}
                    className="rounded p-2 text-score-white/50 transition hover:bg-passion-red/15 hover:text-passion-red"
                    aria-label="Eliminar apuesta"
                    disabled={busy}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-score-white/60">{label}</p>
      <p
        className={`text-display text-2xl ${
          highlight ? "text-victory" : "text-score-white"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-score-white/50">{sub}</p>}
    </div>
  );
}

function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="label-base">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="rounded-lg border border-sport-blue/30 bg-stadium-deep/60 px-3 py-3 text-score-white transition hover:bg-stadium-deep"
        >
          −
        </button>
        <div className="flex-1 rounded-lg border border-sport-blue/30 bg-stadium-deep/40 px-4 py-3 text-center text-display text-2xl text-score-white">
          {value}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(20, value + 1))}
          className="rounded-lg border border-sport-blue/30 bg-stadium-deep/60 px-3 py-3 text-score-white transition hover:bg-stadium-deep"
        >
          +
        </button>
      </div>
    </div>
  );
}
