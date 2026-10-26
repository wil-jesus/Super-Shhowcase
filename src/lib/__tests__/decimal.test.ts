import { normalizeDecimalInput } from "@/lib/decimal";

describe("normalizeDecimalInput", () => {
  it("troca vírgula decimal por ponto", () => {
    expect(normalizeDecimalInput("499,99")).toBe("499.99");
    expect(normalizeDecimalInput("-22,969714")).toBe("-22.969714");
  });

  it("remove separador de milhar quando há vírgula decimal", () => {
    expect(normalizeDecimalInput("1.234,56")).toBe("1234.56");
  });

  it("mantém ponto decimal e espaços são ignorados", () => {
    expect(normalizeDecimalInput(" -43.423480 ")).toBe("-43.423480");
  });

  it("string vazia vira undefined e não-strings passam intactos", () => {
    expect(normalizeDecimalInput("  ")).toBeUndefined();
    expect(normalizeDecimalInput(4)).toBe(4);
    expect(normalizeDecimalInput(undefined)).toBeUndefined();
  });
});
