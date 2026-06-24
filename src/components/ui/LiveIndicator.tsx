interface LiveIndicatorProps {
  minute?: number | null;
  status?: string;
}

export function LiveIndicator({ minute, status }: LiveIndicatorProps) {
  const isLive = status === "1H" || status === "2H" || status === "ET" || status === "P";
  const isHalf = status === "HT";
  const label = isLive
    ? `EN VIVO${minute != null ? ` — ${minute}'` : ""}`
    : isHalf
      ? "DESCANSO"
      : status ?? "EN VIVO";

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-passion-red px-3 py-1 text-xs font-semibold uppercase tracking-wider text-score-white">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-score-white opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-score-white" />
      </span>
      {label}
    </span>
  );
}
