import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";

// Listar mensagens (só participantes)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { client: true, musician: true },
  });
  if (!booking) return NextResponse.json({ error: "Contratação não encontrada" }, { status: 404 });

  const isParticipant =
    booking.client.userId === session.user.id ||
    booking.musician.userId === session.user.id ||
    session.user.role === "ADMIN";
  if (!isParticipant) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const messages = await prisma.message.findMany({
    where: { bookingId: params.id },
    include: { sender: { select: { name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ messages });
}

// Enviar mensagem
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { content } = await req.json();
  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
  }
  if (content.length > 2000) {
    return NextResponse.json({ error: "Mensagem muito longa" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { client: true, musician: true },
  });
  if (!booking) return NextResponse.json({ error: "Contratação não encontrada" }, { status: 404 });

  const isParticipant =
    booking.client.userId === session.user.id ||
    booking.musician.userId === session.user.id;
  if (!isParticipant) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const message = await prisma.message.create({
    data: {
      bookingId: params.id,
      senderId: session.user.id,
      content,
    },
  });

  const otherUserId =
    booking.client.userId === session.user.id
      ? booking.musician.userId
      : booking.client.userId;

  await notifyUser({
    userId: otherUserId,
    type: "MESSAGE",
    title: "Nova mensagem",
    body: content.slice(0, 100),
    bookingId: params.id,
  });

  return NextResponse.json({ message }, { status: 201 });
}