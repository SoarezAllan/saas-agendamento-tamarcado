# Guia de Publicação na Web - SaaS de Agendamento Multi-Negócio

Este guia detalha o passo a passo completo para colocar sua aplicação SaaS no ar na internet com banco de dados em produção e domínio personalizado.

---

## Opção 1: Vercel + Neon PostgreSQL (Recomendada - Grátis e Mais Rápida)

A **Vercel** é a plataforma nativa dos criadores do Next.js e oferece o melhor desempenho para a sua aplicação.

### 1. Criar Banco de Dados PostgreSQL Gratuito
1. Crie uma conta gratuita em [Neon.tech](https://neon.tech) ou [Supabase.com](https://supabase.com).
2. Crie um novo projeto e copie a connection string do PostgreSQL:
   ```
   postgresql://usuario:senha@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Atualizar o Prisma para PostgreSQL
No arquivo `prisma/schema.prisma`, altere a linha 2 de `sqlite` para `postgresql`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Enviar o Projeto para o GitHub
```bash
git add .
git commit -m "feat: preparar para deploy em producao"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/saas-agendamento.git
git push -u origin main
```

### 4. Conectar e Publicar na Vercel
1. Acesse [vercel.com](https://vercel.com) e clique em **Add New Project**.
2. Importe o repositório do GitHub.
3. Na seção **Environment Variables**, adicione as 3 variáveis obrigatórias:
   - `DATABASE_URL`: `postgresql://usuario:senha@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - `JWT_SECRET`: `gere_uma_chave_secreta_longa_e_aleatoria_aqui`
   - `NEXT_PUBLIC_APP_URL`: `https://seu-projeto.vercel.app` (ou seu domínio próprio)
4. Clique em **Deploy**.

### 5. Criar as Tabelas e Rodar o Seed em Produção
Após o primeiro deploy, execute localmente apontando para o banco do Neon (ou no terminal do banco):
```bash
# Sincroniza o schema do Prisma com o PostgreSQL da nuvem
npx prisma db push

# Popula o banco inicial com os dados e negócios de demonstração
npm run seed
```

Pronto! Seu SaaS estará 100% no ar com SSL HTTPS e alta disponibilidade.

---

## Opção 2: Railway ou Render (Fullstack com Banco de Dados Incluso)

### No Railway (railway.app):
1. Crie um projeto no **Railway**.
2. Adicione um **PostgreSQL** Database.
3. Adicione um **GitHub Repo** com seu código.
4. O Railway detectará o Next.js e gerará o link público automaticamente.
5. Em **Variables**, configure:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
   - `JWT_SECRET`: `sua_chave_secreta`
   - `NEXT_PUBLIC_APP_URL`: `https://${{RAILWAY_PUBLIC_DOMAIN}}`
6. No comando de build ou terminal: `npx prisma db push && npm run seed`.

---

## Opção 3: VPS / Servidor Próprio com Docker Compose

Se você possui um servidor Ubuntu (DigitalOcean, Hetzner, AWS, Linode, Hostinger):

1. Clone o repositório na sua máquina/VPS:
   ```bash
   git clone https://github.com/SEU_USUARIO/saas-agendamento.git
   cd saas-agendamento
   ```

2. Suba a aplicação e o banco PostgreSQL com Docker Compose:
   ```bash
   docker compose up -d --build
   ```

3. Execute as migrações e seed no container:
   ```bash
   docker compose exec app npx prisma db push
   docker compose exec app npm run seed
   ```

4. A aplicação estará rodando na porta `3000` (coloque Nginx/Caddy como proxy reverso com SSL Let's Encrypt).

---

## Checklist de Produção
- [x] Script `postinstall: prisma generate` configurado no `package.json` para builds na nuvem.
- [x] Otimização de imagens no `next.config.ts`.
- [x] Rotas de API e páginas testadas com `npm run build`.
- [x] Tokens JWT e cookies seguros configurados para `secure: true` em ambiente de produção.
