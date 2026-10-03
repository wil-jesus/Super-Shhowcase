import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();
    if (typeof token !== "string" || typeof newPassword !== "string" || !token || !newPassword) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Senha deve ter no mínimo 8 caracteres" }, { status: 400 });
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.used) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }
    if (record.expiresAt < new Date()) {
      return NextResponse.json({ error: "Token expirado. Solicite um novo." }, { status: 410 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({ message: "Senha redefinida com sucesso!" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}