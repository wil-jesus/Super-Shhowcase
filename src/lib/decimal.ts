// Normaliza entrada decimal pt-BR para o formato do JS: "499,99" -> "499.99", "1.234,56" -> "1234.56".
// String vazia vira undefined para campos opcionais não virarem 0 no z.coerce.number().
export function normalizeDecimalInput(value: unknown): unknown {
  if (typeof value !== "string") return value;

  const text = value.trim().replace(/\s/g, "");
  if (text === "") return undefined;

  return text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
}
