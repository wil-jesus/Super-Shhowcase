# Pagamentos (Fase 1: pagamento direto + take rate)

Nesta fase não há gateway no fluxo principal: o cliente paga o músico diretamente (Pix) e a plataforma
registra uma taxa (take rate) devida pelo músico.

## Fluxo de status da contratação

```
REQUESTED/PENDING_MUSICIAN -> ACCEPTED -> PENDING_PAYMENT -> PAYMENT_CLAIMED -> PAID -> (IN_PROGRESS) -> COMPLETED
```

| Transição | Quem | Observação |
| --- | --- | --- |
| ACCEPTED/CONFIRMED -> PENDING_PAYMENT | cliente | exige `value > 0` |
| PENDING_PAYMENT -> PAYMENT_CLAIMED | cliente | "Já paguei"; grava `paymentClaimedAt` |
| PAYMENT_CLAIMED -> PAID | músico | confirma recebimento; exige `value > 0`; calcula a taxa |
| PAYMENT_CLAIMED -> PENDING_PAYMENT | músico | "Não recebi" |
| PAID/IN_PROGRESS -> COMPLETED | cliente e músico | as duas partes precisam confirmar (`clientConfirmedAt`, `musicianConfirmedAt`); só então `completedAt` e status COMPLETED |
| qualquer ativo -> DISPUTED | cliente/músico | resolvida (CANCELLED/COMPLETED) somente pelo admin |

O admin pode executar qualquer transição existente, mas não pular etapas. As regras vivem em
`src/lib/booking-flow.ts`; a rota é `PATCH /api/bookings/[id]`. A atualização usa o status atual como
condição (`updateMany`), então requisições concorrentes não duplicam a transição nem a `FeeCharge`.

`CONFIRMED` é legado: só leva a pagamento ou cancelamento.

## Take rate

- Alíquota: constante única `PLATFORM_FEE_RATE_PERCENT = 6` (%) em `src/lib/booking-flow.ts` (decisão confirmada).
  Nenhum outro arquivo deve repetir o número; mover para variável de ambiente fica para depois (não prioritário).
- Aplicada sobre `Booking.value` ao entrar em PAID.
- Cálculo em centavos inteiros (sem ponto flutuante). Exemplo: R$ 1.000 -> `platformFee` 60, `netAmount` 940.
- Gravados no booking: `feeRate`, `platformFee`, `netAmount`. A taxa fica congelada mesmo se a alíquota mudar depois.
- Na mesma transação é criada uma `FeeCharge` (`PENDING`, única por booking).
- `Booking.value` é `Decimal(12,2)`; nas respostas JSON, campos Decimal chegam como string.

## Telas e APIs

| Tela | Rota | API |
| --- | --- | --- |
| Pagar (cliente) | `/dashboard/client/bookings/[id]/pay` | `PATCH /api/bookings/[id]` |
| Financeiro (músico) | `/dashboard/musician/financeiro` | `GET /api/fees` |
| Taxas (admin) | `/admin/fees` | `GET /api/admin/fees`, `PATCH /api/admin/fees/[id]` (marca como paga) |

## Fase 2 (desenho, não implementada)

Objetivo: cobrar o cliente pela plataforma antes do aceite e repassar ao músico após a conclusão.
O candidato de gateway é o Mercado Pago, com Pix dinâmico e cartão salvo por tokenização,
mediante mandato explícito aceito pelo cliente durante o cadastro.

- O cliente paga antes de o músico aceitar; o valor fica retido em escrow enquanto a contratação
  acontece.
- O split ocorre na fonte: 94% para o músico e 6% retidos pela plataforma no momento do pagamento.
  A taxa deixa de ser cobrada posteriormente; `FeeCharge` passa a ser apenas um registro histórico.
- A liberação ao músico ocorre após confirmação dupla da conclusão ou após 72 horas, mantendo a
  regra atual de confirmação/timeout.
- Pré-requisitos para implementação: CNPJ, KYC e subcontas dos músicos, além de webhooks assinados,
  idempotentes e monitorados.
- A integração exigirá rotas e persistência próprias, com tratamento explícito de reembolsos e
  disputas antes de entrar em produção. Nenhuma integração de gateway faz parte desta fase.

## Legado removido

`/api/payments` (POST, `[id]`, `release`, `webhook`) e `src/lib/stripe.ts` / `stripe-server.ts` foram removidos.
Os pacotes `stripe`, `@stripe/stripe-js` e `@stripe/react-stripe-js` continuam no `package.json` até a Fase 2 ser definida.
Se um webhook Stripe ainda estiver cadastrado no painel do Stripe, desative-o (a rota agora responde 404).

## Migração

`20261107194500_manual_payment_flow_and_fees`: 3 status novos, 5 timestamps, `feeRate/platformFee/netAmount`,
`FeeCharge` + índices e `value` Float -> `DECIMAL(12,2) USING "value"::decimal(12,2)`.
A tabela `playing_with_neon` (exemplo do Neon, fora do schema Prisma) foi mantida; por isso `migrate diff`
ainda a lista como `DROP TABLE`.
