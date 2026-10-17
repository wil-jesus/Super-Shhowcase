# Relatório Técnico — Showcase

**Data:** 04/10/2026
**Destinatário:** Direção do projeto
**Escopo:** verificação do estado atual do código em `D:\showcasee\showcase` (tipos, testes, schema, inventário de funcionalidades e revisão do código-fonte).

---

## 1. Resumo executivo

O Showcase é uma plataforma de contratação de músicos para eventos (Next.js 14, TypeScript, Prisma/PostgreSQL em Neon, NextAuth, Stripe, UploadThing, Resend, Vercel).
A superfície funcional do MVP está **implementada** (36 rotas de API, páginas de autenticação, busca, perfis, eventos, reservas, pagamentos, avaliações, notificações e administração).

A validação automatizada tem **resultado misto**:

| Verificação | Resultado |
|---|---|
| Testes unitários (Jest) | **Aprovado** — 3 suítes, 9 testes, 0 falhas |
| Schema Prisma (`prisma validate`) | **Aprovado** |
| Verificação de tipos (`tsc --noEmit`) | **Aprovado** (após correção, ver 3.1) |
| Lint (`next lint`) | **Aprovado** (0 erros, 1 aviso `<img>`) após trocar para `.eslintrc.json` |
| Build de produção (`next build`) | **Aprovado** — 36 páginas geradas, exit 0 (Next 14.2.35) |
| Teste funcional ponta a ponta (fluxos reais com BD/Stripe) | **Não executado** nesta verificação |

**Parecer:** adequado como demonstração/protótipo supervisionado, mas **o build de produção está quebrado no estado atual** (erro de tipos, correção simples). Antes de declarar pronto para produção é necessário corrigir os itens da secção 3, ampliar a cobertura de testes (secção 4) e validar os fluxos de pagamento em ambiente de teste da Stripe.

---

## 2. Inventário de funcionalidades

Estado: **Implementado** = código presente e coerente na revisão estática; **Testado** = coberto por teste automatizado executado nesta verificação.
Nenhum fluxo de negócio foi exercitado ponta a ponta nesta verificação; "Implementado" não equivale a "validado em execução".

### 3.0 API (36 rotas)

