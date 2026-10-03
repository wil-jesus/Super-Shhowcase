# TESTING — SHOWCASE

**Fase:** 12 | **Agente:** AGENT-QA | **Status:** DRAFT

## Princípios
- Testes fazem parte da Definição de Pronto (DoD): nenhuma fase fecha sem testes.
- Pirâmide: muitos testes unitários, menos testes de integração, poucos testes E2E.
- Todo fluxo crítico de negócio tem teste E2E.
- Testes rodam no CI (GitHub Actions) a cada push/PR.

## Ferramentas
- **Jest + ts-jest** — testes unitários (lógica pura, serviços, helpers).
- **React Testing Library** — testes de componentes e páginas.
- **MSW (Mock Service Worker)** — mock de APIs em testes de componentes/integração.
- **Prisma test** — banco de teste isolado (SQLite/Postgres de teste) com factories.
- **Playwright** — testes E2E e de responsividade (FASE 3) em navegadores reais.
- **Lighthouse (CI)** — métricas de performance básicas.

## Níveis de teste
### Unitários
- Lógica pura: `normalize()`, `haversineDistanceKm()`, `calculateMatchScore()`,
  máquina de estados do booking, validações (preço/raio/duração).
- Helpers de auth: hash de senha, rate limit.

### Integração (API routes)
- Cadastro, login, verificação de email, forgot-password.
- CRUD de perfil do músico (incluindo autorização de posse / IDOR).
- Busca: resolução de skills, sinônimos, fuzzy, filtros, ordenação.
- Booking: criação, transições válidas/inválidas, conflito de agenda.
- Pagamento: criação, webhook, liberação de repasse, permissões.
- Disponibilidade: criação, bloqueio, conflito, remoção.

### E2E (Playwright) — fluxos críticos
1. **Fluxo principal (ponta a ponta):**
   Cliente cadastra → busca "piano" → filtra → abre perfil → cria evento
   → solicita contratação → músico aceita → cliente confirma → paga
   → evento concluído → avaliação mútua.
2. **Fluxo de músico:** cadastro → onboarding do perfil (skills múltiplas,
   mídia, preços, agenda) → recebe solicitação → aceita → agenda bloqueada
   para o horário.
3. **Fluxo de segurança:** usuário comum tenta editar perfil alheio (403),
   cliente tenta aceitar booking de músico (403), acesso a rota admin (403).
4. **Responsividade (FASE 3):** telas principais em smartphone pequeno,
   smartphone grande, tablet, notebook e desktop (Playwright devices).

## Testes de segurança (AGENT-SECURITY)
- IDOR: usuário não pode acessar/alterar recursos de outros.
- Roles: CLIENT/MUSICIAN/ADMIN restritos às suas ações.
- Rate limiting: excesso de tentativas de login/cadastro bloqueado (429).
- Upload: MIME e tamanho inválidos rejeitados.
- Secrets: nenhum secret em respostas de API ou no frontend.

## Testes de performance (básicos)
- Lighthouse: performance ≥ 90, acessibilidade ≥ 90 nas páginas principais.
- Busca: resposta < 500ms com catálogo de 1.000 músicos (índices GIN).

## Cobertura (metas)
- Unit/integração: ≥ 70% global.
- Fluxos críticos (auth, busca, booking, pagamento): 100% de cobertura dos
  caminhos principais e de erro.
- Caminhos de erro sempre testados (4xx/5xx).

## CI (GitHub Actions — já configurado)
- Job `test`: `npm run test -- --ci` roda a cada push/PR.
- Job `build`: roda após lint + typecheck + test (dependência entre jobs).
- E2E (Playwright) roda em PRs e antes de deploy em produção.

## Dados de teste
- **Factories:** funções que criam User, Musician, Skill, Booking, Payment
  com defaults válidos (evita repetição e dados inconsistentes).
- **Seed de teste:** catálogo de skills + músicos fictícios (10+ perfis com
  habilidades, avaliações e disponibilidade variadas).
- **Banco de teste:** reset automático antes de cada suíte.

## Fora do escopo inicial
- Testes de carga com milhares de usuários simultâneos (adiado).
- Property-based testing (adiado).
- Testes visuais com snapshot de pixels (adiado).
