import { z } from "zod";

const BookingStatusSchema = z.enum([
  "REQUESTED",
  "PENDING_MUSICIAN",
  "ACCEPTED",
  "REJECTED",
  "CANCELLED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "DISPUTED",
  "PENDING_PAYMENT",
  "PAYMENT_CLAIMED",
  "PAID",
]);

describe("Bookings validation", () => {
  it("should accept all valid statuses", () => {
    const statuses = [
      "REQUESTED",
      "ACCEPTED",
      "REJECTED",
      "CONFIRMED",
      "COMPLETED",
      "DISPUTED",
    ];

    statuses.forEach((status) => {
      expect(BookingStatusSchema.safeParse(status).success).toBe(true);
    });
  });

  it("should reject invalid status", () => {
    expect(BookingStatusSchema.safeParse("PENDING").success).toBe(false);
    expect(BookingStatusSchema.safeParse("draft").success).toBe(false);
  });
});
