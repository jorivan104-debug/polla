"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Trophy,
  Users,
  Share2,
  Clock,
  TrendingUp,
  Radio,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { usePollaLive, type LivePayload } from "@/hooks/usePollaLive";
import { computeWinners, formatCurrency } from "@/lib/winners";
import { timeAgo, formatMatchDate } from "@/lib/format";

interface Props {
  slug: string;
  initial: LivePayload;
}

export function PollaComposer({ slug, initial }: Props) {
  const { data, connected } = usePollaLive(slug, initial);
  const payload = data ?? initial;
  const { polla, snapshot, bets } = payload;

  const totalPot = useMemo(
    () => bets.reduce((s, b) => s + b.amount, 0),
    [bets]
  );

  const homeScore = snapshot?.homeScore ?? 0;
  const awayScore = snapshot?.awayScore ?? 0;
  const status = snapshot?.status ?? "NS";
  const minute = snapshot?.minute ?? null;
  const isLive = ["1H", "2H", "ET", "BT", "P", "HT"].includes(status);
  const isFinished = ["FT", "AET", "PEN"].includes(status) || polla.status === "FINISHED";

  const winnerInfo = useMemo(() => {
    if (!isFinished) return null;
    return computeWinners(
      bets.map((b) => ({
        id: b.id,
        pollaId: polla.id,
        participantName: b.participantName,
        homeScore: b.homeScore,
        awayScore: b.awayScore,
        amount: b.amount,
        createdAt: new Date(b.createdAt),
      })),
      homeScore,
      awayScore
    );
  }, [isFinished, bets, polla.id, homeScore, awayScore]);

  const [scoreFlash, setScoreFlash] = useState(false);
  const [prevScore, setPrevScore] = useState(`${homeScore}-${awayScore}`);
  useEffect(() => {
    const current = `${homeScore}-${awayScore}`;
    if (current !== prevScore) {
      setScoreFlash(true);
      setPrevScore(current);
      const t = setTimeout(() => setScoreFlash(false), 600);
      return () => clearTimeout(t);
    }
  }, [homeScore, awayScore, prevScore]);

  const [showOverlay, setShowOverlay] = useState(false);
  useEffect(() => {
    if (!isFinished) return;
    const seenKey = `polla-finished-seen-${polla.id}`;
    if (typeof window !== "undefined" && !window.localStorage.getItem(seenKey)) {
      setShowOverlay(true);
      window.localStorage.setItem(seenKey, "1");
    }
  }, [isFinished, polla.id]);

  useEffect(() => {
    if (!showOverlay || !winnerInfo?.hasWinners) return;
    const fire = () => {
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.6 },
        colors: ["#F8C400", "#D92727", "#1148C7", "#F5F5F5"],
      });
    };
    fire();
    const i = setInterval(fire, 1200);
    const stop = setTimeout(() => clearInterval(i), 5000);
    return () => {
      clearInterval(i);
      clearTimeout(stop);
    };
  }, [showOverlay, winnerInfo]);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: polla.title, url });
        return;
      } catch {
        // fallback
      }
    }
    if (typeof window !== "undefined") {
      await navigator.clipboard.writeText(url);
      alert("Link copiado al portapapeles");
    }
  }

  const holdProb = snapshot?.holdProbability ?? null;
  const likelyWinner = snapshot?.likelyWinner ?? null;
  const homePos = snapshot?.homePossession;
  const awayPos = snapshot?.awayPossession;

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-10 pt-4 sm:px-6">
      <header className="flex items-center justify-between gap-3 pb-6">
        <Logo size="sm" href="/" />
        <div className="flex items-center gap-2">
          {isLive && <LiveIndicator minute={minute} status={status} />}
          {!isLive && !isFinished && (
            <span className="badge-pending">
              <Clock className="h-3 w-3" /> Próximo
            </span>
          )}
          {isFinished && (
            <span className="badge-victory">
              <Trophy className="h-3 w-3" /> Finalizado
            </span>
          )}
          <button
            onClick={handleShare}
            className="rounded-full border border-sport-blue/30 bg-stadium-dark/60 p-2 text-score-white/80 transition hover:border-victory hover:text-victory"
            aria-label="Compartir"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <h1 className="text-display mb-1 text-2xl text-score-white sm:text-3xl">
        {polla.title}
      </h1>
      <p className="mb-5 text-xs text-score-white/60 sm:text-sm">
        {formatMatchDate(polla.matchDate)}
      </p>

      <section className="card-premium mb-6 overflow-hidden">
        <div className="grid grid-cols-3 items-center gap-2 sm:gap-4">
          <TeamBlock name={polla.homeTeam} logo={polla.homeLogo} side="home" />
          <motion.div
            key={prevScore}
            animate={scoreFlash ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div
              className={`text-display text-5xl leading-none text-score-white sm:text-7xl ${
                scoreFlash ? "animate-score-flash" : ""
              }`}
            >
              {homeScore}
              <span className="mx-1 text-score-white/50 sm:mx-3">-</span>
              {awayScore}
            </div>
            {minute != null && isLive && (
              <p className="mt-2 text-xs uppercase tracking-wider text-victory sm:text-sm">
                {minute}&apos;
              </p>
            )}
            {status === "HT" && (
              <p className="mt-2 text-xs uppercase tracking-wider text-victory">
                Descanso
              </p>
            )}
            {status === "NS" && (
              <p className="mt-2 text-xs uppercase tracking-wider text-score-white/60">
                Por jugarse
              </p>
            )}
          </motion.div>
          <TeamBlock name={polla.awayTeam} logo={polla.awayLogo} side="away" />
        </div>

        {(likelyWinner || holdProb != null) && (
          <div className="mt-5 space-y-3 border-t border-score-white/10 pt-4">
            {likelyWinner && (
              <p className="flex items-center gap-2 text-sm text-score-white/90">
                <Sparkles className="h-4 w-4 text-victory" />
                Más probable ganador:{" "}
                <span className="font-semibold text-victory">{likelyWinner}</span>
              </p>
            )}
            {holdProb != null && isLive && (
              <div>
                <ProgressBar
                  value={holdProb}
                  label={
                    homeScore === awayScore
                      ? "Probabilidad de empate al final"
                      : `Probabilidad de mantener ${homeScore}-${awayScore}`
                  }
                  variant="sport"
                />
              </div>
            )}
            {homePos != null && awayPos != null && isLive && (
              <PossessionBar
                home={homePos}
                away={awayPos}
                homeName={polla.homeTeam}
                awayName={polla.awayTeam}
              />
            )}
          </div>
        )}
      </section>

      <section className="mb-6">
        <div className="card flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-score-white/70">
              <Trophy className="h-3.5 w-3.5 text-victory" /> Pozo total
            </p>
            <p className="text-display text-4xl text-victory sm:text-5xl">
              {formatCurrency(totalPot)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-score-white/70">Apuestas</p>
            <p className="text-display text-3xl text-score-white">{bets.length}</p>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-victory" />
          <h2 className="text-display text-2xl text-score-white">Apuestas</h2>
          <span className="text-xs text-score-white/60">
            {connected ? (
              <span className="inline-flex items-center gap-1 text-victory">
                <Radio className="h-3 w-3" /> en vivo
              </span>
            ) : (
              <span className="text-score-white/50">conectando...</span>
            )}
          </span>
        </div>

        {bets.length === 0 ? (
          <div className="card text-center text-sm text-score-white/70">
            Aún no hay apuestas registradas.
          </div>
        ) : (
          <ul className="space-y-2">
            {bets.map((b) => {
              const matchesLive = isLive && b.homeScore === homeScore && b.awayScore === awayScore;
              const isWinner =
                isFinished && b.homeScore === homeScore && b.awayScore === awayScore;
              return (
                <li
                  key={b.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                    isWinner
                      ? "border-victory bg-victory/10 shadow-lg shadow-victory/20"
                      : matchesLive
                        ? "border-victory/60 bg-victory/5"
                        : "border-sport-blue/15 bg-stadium-dark/50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-score-white">
                      {b.participantName}
                      {isWinner && (
                        <span className="ml-2 rounded bg-victory px-2 py-0.5 text-xs font-bold uppercase text-stadium-dark">
                          Ganador
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-score-white/55">{timeAgo(b.createdAt)}</p>
                  </div>
                  <div
                    className={`text-display text-2xl ${
                      matchesLive || isWinner ? "text-victory" : "text-score-white"
                    }`}
                  >
                    {b.homeScore}
                    <span className="mx-1 text-score-white/40">-</span>
                    {b.awayScore}
                  </div>
                  <div className="text-display text-lg text-victory">
                    {formatCurrency(b.amount)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="mt-auto border-t border-sport-blue/15 pt-5 text-center text-xs text-score-white/50">
        Polla Mundialista • Selección Colombia
      </footer>

      <AnimatePresence>
        {showOverlay && winnerInfo && (
          <FinaleOverlay
            polla={polla}
            homeScore={homeScore}
            awayScore={awayScore}
            winnerInfo={winnerInfo}
            onClose={() => setShowOverlay(false)}
          />
        )}
      </AnimatePresence>

      {isFinished && !showOverlay && winnerInfo && (
        <button
          onClick={() => setShowOverlay(true)}
          className="fixed bottom-4 right-4 rounded-full bg-victory px-4 py-2 text-sm font-semibold text-stadium-dark shadow-xl transition hover:scale-105"
        >
          <Trophy className="mr-1 inline h-4 w-4" /> Ver ganadores
        </button>
      )}
    </div>
  );
}

function TeamBlock({
  name,
  logo,
  side,
}: {
  name: string;
  logo: string | null;
  side: "home" | "away";
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 ${
        side === "home" ? "sm:items-end" : "sm:items-start"
      }`}
    >
      {logo && (
        <div className="relative h-12 w-12 rounded-full bg-score-white/95 p-1.5 sm:h-16 sm:w-16">
          <Image
            src={logo}
            alt={name}
            width={64}
            height={64}
            className="h-full w-full object-contain"
            unoptimized
          />
        </div>
      )}
      <p className="text-display text-base leading-tight text-score-white sm:text-xl">
        {name}
      </p>
    </div>
  );
}

function PossessionBar({
  home,
  away,
  homeName,
  awayName,
}: {
  home: number;
  away: number;
  homeName: string;
  awayName: string;
}) {
  const total = home + away;
  const homePct = total > 0 ? (home / total) * 100 : 50;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-score-white/80">
          <TrendingUp className="mr-1 inline h-3 w-3" /> Posesión
        </span>
        <span className="text-score-white/60">
          {homeName} {Math.round(homePct)}% — {Math.round(100 - homePct)}% {awayName}
        </span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-stadium-deep">
        <div className="bg-victory" style={{ width: `${homePct}%` }} />
        <div className="bg-passion-red" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  );
}

function FinaleOverlay({
  polla,
  homeScore,
  awayScore,
  winnerInfo,
  onClose,
}: {
  polla: { homeTeam: string; awayTeam: string };
  homeScore: number;
  awayScore: number;
  winnerInfo: ReturnType<typeof computeWinners>;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 bg-dark-gray/90 backdrop-blur-md" />
      <div className="absolute inset-0 overflow-hidden">
        <SpeedLines />
      </div>

      <motion.div
        className="relative w-full max-w-md text-center"
        initial={{ scale: 0.5, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
      >
        <motion.div
          className="card-premium px-6 py-8"
          animate={{ boxShadow: ["0 0 0 rgba(248,196,0,0)", "0 0 40px rgba(248,196,0,0.5)", "0 0 0 rgba(248,196,0,0)"] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <p className="mb-1 text-sm uppercase tracking-[0.3em] text-victory">
            Marcador final
          </p>
          <p className="text-display text-7xl text-score-white">
            {homeScore} <span className="text-score-white/40">-</span> {awayScore}
          </p>
          <p className="mt-1 text-sm text-score-white/80">
            {polla.homeTeam} vs {polla.awayTeam}
          </p>
        </motion.div>

        <motion.div
          className="mt-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          {winnerInfo.hasWinners ? (
            <>
              <h2 className="text-display mb-2 text-5xl text-victory">¡FELICIDADES!</h2>
              <p className="mb-4 text-score-white/80">
                {winnerInfo.winners.length === 1
                  ? "Hay un ganador"
                  : `Premio dividido entre ${winnerInfo.winners.length} ganadores`}
              </p>
              <div className="space-y-2">
                {winnerInfo.winners.map((w) => (
                  <motion.div
                    key={w.bet.id}
                    className="rounded-xl border-2 border-victory bg-victory/15 p-3"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    <p className="text-display text-2xl text-score-white">
                      {w.bet.participantName}
                    </p>
                    <p className="text-display text-3xl text-victory">
                      {formatCurrency(w.prize)}
                    </p>
                  </motion.div>
                ))}
              </div>
              <p className="mt-4 text-xs text-score-white/60">
                Pozo total: {formatCurrency(winnerInfo.totalPot)}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-display mb-2 text-5xl text-passion-red">SIN GANADORES</h2>
              <p className="mb-4 text-score-white/80">
                Nadie acertó el marcador exacto.
              </p>
              <div className="rounded-xl border border-passion-red/40 bg-passion-red/10 p-4">
                <p className="text-xs uppercase tracking-wider text-score-white/70">
                  Pozo acumulado
                </p>
                <p className="text-display text-4xl text-victory">
                  {formatCurrency(winnerInfo.totalPot)}
                </p>
              </div>
            </>
          )}
        </motion.div>

        <motion.div
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <Button onClick={onClose}>Ver resumen</Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function SpeedLines() {
  const lines = Array.from({ length: 8 });
  return (
    <>
      {lines.map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1/2 rounded-full bg-victory/20"
          style={{
            top: `${10 + i * 11}%`,
            left: "-50%",
          }}
          animate={{ x: ["0%", "300%"] }}
          transition={{
            duration: 1.5 + (i % 3) * 0.4,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.15,
          }}
        />
      ))}
    </>
  );
}
