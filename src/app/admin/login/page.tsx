import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function LoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }
  return (
    <div className="mx-auto mt-12 max-w-md">
      <h1 className="text-display mb-1 text-center text-4xl text-score-white">
        ENTRAR
      </h1>
      <p className="mb-6 text-center text-sm text-score-white/70">
        Acceso restringido para el administrador de la polla.
      </p>
      <div className="card">
        <LoginForm />
      </div>
    </div>
  );
}
