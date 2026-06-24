import { HTMLAttributes } from "react";

type BadgeKind = "live" | "victory" | "pending" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  kind?: BadgeKind;
  pulse?: boolean;
}

const KIND_CLASS: Record<BadgeKind, string> = {
  live: "badge-live",
  victory: "badge-victory",
  pending: "badge-pending",
  neutral: "badge-neutral",
};

export function Badge({
  kind = "neutral",
  pulse = false,
  className = "",
  children,
  ...rest
}: BadgeProps) {
  const classes = [KIND_CLASS[kind], className].filter(Boolean).join(" ");
  return (
    <span className={classes} {...rest}>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
