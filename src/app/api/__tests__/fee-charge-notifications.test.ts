const mockGetServerSession = jest.fn();
const mockBookingFindUnique = jest.fn();
const mockTransactionBookingUpdateMany = jest.fn();
const mockTransactionBookingFindUnique = jest.fn();
const mockFeeChargeCreate = jest.fn();
const mockAdminFindMany = jest.fn();
const mockNotificationCreateMany = jest.fn();
const mockNotificationCreate = jest.fn();

const transaction = {
  booking: {
    updateMany: (...args: unknown[]) => mockTransactionBookingUpdateMany(...args),
    findUnique: (...args: unknown[]) => mockTransactionBookingFindUnique(...args),
  },
  feeCharge: { create: (...args: unknown[]) => mockFeeChargeCreate(...args) },
  user: { findMany: (...args: unknown[]) => mockAdminFindMany(...args) },
  notification: {
    createMany: (...args: unknown[]) => mockNotificationCreateMany(...args),
  },
};

jest.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: (...args: unknown[]) => mockBookingFindUnique(...args) },
    notification: { create: (...args: unknown[]) => mockNotificationCreate(...args) },
    $transaction: (callback: (tx: typeof transaction) => unknown) => callback(transaction),
  },
}));

import { PATCH } from "@/app/api/bookings/[id]/route";

describe("PAID fee notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { id: "musician-user", role: "MUSICIAN" } });
    mockBookingFindUnique.mockResolvedValue({
      id: "booking-1",
      status: "PAYMENT_CLAIMED",
      value: 1000,
      musicianId: "musician-1",
      clientConfirmedAt: null,
      musicianConfirmedAt: null,
      client: { userId: "client-user" },
      musician: { userId: "musician-user", stageName: "Banda Teste" },
      event: { title: "Festa" },
    });
    mockTransactionBookingUpdateMany.mockResolvedValue({ count: 1 });
    mockTransactionBookingFindUnique.mockResolvedValue({ id: "booking-1", status: "PAID" });
    mockFeeChargeCreate.mockResolvedValue({});
    mockAdminFindMany.mockResolvedValue([{ id: "admin-1" }, { id: "admin-2" }]);
    mockNotificationCreateMany.mockResolvedValue({ count: 2 });
    mockNotificationCreate.mockResolvedValue({});
  });

  it("cria a taxa e notifica todos os admins na mesma transação", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/bookings/booking-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      }),
      { params: { id: "booking-1" } }
    );

    expect(response.status).toBe(200);
    expect(mockFeeChargeCreate).toHaveBeenCalledWith({
      data: { musicianId: "musician-1", bookingId: "booking-1", amount: 60 },
    });
    expect(mockAdminFindMany).toHaveBeenCalledWith({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    expect(mockNotificationCreateMany).toHaveBeenCalledWith({
      data: [
        {
          userId: "admin-1",
          type: "FEE_CHARGE_CREATED",
          title: "Nova taxa de R$ 60,00 gerada por Banda Teste — aguardando cobrança",
          body: 'Taxa gerada para a contratação "Festa".',
          bookingId: "booking-1",
        },
        {
          userId: "admin-2",
          type: "FEE_CHARGE_CREATED",
          title: "Nova taxa de R$ 60,00 gerada por Banda Teste — aguardando cobrança",
          body: 'Taxa gerada para a contratação "Festa".',
          bookingId: "booking-1",
        },
      ],
    });
  });
});
