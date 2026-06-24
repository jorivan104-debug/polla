import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

const SIZES = {
  sm: { w: 120, h: 40 },
  md: { w: 180, h: 60 },
  lg: { w: 260, h: 86 },
} as const;

export function Logo({ size = "md", href, className = "" }: LogoProps) {
  const { w, h } = SIZES[size];
  const img = (
    <Image
      src="/logo.png"
      alt="Polla Mundialista"
      width={w}
      height={h}
      priority
      className={`h-auto w-auto object-contain ${className}`}
      style={{ maxHeight: h }}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex transition-transform duration-200 hover:scale-105">
        {img}
      </Link>
    );
  }
  return img;
}
