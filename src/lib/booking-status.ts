export type BadgeColor = "gray" | "green" | "yellow" | "red" | "blue" | "purple";

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Solicitada",
  PENDING_MUSICIAN: "Aguardando músico",
  ACCEPTED: "Aceita",
  REJECTED: "Recusada",
  CANCELLED: "Cancelada",
  CONFIRMED: "Confirmada",
  PENDING_PAYMENT: "Aguardando pagamento",
  PAYMENT_CLAIMED: "Pagamento informado",
  PAID: "Pago",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  DISPUTED: "Em disputa",
};

export const BOOKING_STATUS_COLORS: Record<string, BadgeColor> = {
  REQUESTED: "yellow",
  PENDING_MUSICIAN: "yellow",
  ACCEPTED: "blue",
  REJECTED: "red",
  CANCELLED: "red",
  CONFIRMED: "green",
  PENDING_PAYMENT: "yellow",
  PAYMENT_CLAIMED: "blue",
  PAID: "green",
  IN_PROGRESS: "purple",
  COMPLETED: "green",
  DISPUTED: "red",
};
