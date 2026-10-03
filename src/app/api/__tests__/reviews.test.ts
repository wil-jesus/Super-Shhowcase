import { z } from "zod";

const ReviewSchema = z.object({
  bookingId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

describe("Reviews validation", () => {
  it("should accept rating 1-5", () => {
    [1, 2, 3, 4, 5].forEach((rating) => {
      expect(
        ReviewSchema.safeParse({
          bookingId: "ck000000000000000000000000",
          rating,
        }).success
      ).toBe(true);
    });
  });

  it("should reject rating 0 or 6", () => {
    expect(
      ReviewSchema.safeParse({
        bookingId: "ck000000000000000000000000",
        rating: 0,
      }).success
    ).toBe(false);

    expect(
      ReviewSchema.safeParse({
        bookingId: "ck000000000000000000000000",
        rating: 6,
      }).success
    ).toBe(false);
  });

  it("should reject non-integer rating", () => {
    expect(
      ReviewSchema.safeParse({
        bookingId: "ck000000000000000000000000",
        rating: 3.5,
      }).success
    ).toBe(false);
  });
});