| Módulo | Endpoints | Estado |
|---|---|---|
| Autenticação | `POST /api/auth/register`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET /api/auth/me`, NextAuth (`/api/auth/[...nextauth]`) | Implementado. Rate limit de 5 tentativas/15 min em registo e login. Hash de senha testado (bcrypt). |
| Músicos | `GET /api/musicians`, `GET/PUT /api/musicians/[id]`, `GET/PUT /api/musicians/me`, `POST/DELETE .../skills`, `GET/POST/DELETE .../availability`, `POST .../media`, `GET .../reviews` | Implementado. Verificação de posse (IDOR) presente; coordenadas removidas da resposta pública; `stripeAccountId` validado (`acct_`). |
| Habilidades | `GET /api/skills`, `POST /api/skills/seed` | Implementado. Seed agora restrito a ADMIN. |
| Busca | `GET /api/search` | Implementado (normalização, sinónimos, Haversine, ranking em `src/lib/matching.ts`). |
| Eventos | `GET/POST /api/events`, `GET/PATCH /api/events/[id]`, `POST /api/events/[id]/book` | Implementado; restrito a CLIENT/ADMIN. |
| Reservas | `GET/POST /api/bookings`, `GET/PATCH /api/bookings/[id]`, `GET/POST /api/bookings/[id]/messages` | Implementado (máquina de estados, deteção de conflito de agenda, chat). Validação de estados coberta por teste (apenas o schema Zod). |
| Pagamentos | `POST /api/payments`, `GET /api/payments/[id]`, `POST /api/payments/release`, `POST /api/payments/webhook` | Implementado. Release exige ADMIN e conta Connect `acct_...`; webhook trata `payment_failed` e `charge.refunded`. **Sem teste automatizado.** |
| Avaliações | `POST /api/reviews`, `GET /api/musicians/[id]/reviews` | Implementado. Validação de nota 1–5 testada (apenas schema). |
| Notificações | `GET/PATCH /api/notifications` | Implementado (in-app). Envio de e-mail/push de reservas não está ligado (`TODO` em `src/lib/notifications.ts`). |
| Administração | `GET /api/admin/metrics`, `reports`, `users`, `verifications` (+ `PATCH` por `[id]`) | Implementado, todas com verificação de role ADMIN. |
| Upload | `/api/uploadthing` | Implementado; restrito a MUSICIAN/ADMIN. |
| Saúde | `GET /api/health` | Implementado; consulta o BD (`SELECT 1`) e devolve `ok`/`degraded`. |

### Interface

Páginas presentes: login, registo, recuperação de senha, busca, perfil público do músico, dashboards de cliente e músico, painel de administração (utilizadores, verificações, relatórios). O middleware aplica controlo por role em `/admin` e `/dashboard/*`.

---

## 3. Defeitos e riscos encontrados

### 3.1 Erro de tipos — `@hookform/resolvers/zod` (RESOLVIDO)

Causa real: o pacote publicado `@hookform/resolvers@5.9.1` não inclui `zod/dist/index.d.ts` (defeito de empacotamento; o `tsconfig.json` já usava `moduleResolution: bundler`). Correção: versão fixada em `5.9.0` (exata), que contém os tipos. Reavaliar ao sair uma versão posterior corrigida.

Erros originais (TS7016) em login, registo e novo evento (`src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `src/app/(dashboard)/dashboard/client/events/new/page.tsx`). O `LAUNCH_CHECKLIST.md` afirmava que o typecheck passava, o que não era verdade na altura.

### 3.2 Lint (RESOLVIDO)

`eslint.config.mjs` estendia `next/typescript` (inexistente no `eslint-config-next@14`). Substituído por `.eslintrc.json` com `next/core-web-vitals`; `npm run lint` passa. A regra `@typescript-eslint/no-unused-vars` foi removida porque o plugin não está instalado.

### 3.3 Build de produção (RESOLVIDO)

- Falha inicial por binário SWC ausente (instalação local incompleta), corrigida com `npm install --no-save @next/swc-win32-x64-msvc`.
- Falha seguinte pelo erro de tipos de 3.1. Após as correções, `next build` termina com exit 0.
- Pendente: confirmar o build em CI com Node 20 (`engines` e `.nvmrc` agora fixam Node 20).

### 3.4 Dependências com vulnerabilidades (reduzido)

Next atualizado de 14.2.0 para 14.2.35. Vulnerâbilidades no `npm audit --omit=dev`: **11 (10 altas, 1 crítica)**, contra 46 antes (esse total incluía dependências de desenvolvimento). Restante requer triagem; algumas exigem upgrade major do Next.

### 3.5 Outros pontos

- `src/app/api/auth/forgot-password/route.ts` instancia `new PrismaClient()` próprio em vez de usar `@/lib/prisma` (risco de esgotar ligações em serverless).
- Rate limit em memória: não é partilhado entre instâncias serverless, logo é apenas mitigação parcial.
- E-mail de nova solicitação de reserva ligado (Resend); demais eventos de reserva ainda só notificam in-app. Push não implementado. O remetente `noreply@showcase.com` exige domínio verificado no Resend.
- `PROJECT_STATUS.md` (27/08) e `LAUNCH_CHECKLIST.md` estão desatualizados (ex.: marcam pagamentos/avaliações/admin como planeados e afirmam "8 testes", "typecheck passou").
- Prisma 5.22 com atualização major disponível (não urgente).

### 3.6 Itens do parecer de 14/09 já corrigidos no código atual

Confirmado por inspeção do código:

| Item anterior | Estado atual |
|---|---|
| Registo sem handler `POST` | Corrigido — `POST /api/auth/register` existe, com rate limit |
| Rate limit sem uso | Corrigido — usado em registo e login |
| Seed de skills sem autenticação | Corrigido — exige ADMIN |
| Destino de payout inválido (CUID) | Corrigido — exige `acct_...` |
| Falha de pagamento marcada como reembolso | Corrigido — `payment_failed` e `charge.refunded` tratados separadamente |
| `/admin` sem role no middleware | Corrigido — middleware valida role |
| Coordenadas expostas | Corrigido em GET público (confirmar em `PUT`) |
| Sem rota de saúde | Corrigido — `/api/health` |

---

## 4. Cobertura de testes

Os 9 testes existentes verificam apenas: hash/validação de senha (bcrypt), enums/limites Zod para reservas e avaliações, e o formato da resposta de saúde. **Nenhum teste exercita as rotas reais ou regras de negócio.**

Sem cobertura: registo e login, transições de estado de reservas, conflitos de agenda, autorização (IDOR/roles), busca/ranking, webhook Stripe (assinatura e idempotência), liberação de pagamento, upload, administração. Não há testes E2E nem pipeline de CI (`.github/workflows`).

---

## 5. Recomendações (ordem de prioridade)

1. Corrigir `moduleResolution` (ou declarar o módulo) para eliminar os 3 erros de `tsc`, que também quebram o build.
2. Confirmar o build limpo (`npm ci`, Node LTS) e corrigir qualquer erro adicional.
3. Corrigir a configuração do ESLint (formato `.eslintrc` com `next/core-web-vitals` e `@typescript-eslint`, ou ESLint 9 + `eslint-config-next` compatível).
4. Atualizar Next.js (14.2.x mais recente) e tratar o `npm audit`.
5. Escrever testes de integração para: registo/login, máquina de estados de reservas, autorização por role/posse, webhook Stripe e busca.
6. Executar um fluxo E2E completo em staging (registo → busca → reserva → aceite → pagamento em modo teste → conclusão → avaliação → liberação).
7. Unificar a instância de `PrismaClient` e migrar o rate limit para armazenamento partilhado (ex.: Upstash/Redis) antes de produção.
8. Atualizar `PROJECT_STATUS.md` e `LAUNCH_CHECKLIST.md` para refletir o estado real; adicionar `README.md` na raiz.
9. Ligar notificações de e-mail de reservas (Resend) e definir plano para push.

---

## 6. Limitações desta verificação

- Foram executados: `jest`, `tsc --noEmit`, `prisma validate`, tentativa de `eslint`/`next lint`, `next build`, mais inspeção estática das rotas e do middleware.
- Não foram executados fluxos reais contra o BD Neon, Stripe, Resend ou UploadThing; portanto o funcionamento em execução de cada endpoint **não está comprovado**, apenas a sua presença e coerência no código.
- Nenhum segredo foi lido ou incluído neste relatório.
