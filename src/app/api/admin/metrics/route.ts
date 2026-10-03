import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [totalUsers, totalMusicians, totalClients, totalBookings, pendingBookings, completedBookings, disputedBookings, totalRevenue, releasedPayments, newUsersLast30Days, pendingVerifications, openReports] = await Promise.all([
    prisma.user.count(), prisma.musician.count(), prisma.client.count(), prisma.booking.count(),
    prisma.booking.count({ where: { status: "REQUESTED" } }), prisma.booking.count({ where: { status: "COMPLETED" } }), prisma.booking.count({ where: { status: "DISPUTED" } }),
    prisma.payment.aggregate({ _sum: { amount: true } }), prisma.payment.count({ where: { status: "RELEASED" } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }), prisma.verification.count({ where: { status: "PENDING" } }), prisma.report.count({ where: { status: "OPEN" } }),
  ]);
  return NextResponse.json({ users: { total: totalUsers, musicians: totalMusicians, clients: totalClients, newLast30Days: newUsersLast30Days }, bookings: { total: totalBookings, pending: pendingBookings, completed: completedBookings, disputed: disputedBookings }, payments: { totalRevenue: totalRevenue._sum.amount ?? 0, releasedCount: releasedPayments }, moderation: { pendingVerifications, openReports }, generatedAt: now.toISOString() });
}
