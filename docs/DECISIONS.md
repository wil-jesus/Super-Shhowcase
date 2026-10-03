# DECISIONS — SHOWCASE

**Fase:** 2 | **Agente:** AGENT-ARCHITECT

## ADR-001 — Monólito modular
- **Data:** 2026-08-23
- **Contexto:** Projeto novo, escopo amplo, equipe pequena.
- **Problema:** Evitar complexidade desnecessária no início.
- **Alternativas:** Microserviços, monólito único simples.
- **Decisão:** Monólito modular com camadas claras.
- **Motivo:** Simplicidade, facilidade de manutenção, evolução progressiva.
- **Impacto:** Menos infraestrutura; extração de serviços possível depois.
- **Fase:** 2 | **Agente:** AGENT-ARCHITECT

## ADR-002 — Stack Next.js + PostgreSQL
- **Data:** 2026-08-23
- **Contexto:** Necessidade de responsividade, SSR, geolocalização e matching.
- **Problema:** Escolher stack que cubra frontend, backend e banco.
- **Alternativas:** React+Vite+Node, Vue+Nuxt, Python FastAPI.
- **Decisão:** Next.js (App Router) + TypeScript + PostgreSQL/Neon + Prisma, com Haversine no app para geolocalização.
- **Motivo:** Stack unificada, responsiva, forte em SSR e escalável.
- **Impacto:** Base sólida para app nativa/híbrida futura via API.
- **Fase:** 2 | **Agente:** AGENT-ARCHITECT

## ADR-003 — Matching determinístico no MVP
- **Data:** 2026-08-23
- **Contexto:** Busca inteligente é o coração do produto.
- **Problema:** Não depender de IA para o funcionamento básico.
- **Alternativas:** IA desde o início, matching por regras.
- **Decisão:** Regras determinísticas + dados estruturados no MVP; arquitetura preparada para IA futura.
- **Motivo:** Confiabilidade, previsibilidade, custo; IA entra depois.
- **Impacto:** Catálogo de skills extensível, ranking por fatores ponderados.
- **Fase:** 2 | **Agente:** AGENT-ARCHITECT

## ADR-004 — Pagamento em escrow
- **Data:** 2026-08-23
- **Contexto:** Contratação financeira entre cliente e músico.
- **Problema:** Garantir segurança para ambas as partes.
- **Alternativas:** Pagamento direto, pagamento via plataforma.
- **Decisão:** Escrow via Stripe: cliente → plataforma → repasse após evento concluído.
- **Motivo:** Protege cliente e músico; permite taxas, reembolso e disputa.
- **Impacto:** Fluxo financeiro revisado pelo AGENT-SECURITY.
- **Fase:** 2 | **Agente:** AGENT-PAYMENT + AGENT-SECURITY
## ADR-005 — Busca com fuzzy matching
- **Data:** 2026-08-23
- **Contexto:** Busca precisa tolerar erros de digitação e variações.
- **Problema:** PostgreSQL full-text não resolve "bateia" → "bateria".
- **Alternativas:** Apenas full-text; fuzzy via pg_trgm; IA desde o início.
- **Decisão:** Normalização de texto + pg_trgm + catálogo de sinônimos.
- **Motivo:** Custo baixo, determinístico, cobre o MVP.
- **Impacto:** Busca robusta sem depender de IA.
- **Fase:** 2/6 | **Agente:** AGENT-SEARCH

## ADR-006 — Privacidade de localização
- **Data:** 2026-08-23
- **Contexto:** Não expor localização exata do músico.
- **Problema:** Expor ponto exato viola privacidade (item 46).
- **Alternativas:** Expor ponto exato; expor área aproximada + distância.
- **Decisão:** Músico armazena localização aproximada + raio; expõe só distância.
- **Motivo:** Segurança e privacidade do profissional.
- **Impacto:** Matching usa distância calculada, nunca o ponto exato.
- **Fase:** 2/6 | **Agente:** AGENT-SECURITY + AGENT-SEARCH

