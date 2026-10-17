# Roadmap Pós-MVP — Showcase

**Data:** 2026-08-31  
**Fase:** 15+ | **Agente:** PRODUCT TEAM

## Visão geral

O MVP foi lançado e o produto está em produção. Este documento lista as melhorias prioritárias para a evolução pós-lançamento, com base em feedback esperado do mercado e boas práticas de produção.

## Pilares de evolução

### 1. Observabilidade e Monitoramento

#### Sentry — Error tracking

- **Prioridade:** CRÍTICA (semana 1 após lançamento)
- **Custo:** Free tier = 5.000 erros/mês
- **Impacto:** Detectar e corrigir bugs em produção rapidamente
- **Implementação:**
  ```bash
  npm install @sentry/nextjs
  ```
- **Benefício:** Dashboard de erros em tempo real, notificação por email, grouping automático

#### Logs estruturados — Pino ou Vercel Analytics

- **Prioridade:** ALTA (semana 2)
- **Opção A - Pino:** estruturado, customizável, produção
- **Opção B - Vercel Analytics:** nativa na Vercel, zero config
- **Impacto:** Debugging mais rápido, auditoria de ações
- **Recomendação:** Começar com Vercel Analytics (grátis), migrar para Pino se precisar de volume maior

### 2. Pagamentos — Stripe Connect

#### Stripe Connect para split de pagamentos

- **Prioridade:** ALTA (mês 2)
- **Contexto:** Hoje, o escrow é manual no modelo. Connect automatiza repasse ao músico.
- **Impacto:** 
  - Cliente paga → Stripe Connect → automático para conta do músico
  - Reduz operações manuais
  - Melhor UX para o músico (recebe direto)
- **Implementação:**
  - Criar `ConnectedAccount` para cada músico
  - Usar `transfer` ao invés de `payout` manual
  - Dashboard de payouts do músico via Stripe
- **Custo:** Stripe cobra 2,2% + $0,30 por transferência (dentro do país)

### 3. Busca — Meilisearch ou Typesense

#### Migração para mecanismo de busca especializado

- **Prioridade:** MÉDIA (mês 3, quando ~1.000 músicos)
- **Problema atual:** PostgreSQL full-text com pg_trgm funciona, mas não é escalável para 10k+
- **Soluções:**
  - **Meilisearch:** open-source, simple, ótima para typo-tolerance, rápida
  - **Typesense:** open-source, alternativa, mais leve
  - **Elasticsearch:** industry standard, mais complexo
- **Recomendação:** Meilisearch (beginner-friendly)
- **Implementação:**
  ```bash
  npm install meilisearch next-meilisearch
  ```
- **Impacto:**
  - Busca < 50ms mesmo com 10k+ músicos
  - Faceting melhorado (filtros lado a lado)
  - Sugestões automáticas
- **Custo:** Cloud Meilisearch ~$19/mês (starter)

### 4. Notificações — Push notifications

#### One Signal ou Firebase Cloud Messaging

- **Prioridade:** MÉDIA (mês 2–3)
- **Contexto:** Músicos usam mobile; precisam de notificação sobre novas solicitações, mensagens
- **Soluções:**
  - **OneSignal:** simples, cross-platform (web, mobile, SMS)
  - **Firebase:** nativo Google, integrado com Android
- **Recomendação:** OneSignal (simpler UX para músicos)
- **Implementação:**
  - Integrar Web Push API
  - Dashboard OneSignal para segmentação
  - Triggers: nova solicitação de booking, mensagem recebida, evento próximo
- **Custo:** OneSignal free até 30k subscribers

### 5. Analytics — Produto e performance

#### PostHog ou Mixpanel

- **Prioridade:** MÉDIA (mês 1–2)
- **Impacto:** Entender padrões de uso, funis de conversão (cadastro → busca → booking)
- **Recomendação:** PostHog (open-source, self-hostable)
- **Custo:** PostHog Cloud free até 1M events/mês

## Sequência recomendada

| Semana | Pilar | Ação |
|--------|-------|------|
| 1 | Observabilidade | Sentry + Vercel Analytics |
| 2 | Observabilidade | Logs estruturados (Pino) |
| 2 | Analytics | PostHog integração |
| 3 | Notificações | OneSignal setup + web push |
| 4 | Pagamentos | Stripe Connect design |
| 6+ | Pagamentos | Stripe Connect implementação |
| 8+ | Busca | Meilisearch prototipo |
| 10+ | Busca | Migração para Meilisearch |

## Decisões técnicas pendentes

### ADR-008 — Observabilidade em produção

- **Contexto:** Projeto em produção precisa de visibilidade em tempo real.
- **Decisão:** Sentry + Vercel Analytics + Pino para logs estruturados.
- **Motivo:** Stack mínima para acionabilidade; cobertura de erros + app health + auditoria.
- **Impacto:** MTTR (Mean Time To Recovery) reduz de horas para minutos.

### ADR-009 — Pagamento com Connect

- **Contexto:** Escrow manual não é escalável além de ~10 eventos/dia.
- **Decisão:** Migrar para Stripe Connect no mês 2.
- **Motivo:** Automatização, melhor UX do músico, compliance.
- **Impacto:** Reduz custo operacional, melhora retenção de músicos.

## Fora do escopo (não-prioridades imediatas)

- Machine learning para ranking de busca (> 6 meses)
- App nativa iOS/Android (MVP é web; considerar React Native depois)
- Marketplace de templates de eventos (Feature creep; esperar feedback)
- Streaming de áudio ao vivo (Out of scope MVP)

## Contato com usuários — Feedback loop

Após lançamento, agendar entrevistas:

1. **Clientes** (primeiros 5–10): satisfação com busca, booking, pagamento
2. **Músicos** (primeiros 5–10): disponibilidade, notificações, pagamento, reputação
3. **Admin** (você): métricas, bugs, segurança

Priorizar correções com base em impacto + frequência.

## Revisão

Este documento será revisado mensalmente após o lançamento.
