const mockGetServerSession = jest.fn();
const mockFeeChargeAggregate = jest.fn();

jest.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { count: jest.fn().mockResolvedValue(0) },
    musician: { count: jest.fn().mockResolvedValue(0) },
    client: { count: jest.fn().mockResolvedValue(0) },
    booking: { count: jest.fn().mockResolvedValue(0) },
    payment: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
      count: jest.fn().mockResolvedValue(0),
    },
    verification: { count: jest.fn().mockResolvedValue(0) },
    report: { count: jest.fn().mockResolvedValue(0) },
    feeCharge: {
      count: jest.fn().mockResolvedValue(0),
      aggregate: (...args: unknown[]) => mockFeeChargeAggregate(...args),
    },
  },
}));

import { GET } from "@/app/api/admin/metrics/route";

describe("GET /api/admin/metrics fee aggregates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { id: "admin", role: "ADMIN" } });
    mockFeeChargeAggregate.mockImplementation(({ where }: { where: { status: string } }) =>
      Promise.resolve({ _sum: { amount: where.status === "PAID" ? 42 : 75 } })
    );
  });

  it("agrega receita paga no mês corrente e o total pendente no banco", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.fees).toEqual({ paidThisMonth: 42, pendingAmount: 75 });
    const paidCall = mockFeeChargeAggregate.mock.calls.find(
      ([{ where }]: [{ where: { status: string } }]) => where.status === "PAID"
    );
    const pendingCall = mockFeeChargeAggregate.mock.calls.find(
      ([{ where }]: [{ where: { status: string } }]) => where.status === "PENDING"
    );

    expect(paidCall?.[0]).toMatchObject({
      where: {
        status: "PAID",
        paidAt: { gte: expect.any(Date), lt: expect.any(Date) },
      },
      _sum: { amount: true },
    });
    expect(pendingCall?.[0]).toEqual({
      where: { status: "PENDING" },
      _sum: { amount: true },
    });
  });
});
