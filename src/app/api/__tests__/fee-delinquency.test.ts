const mockGetServerSession = jest.fn();
const mockClientFindUnique = jest.fn();
const mockMusicianFindUnique = jest.fn();
const mockBookingFindUnique = jest.fn();
const mockCheckMusicianFeeDelinquency = jest.fn();

jest.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: (...args: unknown[]) => mockBookingFindUnique(...args) },
    client: { findUnique: (...args: unknown[]) => mockClientFindUnique(...args) },
    musician: { findUnique: (...args: unknown[]) => mockMusicianFindUnique(...args) },
  },
}));
jest.mock("@/lib/fee-delinquency", () => ({
  FEE_DELINQUENCY_MESSAGE:
    "Regularize as taxas pendentes da plataforma antes de novas contratações",
  checkMusicianFeeDelinquency: (...args: unknown[]) =>
    mockCheckMusicianFeeDelinquency(...args),
}));

import { POST } from "@/app/api/bookings/route";
import { PATCH } from "@/app/api/bookings/[id]/route";

describe("POST /api/bookings fee delinquency guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { id: "client-user", role: "CLIENT" } });
    mockClientFindUnique.mockResolvedValue({ id: "client-1" });
    mockMusicianFindUnique.mockResolvedValue({
      id: "musician-1",
      userId: "musician-user",
      stageName: "Músico",
    });
    mockBookingFindUnique.mockResolvedValue({
      id: "booking-1",
      status: "REQUESTED",
      musicianId: "musician-1",
      client: { userId: "client-user" },
      musician: { userId: "musician-user", stageName: "Músico" },
      event: { title: "Festa", date: new Date("2027-01-01"), durationHours: 3 },
    });
    mockCheckMusicianFeeDelinquency.mockResolvedValue(true);
  });

  it("bloqueia a contratação e consulta o bloqueio/notificação do músico inadimplente", async () => {
    const response = await POST(
      new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musicianId: "musician-1",
          eventTitle: "Festa",
          eventDate: "2027-01-01T20:00:00.000Z",
          locationLat: -23.5,
          locationLng: -46.6,
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe(
      "Regularize as taxas pendentes da plataforma antes de novas contratações"
    );
    expect(mockCheckMusicianFeeDelinquency).toHaveBeenCalledWith("musician-1", "Músico");
  });

  it("bloqueia o aceite pelo músico enquanto há taxas inadimplentes", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "musician-user", role: "MUSICIAN" },
    });
    const response = await PATCH(
      new Request("http://localhost/api/bookings/booking-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      }),
      { params: { id: "booking-1" } }
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe(
      "Regularize as taxas pendentes da plataforma antes de novas contratações"
    );
    expect(mockCheckMusicianFeeDelinquency).toHaveBeenCalledWith("musician-1", "Músico");
  });
});
