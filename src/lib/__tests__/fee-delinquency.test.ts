const mockFeeChargeAggregate = jest.fn();
const mockFeeChargeFindFirst = jest.fn();
const mockNotificationFindFirst = jest.fn();
const mockAdminFindMany = jest.fn();
const mockNotificationCreateMany = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    feeCharge: {
      aggregate: (...args: unknown[]) => mockFeeChargeAggregate(...args),
      findFirst: (...args: unknown[]) => mockFeeChargeFindFirst(...args),
    },
    notification: {
      findFirst: (...args: unknown[]) => mockNotificationFindFirst(...args),
      createMany: (...args: unknown[]) => mockNotificationCreateMany(...args),
    },
    user: { findMany: (...args: unknown[]) => mockAdminFindMany(...args) },
  },
}));

import { checkMusicianFeeDelinquency } from "@/lib/fee-delinquency";

describe("checkMusicianFeeDelinquency", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFeeChargeAggregate.mockResolvedValue({ _sum: { amount: 125 } });
    mockFeeChargeFindFirst.mockResolvedValue({
      id: "pending-fee",
      createdAt: new Date(),
    });
    mockNotificationFindFirst.mockResolvedValue(null);
    mockAdminFindMany.mockResolvedValue([{ id: "admin-1" }, { id: "admin-2" }]);
    mockNotificationCreateMany.mockResolvedValue({ count: 2 });
  });

  it("bloqueia acima de R$ 100 e notifica cada admin apenas no primeiro bloqueio", async () => {
    expect(await checkMusicianFeeDelinquency("musician-1", "Músico")).toBe(true);

    expect(mockFeeChargeAggregate).toHaveBeenCalledWith({
      where: { musicianId: "musician-1", status: "PENDING" },
      _sum: { amount: true },
    });
    expect(mockFeeChargeFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          musicianId: "musician-1",
          status: "PENDING",
        }),
        orderBy: { createdAt: "asc" },
        select: { id: true, createdAt: true },
      })
    );
    expect(mockNotificationFindFirst).toHaveBeenCalledWith({
      where: {
        type: "FEE_DELINQUENCY_BLOCKED",
        body: "O músico Músico (ID: musician-1) foi impedido de receber novas contratações por taxas pendentes.",
        createdAt: { gte: expect.any(Date) },
      },
      select: { id: true },
    });
    expect(mockNotificationCreateMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: "admin-1",
          type: "FEE_DELINQUENCY_BLOCKED",
          title: "Novas contratações bloqueadas por taxas pendentes",
        }),
        expect.objectContaining({
          userId: "admin-2",
          type: "FEE_DELINQUENCY_BLOCKED",
          title: "Novas contratações bloqueadas por taxas pendentes",
        }),
      ],
    });

    mockNotificationFindFirst.mockResolvedValue({ id: "already-notified" });
    mockNotificationCreateMany.mockClear();
    expect(await checkMusicianFeeDelinquency("musician-1", "Músico")).toBe(true);
    expect(mockNotificationCreateMany).not.toHaveBeenCalled();
  });

  it("bloqueia também uma taxa pendente com mais de 30 dias mesmo abaixo do limite", async () => {
    mockFeeChargeAggregate.mockResolvedValue({ _sum: { amount: 20 } });
    mockFeeChargeFindFirst.mockResolvedValue({
      id: "old-fee",
      createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
    });

    expect(await checkMusicianFeeDelinquency("musician-1", "Músico")).toBe(true);
    expect(mockNotificationCreateMany).toHaveBeenCalled();
  });
});
