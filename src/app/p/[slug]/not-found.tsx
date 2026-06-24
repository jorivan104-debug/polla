import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <Logo size="md" />
      <h1 className="text-display mt-6 text-4xl text-score-white">
        POLLA NO ENCONTRADA
      </h1>
      <p className="mt-2 text-sm text-score-white/70">
        El link que abriste no corresponde a una polla activa.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Volver al inicio
      </Link>
    </main>
  );
}
