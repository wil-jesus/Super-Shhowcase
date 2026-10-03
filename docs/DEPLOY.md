# Deploy — Vercel + Neon

## Pré-requisitos

- Conta na Vercel, Neon, Stripe, Resend e UploadThing.
- Node.js instalado.
- Repositório conectado à Vercel ou acesso ao projeto pelo CLI.
- Banco Neon criado com uma connection string PostgreSQL.

## Checklist de deploy

### 1. Criar o projeto Neon

Crie o projeto e o branch de produção no Neon. Copie a connection string PostgreSQL para usar como `DATABASE_URL`.

A aplicação usa Neon sem PostGIS: mantém a localização do músico de forma aproximada e calcula a distância com Haversine em `src/lib/geo.ts`.

### 2. Autenticar e vincular a Vercel

Instale a CLI, autentique e vincule a pasta do projeto:

```bash
npm i -g vercel
vercel login
vercel link
```

No PowerShell, execute os comandos separadamente. O arquivo [vercel.json](../vercel.json) define o build Next.js e a região `gru1`.

### 3. Configurar variáveis na Vercel

No painel da Vercel, abra **Settings → Environment Variables** e cadastre as variáveis para os ambientes necessários, principalmente **Production**:

```text
DATABASE_URL=postgresql://...       # connection string do Neon
NEXTAUTH_SECRET=...                 # openssl rand -base64 32
NEXTAUTH_URL=https://seu-dominio.vercel.app
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
RESEND_API_KEY=re_...
UPLOADTHING_SECRET=sk_...
UPLOADTHING_APP_ID=...
```

Nunca versione valores reais. O arquivo `.env` está ignorado pelo Git; use `.env.example` como referência local.

Para gerar o segredo de sessão:

```bash
openssl rand -base64 32
```

No Windows, caso `openssl` não esteja instalado, gere um valor aleatório forte por outro gerador confiável e mantenha-o apenas na Vercel.

Os aliases usados em [vercel.json](../vercel.json) precisam corresponder aos secrets/variáveis configurados na conta Vercel quando essa forma de referência for usada.

### 4. Aplicar a migration no Neon

Com `DATABASE_URL` apontando para o Neon de produção, execute:

```bash
npx prisma migrate deploy
```

### 5. Configurar o webhook Stripe

Na dashboard do Stripe, abra **Developers → Webhooks → Add endpoint** e use:

```text
https://seu-dominio.vercel.app/api/payments/webhook
```

Habilite `payment_intent.succeeded`, `payment_intent.payment_failed` e `charge.refunded`. Copie o `whsec_...` para `STRIPE_WEBHOOK_SECRET` na Vercel.

### 6. Publicar em produção

```bash
vercel --prod
```

Após receber o domínio definitivo, atualize `NEXTAUTH_URL` se necessário e faça um novo deploy.

### 7. Testar o fluxo completo

Valide no domínio publicado:

```text
cadastro → login → busca → booking → pagamento
```

Também confirme upload de foto, notificações de erro, logs da Vercel, webhook Stripe e domínio configurado no UploadThing.
