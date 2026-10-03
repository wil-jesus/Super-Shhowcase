# DATABASE — SHOWCASE

**Fase:** 2 | **Agente:** AGENT-ARCHITECT

## Banco
PostgreSQL compatível com Neon, sem dependência de PostGIS.

## Entidades principais
- USER — usuário base (email, senha, role, status)
- CLIENT — perfil de cliente (vinculado a USER)
- MUSICIAN — perfil profissional do músico
- SKILL — catálogo de habilidades/instrumentos (extensível, com sinônimos)
- MUSICIAN_SKILL — relação músico ↔ habilidade
- GENRE — estilos musicais
- EVENT — evento (cliente, local, data, duração, tipo, status)
- BOOKING — contratação/solicitação (estados do fluxo)
- AVAILABILITY — disponibilidade/agenda do músico
- REVIEW — avaliação (estrelas, comentário, evento relacionado)
- PAYMENT — pagamento (escrow)
- PAYOUT — repasse ao músico
- NOTIFICATION — notificação
- MESSAGE — mensagem (chat)
- REPORT — denúncia
- VERIFICATION — verificação de profissional
- ADMIN_ACTION — ação administrativa
- AUDIT_LOG — log de auditoria

## Estados do EVENT
DRAFT, REQUESTED, PENDING_MUSICIAN, ACCEPTED, REJECTED, CANCELLED,
CONFIRMED, IN_PROGRESS, COMPLETED, DISPUTED

## Geolocalização
- EVENT.locationLat/locationLng (coordenadas do evento)
- MUSICIAN.latitude/longitude + `serviceRadiusKm` (área aproximada)
- Cálculo de distância com Haversine em `src/lib/geo.ts`

## Regras
- Modelo validado pelo arquiteto (não criar tabelas sem necessidade)
- Índices para busca full-text e geolocalização
- Migrations versionadas (Prisma)