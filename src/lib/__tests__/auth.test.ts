import bcrypt from "bcryptjs";
import { GET } from "../../app/api/health/route";

describe("Auth utilities", () => {
  it("should hash a password", async () => {
    const hash = await bcrypt.hash("password123", 10);
    expect(hash).not.toBe("password123");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("should verify a correct password", async () => {
    const hash = await bcrypt.hash("test123", 10);
    const valid = await bcrypt.compare("test123", hash);
    expect(valid).toBe(true);
  });

  it("should reject an incorrect password", async () => {
    const hash = await bcrypt.hash("test123", 10);
    const valid = await bcrypt.compare("wrong", hash);
    expect(valid).toBe(false);
  });

  it("should expose database status in the health endpoint", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(payload).toHaveProperty("database");
    expect(["ok", "degraded", "down"]).toContain(payload.database);
  });
});
