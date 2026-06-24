export const COLORS = {
  victory: "#F8C400",
  stadiumDark: "#071B3A",
  stadiumDeep: "#02101F",
  sportBlue: "#1148C7",
  passionRed: "#D92727",
  scoreWhite: "#F5F5F5",
  darkGray: "#151515",
} as const;

export const POLLA_STATUS = {
  DRAFT: "DRAFT",
  OPEN: "OPEN",
  LOCKED: "LOCKED",
  LIVE: "LIVE",
  FINISHED: "FINISHED",
  CANCELLED: "CANCELLED",
} as const;

export type PollaStatus = (typeof POLLA_STATUS)[keyof typeof POLLA_STATUS];

export const STATUS_BADGE: Record<PollaStatus, { label: string; kind: "neutral" | "pending" | "live" | "victory" }> = {
  DRAFT: { label: "Borrador", kind: "neutral" },
  OPEN: { label: "Abierta", kind: "pending" },
  LOCKED: { label: "Bloqueada", kind: "pending" },
  LIVE: { label: "En vivo", kind: "live" },
  FINISHED: { label: "Finalizada", kind: "victory" },
  CANCELLED: { label: "Cancelada", kind: "neutral" },
};
