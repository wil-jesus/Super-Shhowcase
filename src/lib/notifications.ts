import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

type NotificationClient = Pick<Prisma.TransactionClient, "user" | "notification">;

interface NotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  bookingId?: string;
  email?: { subject: string; html: string };
}

interface AdminNotificationInput {
  type: string;
  title: string;
  body: string;
  bookingId?: string;
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

export async function notifyAdmins(
  client: NotificationClient,
  input: AdminNotificationInput
) {
  const admins = await client.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (admins.length === 0) return 0;

  const result = await client.notification.createMany({
    data: admins.map(({ id }) => ({
      userId: id,
      type: input.type,
      title: input.title,
      body: input.body,
      bookingId: input.bookingId,
    })),
  });

  return result.count;
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