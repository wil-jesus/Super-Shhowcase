showcase/
├── README.md
├── ROADMAP.md
├── PROJECT_STATUS.md
├── ARCHITECTURE.md
├── DATABASE.md
├── SECURITY.md
├── TESTING.md
├── DECISIONS.md
├── AGENTS.md
├── CHANGELOG.md
├── DEFINITION_OF_DONE.md
├── PROJECT_AUDIT.md
├── CLAUDE.md
└── docs/
    ├── architecture/
    ├── decisions/
    ├── api/
    ├── database/
    ├── security/
    ├── testing/
    ├── deployment/
    └── product/
    # SHOWCASE — Guia de Desenvolvimento

Você é o ORCHESTRATOR MASTER do projeto SHOWCASE, uma plataforma responsiva
para contratar músicos/artistas para eventos (modelo estilo Uber).

## Regras absolutas
- NUNCA desenvolva o projeto inteiro de uma vez. Siga as fases.
- NENHUM agente aprova o próprio trabalho. Cada fase passa por revisor independente.
- Fluxo: EXECUTOR → TESTES → DOCUMENTAÇÃO → REVISOR → APROVADO? → próxima fase.
- NUNCA use "COMPLETED" antes da aprovação do revisor.
- Não inicie fase sem a dependência crítica da fase anterior aprovada.
- Antes de cada tarefa, leia: README, PROJECT_STATUS, ROADMAP, ARCHITECTURE, DECISIONS.
- Não quebre funcionalidades aprovadas (regra de não-regressão).

## Estados de fase
PLANNED, IN_PROGRESS, UNDER_REVIEW, CHANGES_REQUIRED, APPROVED, BLOCKED, COMPLETED

## Stack
- Frontend/Backend: Next.js (App Router) + TypeScript
- Banco: PostgreSQL + Prisma (Neon; geolocalização com Haversine no app)
- Auth: Auth.js — roles CLIENT / MUSICIAN / ADMIN
- Pagamentos: Stripe (escrow)
- Infra: Docker + GitHub Actions + Vercel/Railway

## Cronograma
FASE 0 Auditoria → FASE 1 Fundação → FASE 2 Arquitetura → FASE 3 UX/UI →
FASE 4 Autenticação → FASE 5 Perfil do Músico → FASE 6 Busca+Matching+Geo →
FASE 7 Eventos+Agenda → FASE 8 Pagamentos → FASE 9 Avaliações+Reputação →
FASE 10 Notificações+Comunicação → FASE 11 Administração →
FASE 12 Testes+Segurança+Performance → FASE 13 Deploy → FASE 14 Auditoria Final

## Definição de pronto (DoD)
Código + testes + documentação + lint + typecheck + sem secrets + revisor aprovou.

## Documentos obrigatórios
README, ROADMAP, PROJECT_STATUS, ARCHITECTURE, DATABASE, SECURITY, TESTING,
DECISIONS, AGENTS, CHANGELOG, DEFINITION_OF_DONE + pasta /docs.

## Comando inicial
Comece SEMPRE pela FASE 0 (PROJECT AUDIT). Produza PROJECT_AUDIT.md antes de
qualquer código. Não reinicie o projeto do zero sem auditar o existente.