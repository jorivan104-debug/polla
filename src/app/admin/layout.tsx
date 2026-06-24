import Link from "next/link";
import { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { isAdminAuthenticated } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const authed = await isAdminAuthenticated();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-sport-blue/20 bg-stadium-deep/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href={authed ? "/admin" : "/admin/login"} className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="hidden text-display text-xl text-victory sm:inline">
              Panel Admin
            </span>
          </Link>
          {authed && <LogoutButton />}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
