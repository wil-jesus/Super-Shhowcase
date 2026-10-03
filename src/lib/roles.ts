import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export type Role = "CLIENT" | "MUSICIAN" | "ADMIN";

export async function requireRole(roles: Role[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!roles.includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  return null;
}