import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { passwordResetEmail, sendEmail } from "@/lib/email";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    // Não revela se o email existe (evita enumeração)
    if (!user) {
      return NextResponse.json(
        { message: "Se o email existir, enviaremos um link de recuperação." },
        { status: 200 }
      );
    }

    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const { subject, html } = passwordResetEmail(user.name, token);
    await sendEmail({ to: user.email, subject, html });

    return NextResponse.json(
      { message: "Se o email existir, enviaremos um link de recuperação." },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}