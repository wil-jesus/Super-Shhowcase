# PROJECT STATUS — SHOWCASE

**Última atualização:** 2026-10-16

## Fases
| Fase | Nome | Estado | Revisor |
|------|------|--------|---------|
| 0 | Auditoria | COMPLETED | REVIEWER-FINAL |
| 1 | Fundação | COMPLETED | REVIEWER-FOUNDATION |
| 2 | Arquitetura | APPROVED | REVIEWER-ARCHITECT |
| 3 | UX/UI | APPROVED (doc validada) | REVIEWER-UX |
| 4 | Autenticação | COMPLETED (cadastro/login/sessão validados em produção em 2026-10-16) | REVIEWER-AUTH |
| 5 | Perfil do Músico | UNDER_REVIEW (correções aplicadas) | REVIEWER-MUSICIAN |
| 6 | Busca + Matching + Geo | IN_PROGRESS | REVIEWER-SEARCH |
| 7 | Eventos + Agenda + Contratação | IN_PROGRESS | REVIEWER-EVENT |
| 8 | Pagamentos | PLANNED | REVIEWER-PAYMENT |
| 9 | Avaliações + Reputação | PLANNED | REVIEWER-REPUTATION |
| 10 | Notificações + Comunicação | PLANNED | REVIEWER-COMMUNICATION |
| 11 | Administração | PLANNED | REVIEWER-ADMIN |
| 12 | Testes + Segurança + Perf | PLANNED | REVIEWER-QA + SECURITY |
| 13 | Deploy + Produção | READY em produção (https://showcase-two-eosin.vercel.app); revisão do REVIEWER-DEVOPS pendente | REVIEWER-DEVOPS |
| 14 | Auditoria Final | PLANNED | REVIEWER-FINAL |

## Correções aplicadas
- **FASE 4:** verificação de email (token + expiração), rate limiting, expiração de sessão (7 dias).
- **FASE 5:** autorização de posse (IDOR corrigido), validação de preço/raio, rota de upload de mídia.
- **FASE 10/13:** envio de recuperação por Resend e upload de imagem por UploadThing integrados.
- **FASE 13:** configuração Vercel criada; produção definida com Neon sem PostGIS e Haversine no app.
- **FASE 13:** `NEXTAUTH_URL` corrigido para o domínio canônico `https://showcase-two-eosin.vercel.app`; aliases e URLs de deploy de produção redirecionam (308) para ele via `next.config.mjs`; previews não redirecionam.

## Pendências registradas
- **FASE 6:** revisão pendente do REVIEWER-SEARCH.
- **FASE 8–12:** ainda precisam de revisão independente e cobertura de integração/E2E conforme o DoD.
- **FASE 13:** validar webhooks (Stripe) e demais fluxos em produção.
- **Melhorias (fila):** rate limit persistente, "lembrar de mim", política para `PENDING_VERIFICATION`, health check com tabela real.

## Regra
- Nenhuma fase recebe COMPLETED sem aprovação do revisor.
- Estados válidos: PLANNED, IN_PROGRESS, UNDER_REVIEW, CHANGES_REQUIRED, APPROVED, BLOCKED, COMPLETED.
