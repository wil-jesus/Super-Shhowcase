import type { BookingStatus } from "@prisma/client";

export type BookingActor = "client" | "musician" | "admin";

// Take rate da plataforma (%), aplicado sobre o valor combinado no momento em que a contratação vira PAID.
export const PLATFORM_FEE_RATE_PERCENT = 6;

type Rules = Partial<Record<BookingStatus, Exclude<BookingActor, "admin">[]>>;

// Origem -> destino -> quem pode executar. ADMIN pode executar qualquer transição existente.
// CONFIRMED é legado: só sai para pagamento ou cancelamento, para que todo serviço passe por PAID.
export const bookingTransitions: Record<BookingStatus, Rules> = {
  REQUESTED: { PENDING_MUSICIAN: ["musician"], ACCEPTED: ["musician"], REJECTED: ["musician"], CANCELLED: ["client"] },
  PENDING_MUSICIAN: { ACCEPTED: ["musician"], REJECTED: ["musician"], CANCELLED: ["client"] },
  ACCEPTED: { PENDING_PAYMENT: ["client"], CANCELLED: ["client"] },
  CONFIRMED: { PENDING_PAYMENT: ["client"], CANCELLED: ["client"] },
  PENDING_PAYMENT: { PAYMENT_CLAIMED: ["client"], CANCELLED: ["client"] },
  PAYMENT_CLAIMED: { PAID: ["musician"], PENDING_PAYMENT: ["musician"], DISPUTED: ["client", "musician"] },
  PAID: { IN_PROGRESS: ["musician"], COMPLETED: ["client", "musician"], DISPUTED: ["client", "musician"] },
  IN_PROGRESS: { COMPLETED: ["client", "musician"], DISPUTED: ["client", "musician"] },
  DISPUTED: { CANCELLED: [], COMPLETED: [] },
  COMPLETED: {},
  REJECTED: {},
  CANCELLED: {},
};

// Status que ocupam a agenda do músico.
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  "ACCEPTED",
  "CONFIRMED",
  "PENDING_PAYMENT",
  "PAYMENT_CLAIMED",
  "PAID",
  "IN_PROGRESS",
];

export function isKnownTransition(from: BookingStatus, to: BookingStatus): boolean {
  return bookingTransitions[from]?.[to] !== undefined;
}

export function canActorTransition(from: BookingStatus, to: BookingStatus, actor: BookingActor): boolean {
  const allowed = bookingTransitions[from]?.[to];
  if (!allowed) return false;
  return actor === "admin" || allowed.includes(actor);
}

export interface FeeBreakdown {
  feeRate: number;
  platformFee: number;
  netAmount: number;
}

export function toCents(value: unknown): number {
  const amount = Number(String(value));
  if (!Number.isFinite(amount)) return NaN;
  return Math.round(amount * 100);
}

export function hasPayableValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const cents = toCents(value);
  return Number.isFinite(cents) && cents > 0;
}

// Cálculo em centavos inteiros para evitar erro de ponto flutuante (R$ 1.000 a 6% -> taxa 60, líquido 940).
export function calculateFee(value: unknown, ratePercent: number = PLATFORM_FEE_RATE_PERCENT): FeeBreakdown {
  const cents = toCents(value);
  if (!Number.isFinite(cents) || cents <= 0) {
    throw new RangeError("O valor da contratação deve ser maior que zero");
  }
  if (!Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 100) {
    throw new RangeError("Taxa inválida");
  }

  const feeCents = Math.round((cents * Math.round(ratePercent * 100)) / 10000);
  return {
    feeRate: ratePercent,
    platformFee: feeCents / 100,
    netAmount: (cents - feeCents) / 100,
  };
}
