# SECURITY — SHOWCASE

**Fase:** 2 | **Agente:** AGENT-SECURITY (transversal)

## Princípios
- Nenhum secret no código (variáveis de ambiente / .env)
- Nenhum secret commitado no Git
- Autenticação e autorização por role
- Rate limiting contra abuso/spam
- Validação contra injeção, XSS, CSRF

## Áreas auditadas
- Autenticação e sessões
- Controle de acesso (roles)
- APIs e validação de entrada
- Banco (SQL injection, dados sensíveis)
- Upload de arquivos (fotos, vídeos, áudio)
- Pagamentos (escrow, disputas)
- Exposição de localização (privacidade)
- Dados pessoais (LGPD)
- Logs e auditoria

## Privacidade
- Não expor endereço residencial, telefone/email pessoal, localização exata desnecessária
- Localização do evento e do músico usadas apenas para o propósito necessário
- Dados financeiros protegidos

## Revisão
- Toda implementação financeira revisada pelo AGENT-SECURITY
- REVIEWER-SECURITY revisa transversalmente todo o sistema