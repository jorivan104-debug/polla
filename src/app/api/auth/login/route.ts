import { NextResponse } from "next/server";
import { checkAdminPassword, setAdminSession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = typeof body?.password === "string" ? body.password : "";

  if (!checkAdminPassword(password)) {
    return NextResponse.json(
      { error: "Contraseña incorrecta" },
      { status: 401 }
    );
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