## ADR-007 — Separação EVENT / BOOKING
- **Data:** 2026-08-23
- **Contexto:** Estados de contratação se confundiam entre EVENT e BOOKING.
- **Problema:** Duplicação de estados e responsabilidades.
- **Alternativas:** Unificar em uma entidade; separar.
- **Decisão:** EVENT carrega dados do evento; BOOKING carrega o estado da contratação.
- **Motivo:** Clareza de responsabilidade, evita duplicação.
- **Impacto:** Modelo de dados mais limpo.
- **Fase:** 2/7 | **Agente:** AGENT-ARCHITECT

## ADR-008 — Isolamento do módulo de matching
- **Data:** 2026-08-23
- **Contexto:** Ranking por fatores ponderados tende a crescer em complexidade.
- **Problema:** Evolução do algoritmo (inclusive IA) não deve refatorar o sistema.
- **Alternativas:** Lógica espalhada; módulo/interface isolada.
- **Decisão:** Matching em módulo próprio com interface clara.
- **Motivo:** Evolução futura (IA) sem impacto no restante.
- **Impacto:** Troca de algoritmo é plugável.
- **Fase:** 2/6 | **Agente:** AGENT-SEARCH

## ADR-009 — Camada de observabilidade
- **Data:** 2026-08-23
- **Contexto:** Prompt exige logs, métricas e health checks (item 32).
- **Problema:** FASE 2 não detalhava observabilidade.
- **Alternativas:** Adiar; incluir desde a fundação.
- **Decisão:** Logs estruturados + health check + métricas + monitoramento de erros.
- **Motivo:** Erros críticos rastreáveis desde o início.
- **Impacto:** Base pronta para produção.
- **Fase:** 2/13 | **Agente:** AGENT-DEVOPS

## ADR-010 — Autorização de posse (correção IDOR)
- **Data:** 2026-08-24
- **Contexto:** Qualquer usuário com role MUSICIAN podia editar o perfil de outro músico.
- **Problema:** Vulnerabilidade IDOR (Insecure Direct Object Reference).
- **Alternativas:** Confiar no client; verificar posse no servidor.
- **Decisão:** Todo endpoint de escrita exige `session.user.id === recurso.userId` ou role ADMIN.
- **Motivo:** Segurança básica de controle de acesso.
- **Impacto:** Usuário só altera recursos próprios.
- **Fase:** 5 | **Agente:** AGENT-SECURITY + AGENT-MUSICIAN

## ADR-011 — Upload de mídia validado
- **Data:** 2026-08-24
- **Contexto:** Músico cadastra foto, vídeo e áudio no perfil.
- **Problema:** Upload sem validação permite arquivos maliciosos ou excessivos.
- **Alternativas:** Sem validação; validação de MIME + tamanho; análise de conteúdo.
- **Decisão:** Validação de tipo MIME e limites (5MB imagem, 100MB vídeo, 20MB áudio) + autorização de posse.
- **Motivo:** Previne uploads indevidos e abuso de armazenamento.
- **Impacto:** Storage físico real entra na FASE 13 (Deploy).
- **Fase:** 5/13 | **Agente:** AGENT-SECURITY + AGENT-MUSICIAN

## ADR-012 — Máquina de estados do Booking
- **Data:** 2026-08-24
- **Contexto:** Estados de contratação poderiam ser alterados sem controle.
- **Problema:** Transições inválidas e ações de papel errado.
- **Alternativas:** Sem validação; transições livres; máquina de estados explícita.
- **Decisão:** Mapa de transições por estado + autorização por papel (CLIENT/MUSICIAN/ADMIN).
- **Motivo:** Garante fluxo correto (REQUESTED → ... → COMPLETED) e impede pulos.
- **Impacto:** API rejeita transições inválidas com erro claro.
- **Fase:** 7 | **Agente:** AGENT-EVENT

## ADR-013 — Prevenção de conflito de agenda
- **Data:** 2026-08-24
- **Contexto:** Músico não pode aceitar dois eventos no mesmo horário.
- **Problema:** Dupla reserva e conflitos de agenda.
- **Alternativas:** Confiar no músico; verificação em código; range types no banco.
- **Decisão:** Verificação de overlap em código (data + duração) na criação e no aceite do booking.
- **Motivo:** Simples, determinístico, cobre o MVP.
- **Impacto:** Evolução futura para range types/PostGIS documentada como TECH_DEBT.
- **Fase:** 7 | **Agente:** AGENT-EVENT