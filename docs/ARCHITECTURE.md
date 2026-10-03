# ARCHITECTURE — SHOWCASE

**Fase:** 2 | **Agente:** AGENT-ARCHITECT | **Status:** APPROVED (após revisão)

## Visão geral
Plataforma responsiva de contratação de músicos/artistas para eventos.
Arquitetura modular, monólito modular no MVP, preparada para evolução.

## Stack
- **Frontend:** React + Next.js (App Router) + TypeScript
- **Backend:** Next.js API Routes (MVP) → API dedicada quando crescer
- **Banco:** PostgreSQL + Prisma ORM (Neon; geolocalização com Haversine no app)
- **Auth:** Auth.js (NextAuth) — roles CLIENT / MUSICIAN / ADMIN
- **Busca:** PostgreSQL full-text + pg_trgm (fuzzy) + catálogo de skills
- **Pagamentos:** Stripe (escrow: cliente → plataforma → repasse)
- **Infra:** Docker + GitHub Actions + Vercel/Railway

## Camadas
1. **Presentation** — componentes React, páginas, UX/UI responsiva
2. **Application** — casos de uso, orquestração de regras de negócio
3. **Domain** — entidades, regras de negócio (matching, eventos, reputação)
4. **Infrastructure** — banco, auth, pagamentos, notificações, storage

## Fluxo principal (contratação)
CLIENTE → cria evento → informa localização → pesquisa músico
→ sistema faz matching (habilidade, distância, disponibilidade, reputação)
→ cliente solicita → músico aceita/recusa → evento confirmado
→ evento concluído → avaliação mútua → pagamento/repasses

## Busca e matching (melhoria 1)
- Normalização de texto: remover acentos, caixa baixa, stemização.
- **Fuzzy matching** com extensão `pg_trgm` (similaridade de trigramas)
  para tolerar erros de digitação ("bateia" → "bateria").
- Catálogo de skills com **sinônimos** e variações (plural/singular, nomes
  populares), extensível.
- Ranking por fatores ponderados (habilidade, distância, disponibilidade,
  avaliação, nº de avaliações, taxa de resposta, preço, verificação).
- **Matching isolado em módulo próprio** (interface) para evolução futura
  (inclusive IA) sem refatorar o resto do sistema (melhoria 4).

## Geolocalização e privacidade (melhoria 2)
- Evento armazena latitude/longitude do local.
- Músico armazena **localização aproximada + raio de atendimento**.
- Sistema calcula distância com Haversine no app.
- **Nunca expõe a localização exata do músico** — apenas a distância calculada
  e a área de serviço. Privacidade desde o início.

## Modelo de dados — EVENT vs BOOKING (melhoria 3)
- **EVENT**: dados do evento (cliente, local, data, duração, tipo, observações).
- **BOOKING**: estado da contratação (REQUESTED, ACCEPTED, CONFIRMED, etc.).
- Separação clara evita duplicar estados e confusão de responsabilidades.

## Observabilidade (melhoria 5)
- Logs estruturados.
- Endpoint de health check.
- Métricas de uso e erros.
- Monitoramento de erros críticos (rastreáveis).
- Auditoria de ações administrativas.

## Decisões-chave
- Monólito modular (evitar microserviços prematuros).
- API-first: backend expõe API REST consumida pelo frontend e futuras apps.
- Matching determinístico no MVP (sem IA), arquitetura preparada para IA futura.
- Escrow de pagamento: plataforma retém até conclusão do evento.