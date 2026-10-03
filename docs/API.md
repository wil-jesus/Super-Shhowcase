# API — SHOWCASE

**Fase:** 2 | **Agente:** AGENT-ARCHITECT

## Padrão
REST, JSON, autenticação via JWT/sessão (Auth.js).

## Endpoints principais (MVP)
### Auth
- POST /api/auth/register — cadastro
- POST /api/auth/login — login
- POST /api/auth/logout — logout
- POST /api/auth/forgot-password — recuperação
- GET /api/auth/verify-email — verificação

### Músicos
- GET /api/musicians — listar (com filtros)
- GET /api/musicians/:id — detalhe do perfil
- PUT /api/musicians/:id — atualizar perfil
- GET /api/skills — catálogo de habilidades

### Busca/Matching
- GET /api/search?q=&lat=&lng=&date= — busca com matching

### Eventos
- POST /api/events — criar evento
- GET /api/events/:id — detalhe
- PATCH /api/events/:id — atualizar
- POST /api/events/:id/book — solicitar contratação

### Contratação (Booking)
- GET /api/bookings — listar
- PATCH /api/bookings/:id — aceitar/recusar/confirmar

### Pagamentos
- POST /api/payments — iniciar pagamento (escrow)
- GET /api/payments/:id — status

### Avaliações
- POST /api/reviews — avaliar
- GET /api/musicians/:id/reviews — listar avaliações

### Admin
- GET /api/admin/users — listar usuários
- PATCH /api/admin/users/:id — bloquear/suspender
- GET /api/admin/metrics — métricas

## Segurança
- Proteção de rotas por role (CLIENT / MUSICIAN / ADMIN)
- Rate limiting em endpoints públicos
- Validação de entrada em todas as APIs