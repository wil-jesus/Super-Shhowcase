// Normaliza texto: minúsculas + remove acentos
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Divide a consulta em tokens (palavras) e remove vazios
export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[\s,;]+/)
    .filter((token) => token.length > 0);
}
