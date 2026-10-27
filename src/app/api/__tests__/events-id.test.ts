const mockGetServerSession = jest.fn();
const mockFindUnique = jest.fn();

jest.mock("next-auth", () => ({ getServerSession: (...args: unknown[]) => mockGetServerSession(...args) }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/prisma", () => ({ prisma: { event: { findUnique: (...args: unknown[]) => mockFindUnique(...args) } } }));

import { GET } from "@/app/api/events/[id]/route";

const eventRow = {
  id: "evt1",
  title: "festa",
  clientId: "client1",
  client: { id: "client1", userId: "user-owner", user: { name: "Dono" } },
  bookings: [
    { id: "b1", status: "REQUESTED", musician: { id: "m1", userId: "user-m1", stageName: "Mus 1", photoUrl: null, verified: true } },
    { id: "b2", status: "REQUESTED", musician: { id: "m2", userId: "user-m2", stageName: "Mus 2", photoUrl: null, verified: false } },
  ],
};

const call = () => GET(new Request("http://localhost/api/events/evt1"), { params: { id: "evt1" } });
const login = (id: string, role: string) => mockGetServerSession.mockResolvedValue({ user: { id, role } });

describe("GET /api/events/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUnique.mockResolvedValue(eventRow);
  });

  it("401 sem sessão", async () => {
    mockGetServerSession.mockResolvedValue(null);
    expect((await call()).status).toBe(401);
  });

  it("dono vê o evento, sem userId vazando", async () => {
    login("user-owner", "CLIENT");
    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.bookings).toHaveLength(2);
    expect(body.client.userId).toBeUndefined();
    expect(body.bookings[0].musician.userId).toBeUndefined();
  });

  it("ADMIN vê o evento", async () => {
    login("user-admin", "ADMIN");
    expect((await call()).status).toBe(200);
  });

  it("músico com contratação vê o evento, mas só a própria contratação", async () => {
    login("user-m1", "MUSICIAN");
    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.bookings.map((b: { id: string }) => b.id)).toEqual(["b1"]);
  });

  it("outro cliente recebe 404 idêntico ao de evento inexistente", async () => {
    login("user-other", "CLIENT");
    const denied = await call();
    const deniedBody = await denied.json();

    mockFindUnique.mockResolvedValue(null);
    const missing = await call();

    expect(denied.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(deniedBody).toEqual(await missing.json());
  });

  it("músico sem contratação no evento recebe 404", async () => {
    login("user-m3", "MUSICIAN");
    expect((await call()).status).toBe(404);
  });
});
