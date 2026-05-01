# TutorIA Web V24 — Guia de Instalação

## Pré-requisitos
- Node.js 18+
- Python 3.11+
- Conta no Supabase (gratuita em supabase.com)
- Conta no Vercel (gratuita em vercel.com)

---

## PASSO 1 — Configurar o Supabase

1. Acesse https://supabase.com e crie um projeto novo
   - Nome: `tutor-ia-web`
   - Senha: anote bem (usada para o banco)
   - Região: South America (São Paulo)

2. No painel do Supabase, vá em **SQL Editor** e execute:
   - `supabase/01_schema.sql`  ← cria tabelas, RLS, triggers
   - `supabase/02_seed.sql`    ← insere os 21 módulos

3. Crie seu usuário admin:
   - Vá em **Authentication > Users > Add user**
   - Email: fgrodrigues74@gmail.com | Senha: (escolha uma forte)
   - Copie o UUID gerado

4. No SQL Editor, rode:
   ```sql
   insert into public.usuarios (id, nome, email, role)
   values ('SEU-UUID-AQUI', 'Fabiano Rodrigues', 'fgrodrigues74@gmail.com', 'admin');
   ```

5. Anote as chaves em **Project Settings > API**:
   - `SUPABASE_URL`
   - `anon key`  (pública)
   - `service_role key`  (secreta — só no backend!)

---

## PASSO 2 — Backend (FastAPI)

```bash
cd backend

# Criar ambiente virtual
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis
copy .env.example .env
# Edite .env com suas chaves do Supabase

# Rodar
python main.py
# API disponível em: http://localhost:8000
# Documentação em:   http://localhost:8000/docs
```

---

## PASSO 3 — Frontend (React)

```bash
cd frontend

# Criar projeto Vite + React + TypeScript (primeira vez)
npm create vite@latest . -- --template react-ts
npm install

# Instalar dependências extras
npm install react-router-dom @tanstack/react-query zustand lucide-react recharts

# Copiar os arquivos gerados para as pastas corretas:
# src/contexts/AuthContext.tsx
# src/components/ProtectedRoute.tsx
# src/pages/Login.tsx
# src/App.tsx

# Configurar variável de ambiente
echo "VITE_API_URL=http://localhost:8000" > .env.local

# Rodar
npm run dev
# Frontend em: http://localhost:5173
```

---

## PASSO 4 — Testar o login

1. Acesse http://localhost:5173
2. Use o email e senha criados no Supabase
3. Você deve ver o dashboard com os módulos

---

## PASSO 5 — Deploy (produção)

### Backend no Railway:
```bash
# Instalar Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
# Configure as variáveis de ambiente no painel do Railway
```

### Frontend no Vercel:
```bash
npm install -g vercel
cd frontend
vercel
# Siga o assistente e configure VITE_API_URL com a URL do Railway
```

---

## Estrutura do projeto

```
tutor-ia-web/
├── backend/
│   ├── main.py            ← API FastAPI completa
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── contexts/
│       │   └── AuthContext.tsx    ← estado global de auth
│       ├── components/
│       │   └── ProtectedRoute.tsx ← guarda de rotas
│       ├── pages/
│       │   └── Login.tsx          ← tela de login
│       └── App.tsx                ← roteamento principal
├── supabase/
│   ├── 01_schema.sql      ← tabelas + RLS
│   └── 02_seed.sql        ← 21 módulos
└── README.md
```

---

## Próximos passos (Fase 2)

- [ ] Sidebar + layout principal
- [ ] Dashboard com KPIs e gráficos
- [ ] Módulo Financeiro com dados reais
- [ ] Painel admin de usuários e permissões
