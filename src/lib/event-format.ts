export const APP_TIME_ZONE = "America/Sao_Paulo";

export const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: "Casamento",
  BIRTHDAY: "Aniversário",
  CORPORATE: "Corporativo",
  PARTY: "Festa",
  OTHER: "Outro",
};

export const EVENT_STATUS_LABELS: Record<string, string> = {
  OPEN: "Aberto",
  BOOKED: "Contratado",
  CLOSED: "Encerrado",
  CANCELLED: "Cancelado",
};

export const EVENT_STATUS_COLORS: Record<string, "gray" | "green" | "yellow" | "red" | "blue"> = {
  OPEN: "blue",
  BOOKED: "green",
  CLOSED: "gray",
  CANCELLED: "red",
};

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
