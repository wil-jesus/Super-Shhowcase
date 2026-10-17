import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

interface NotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  bookingId?: string;
  email?: { subject: string; html: string };
}

// Cria notificação in-app e, se `email` for informado, envia o e-mail sem bloquear a requisição em caso de falha
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

  if (input.email) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { email: true },
      });
      if (user?.email) await sendEmail({ to: user.email, ...input.email });
    } catch (error) {
      console.error("[notifications] falha ao enviar e-mail", error);
    }
  }

  // TODO: push (FASE 13)
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