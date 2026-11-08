import {
  PLATFORM_FEE_RATE_PERCENT,
  calculateFee,
  canActorTransition,
  hasPayableValue,
  isKnownTransition,
} from "@/lib/booking-flow";

describe("calculateFee (take rate)", () => {
  it("R$ 1.000 -> taxa 60, líquido 940", () => {
    expect(PLATFORM_FEE_RATE_PERCENT).toBe(6);
    expect(calculateFee(1000)).toEqual({ feeRate: 6, platformFee: 60, netAmount: 940 });
  });

  it("aceita Decimal serializado como string", () => {
    expect(calculateFee("1000.00")).toEqual({ feeRate: 6, platformFee: 60, netAmount: 940 });
  });

  it("arredonda em centavos sem erro de ponto flutuante", () => {
    const fee = calculateFee(499.99);
    expect(fee.platformFee).toBe(30);
    expect(fee.platformFee + fee.netAmount).toBeCloseTo(499.99, 2);
  });

  it("rejeita valor zero, negativo ou inválido", () => {
    expect(() => calculateFee(0)).toThrow();
    expect(() => calculateFee(-10)).toThrow();
    expect(() => calculateFee("abc")).toThrow();
  });
});

describe("hasPayableValue", () => {
  it("exige valor maior que zero", () => {
    expect(hasPayableValue(null)).toBe(false);
    expect(hasPayableValue(undefined)).toBe(false);
    expect(hasPayableValue(0)).toBe(false);
    expect(hasPayableValue("0.00")).toBe(false);
    expect(hasPayableValue("0.004")).toBe(false);
    expect(hasPayableValue("150.00")).toBe(true);
  });
});

describe("máquina de estados da contratação", () => {
  it("segue o fluxo ACCEPTED -> PENDING_PAYMENT -> PAYMENT_CLAIMED -> PAID -> COMPLETED", () => {
    expect(canActorTransition("ACCEPTED", "PENDING_PAYMENT", "client")).toBe(true);
    expect(canActorTransition("PENDING_PAYMENT", "PAYMENT_CLAIMED", "client")).toBe(true);
    expect(canActorTransition("PAYMENT_CLAIMED", "PAID", "musician")).toBe(true);
    expect(canActorTransition("PAID", "COMPLETED", "client")).toBe(true);
    expect(canActorTransition("PAID", "COMPLETED", "musician")).toBe(true);
  });

  it("o cliente não pode confirmar o próprio pagamento (PAID)", () => {
    expect(canActorTransition("PAYMENT_CLAIMED", "PAID", "client")).toBe(false);
  });

  it("o músico não pode informar o pagamento", () => {
    expect(canActorTransition("PENDING_PAYMENT", "PAYMENT_CLAIMED", "musician")).toBe(false);
  });

  it("não permite pular etapas nem sair de estados finais", () => {
    expect(isKnownTransition("ACCEPTED", "PAID")).toBe(false);
    expect(isKnownTransition("PENDING_PAYMENT", "PAID")).toBe(false);
    expect(isKnownTransition("CONFIRMED", "COMPLETED")).toBe(false);
    expect(isKnownTransition("COMPLETED", "CANCELLED")).toBe(false);
    expect(isKnownTransition("CANCELLED", "ACCEPTED")).toBe(false);
  });

  it("admin executa qualquer transição existente, mas não inventa novas", () => {
    expect(canActorTransition("PAYMENT_CLAIMED", "PAID", "admin")).toBe(true);
    expect(canActorTransition("DISPUTED", "COMPLETED", "admin")).toBe(true);
    expect(canActorTransition("ACCEPTED", "PAID", "admin")).toBe(false);
  });

  it("disputa só é resolvida pelo admin", () => {
    expect(canActorTransition("DISPUTED", "CANCELLED", "client")).toBe(false);
    expect(canActorTransition("DISPUTED", "CANCELLED", "musician")).toBe(false);
  });
});
