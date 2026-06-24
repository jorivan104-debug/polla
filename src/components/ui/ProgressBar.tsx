interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: "sport" | "victory" | "blue";
}

const VARIANT_CLASS: Record<NonNullable<ProgressBarProps["variant"]>, string> = {
  sport: "bg-gradient-sport",
  victory: "bg-victory",
  blue: "bg-sport-blue",
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  variant = "sport",
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          {label && <span className="text-score-white/80">{label}</span>}
          {showValue && (
            <span className="text-display text-lg text-victory">
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
      <div className="h-3 w-full overflow-hidden rounded-full bg-stadium-deep/80">
        <div
          className={`h-full ${VARIANT_CLASS[variant]} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
