"use client";

import { useEffect, useRef, useState } from "react";

export interface LiveSnapshot {
  homeScore: number;
  awayScore: number;
  minute: number | null;
  status: string;
  homePossession: number | null;
  awayPossession: number | null;
  likelyWinner: string | null;
  holdProbability: number | null;
  fetchedAt: string;
}

export interface LivePolla {
  id: string;
  slug: string;
  title: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string | null;
  awayLogo: string | null;
  matchDate: string;
  status: string;
}

export interface LiveBet {
  id: string;
  participantName: string;
  homeScore: number;
  awayScore: number;
  amount: number;
  createdAt: string;
}

export interface LivePayload {
  polla: LivePolla;
  snapshot: LiveSnapshot | null;
  bets: LiveBet[];
}

interface State {
  data: LivePayload | null;
  connected: boolean;
  error: string | null;
}

export function usePollaLive(slug: string, initial: LivePayload | null = null): State {
  const [state, setState] = useState<State>({
    data: initial,
    connected: false,
    error: null,
  });
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!slug) return;

    const es = new EventSource(`/api/stream/${slug}`);
    sourceRef.current = es;

    es.addEventListener("snapshot", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as LivePayload;
        setState({ data: payload, connected: true, error: null });
      } catch {
        setState((s) => ({ ...s, error: "Error parseando datos" }));
      }
    });

    es.addEventListener("error", () => {
      setState((s) => ({ ...s, connected: false }));
    });

    es.addEventListener("open", () => {
      setState((s) => ({ ...s, connected: true, error: null }));
    });

    return () => {
      es.close();
      sourceRef.current = null;
    };
  }, [slug]);

  return state;
}
