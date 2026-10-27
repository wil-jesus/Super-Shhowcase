export type EventAccess = "admin" | "owner" | "musician";

interface AccessibleEvent {
  client: { userId: string };
  bookings: { musician: { userId: string } }[];
}

// Quem pode ver um evento: ADMIN, o cliente dono e músicos com contratação nele. Demais: null.
export function resolveEventAccess(
  event: AccessibleEvent,
  user: { id: string; role: string },
): EventAccess | null {
  if (user.role === "ADMIN") return "admin";
  if (event.client.userId === user.id) return "owner";
  if (event.bookings.some((booking) => booking.musician.userId === user.id)) return "musician";
  return null;
}
