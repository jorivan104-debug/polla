import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { NewPollaForm } from "@/components/admin/NewPollaForm";

export default async function NewPollaPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-display text-3xl text-score-white sm:text-4xl">
          NUEVA POLLA
        </h1>
        <p className="text-sm text-score-white/70">
          Selecciona el próximo partido de Colombia y crea la polla.
        </p>
      </div>
      <NewPollaForm />
    </div>
  );
}
