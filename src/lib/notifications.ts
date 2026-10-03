import { prisma } from "@/lib/prisma";

interface NotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  bookingId?: string;
}

// Cria notificação in-app + registra intenção de email
export async function notifyUser(input: NotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      bookingId: input.bookingId,
    },
  });

  // TODO: envio de email real (ver 1.4) e push (FASE 13)
  return notification;
}

// Notifica todos os participantes de um booking
export async function notifyBookingParticipants(
  bookingId: string,
  type: string,
  title: string,
  body: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      client: { include: { user: true } },
      musician: { include: { user: true } },
    },
  });
  if (!booking) return;

  await Promise.all([
    notifyUser({ userId: booking.client.userId, type, title, body, bookingId }),
    notifyUser({ userId: booking.musician.userId, type, title, body, bookingId }),
  ]);
}