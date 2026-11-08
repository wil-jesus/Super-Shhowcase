# Production smoke test

## 1) External credentials

Confirme que todas as variáveis abaixo estão no ambiente de produção da Vercel:

```text
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
```

## 2) Pagamento direto + taxa (Fase 1)

A rota Stripe (`/api/payments/*`) foi removida; não há Stripe Connect nem webhook nesta fase.
Valide o fluxo descrito em [PAYMENTS.md](PAYMENTS.md) pela interface:

1. Cliente: contratação aceita → "Pagar" → "Já paguei" (`PAYMENT_CLAIMED`).
2. Músico: "Recebi o pagamento" (`PAID`); conferir `platformFee` e `netAmount` (R$ 1.000 → 60 / 940).
3. Cliente e músico confirmam o serviço → `COMPLETED`.
4. Músico vê a taxa em Financeiro; admin a vê em Taxas e marca como paga.

## 3) Resend + UploadThing

- Confirmar que o envio de email de recuperação e verificação funciona em produção.
- Confirmar upload de foto do perfil em um músico autenticado.
- Validar que o retorno de URL do UploadThing é persistido corretamente.

## 4) Smoke test em produção

Use um ambiente público com domínio real e execute o fluxo abaixo:

```text
cadastro → login → sessão → perfil do músico → upload de foto → busca → booking → pagamento → review
```

### Checklist

- [ ] `/api/health` responde com `database: ok`
- [ ] cadastro cria usuário sem erro
- [ ] login gera sessão válida
- [ ] perfil do músico salva preço / raio / geolocalização
- [ ] upload da foto funciona e atualiza `photoUrl`
- [ ] busca retorna resultados
- [ ] booking cria transação e bloqueia conflitos
- [ ] pagamento gera `clientSecret` do Stripe
- [ ] webhook `payment_intent.payment_failed` atualiza status para `FAILED`
- [ ] review consome o booking finalizado e atualiza reputação

## 5) Observações

- O `/api/health` deve responder em 1 chamada e indicar se o banco está disponível.
- Use a conta Stripe em modo teste; não use a chave live em staging.
- Mantenha `NEXTAUTH_URL` apontando para o domínio público correto após deploy final.
