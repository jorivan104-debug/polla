import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Trophy, Lock, Radio } from "lucide-react";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <Logo size="lg" />
      <h1 className="text-display mt-8 text-5xl text-score-white sm:text-6xl">
        POLLA <span className="text-victory">MUNDIALISTA</span>
      </h1>
      <p className="mt-4 max-w-xl text-base text-score-white/80 sm:text-lg">
        Apuesta el marcador exacto de los partidos de la{" "}
        <span className="font-semibold text-victory">Selección Colombia</span>.
        Sigue el juego en vivo y celebra a los ganadores.
      </p>

      <div className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        <Feature icon={<Trophy className="h-6 w-6" />} title="Marcador exacto" desc="El que acierta gana el pozo. Si hay empate de aciertos, se divide." />
        <Feature icon={<Radio className="h-6 w-6" />} title="En vivo" desc="Marcador, posesión y probabilidad de mantener el resultado." />
        <Feature icon={<Lock className="h-6 w-6" />} title="Polla privada" desc="Solo el admin registra apuestas. Comparte el link público." />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link href="/admin" className="btn-primary">
          Entrar al panel admin
        </Link>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="card text-left">
      <div className="mb-2 inline-flex rounded-lg bg-victory/15 p-2 text-victory">{icon}</div>
      <h3 className="text-display text-2xl text-score-white">{title}</h3>
      <p className="text-sm text-score-white/70">{desc}</p>
    </div>
  );
}
