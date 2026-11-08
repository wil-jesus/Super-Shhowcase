import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notifications";

export const FEE_DELINQUENCY_MESSAGE =
  "Regularize as taxas pendentes da plataforma antes de novas contratações";

const DELINQUENCY_NOTIFICATION_TYPE = "FEE_DELINQUENCY_BLOCKED";

export async function checkMusicianFeeDelinquency(musicianId: string, stageName: string) {
  const overdueDate = new Date();
  overdueDate.setDate(overdueDate.getDate() - 30);

  const [pendingFees, oldestPendingFee] = await Promise.all([
    prisma.feeCharge.aggregate({
      where: { musicianId, status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.feeCharge.findFirst({
      where: { musicianId, status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: { id: true, createdAt: true },
    }),
  ]);

  const pendingTotal = Number(pendingFees._sum.amount ?? 0);
  const hasOverdueFee = oldestPendingFee !== null && oldestPendingFee.createdAt < overdueDate;
  if (pendingTotal <= 100 && !hasOverdueFee) return false;

  const body = `O músico ${stageName} (ID: ${musicianId}) foi impedido de receber novas contratações por taxas pendentes.`;
  const existingNotification = await prisma.notification.findFirst({
    where: {
      type: DELINQUENCY_NOTIFICATION_TYPE,
      body,
      ...(oldestPendingFee ? { createdAt: { gte: oldestPendingFee.createdAt } } : {}),
    },
    select: { id: true },
  });

  if (!existingNotification) {
    await notifyAdmins(prisma, {
      type: DELINQUENCY_NOTIFICATION_TYPE,
      title: "Novas contratações bloqueadas por taxas pendentes",
      body,
    });
  }

  return true;
}
