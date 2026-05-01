-- ============================================================
-- TutorIA Web V24 — Schema Supabase
-- Execute no SQL Editor do Supabase na ordem dos arquivos
-- ============================================================

-- 1. EXTENSÕES
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. TABELA DE USUÁRIOS (complementa auth.users do Supabase)
create table public.usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  email       text not null unique,
  telefone    text,
  avatar_url  text,
  role        text not null default 'operador'
                check (role in ('admin','gestor','operador','visualizador')),
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3. MÓDULOS DO SISTEMA
create table public.modulos (
  id          serial primary key,
  slug        text not null unique,
  nome        text not null,
  descricao   text,
  icone       text,
  ordem       int not null default 99,
  status      text not null default 'vazio'
                check (status in ('completo','parcial','vazio','bloqueado')),
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- 4. PERMISSÕES: usuário × módulo
create table public.permissoes (
  id          serial primary key,
  usuario_id  uuid not null references public.usuarios(id) on delete cascade,
  modulo_slug text not null references public.modulos(slug) on delete cascade,
  nivel       text not null default 'leitura'
                check (nivel in ('leitura','escrita','admin')),
  created_at  timestamptz not null default now(),
  unique (usuario_id, modulo_slug)
);

-- 5. LOG DE ACESSOS
create table public.log_acessos (
  id          bigserial primary key,
  usuario_id  uuid references public.usuarios(id) on delete set null,
  modulo_slug text,
  acao        text,
  ip          text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- 6. SESSÕES DE CHAT (histórico IA)
create table public.chat_historico (
  id          bigserial primary key,
  usuario_id  uuid not null references public.usuarios(id) on delete cascade,
  modulo_slug text,
  role        text not null check (role in ('user','assistant')),
  conteudo    text not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index on public.permissoes(usuario_id);
create index on public.permissoes(modulo_slug);
create index on public.log_acessos(usuario_id);
create index on public.log_acessos(created_at desc);
create index on public.chat_historico(usuario_id, created_at desc);

-- ============================================================
-- UPDATED_AT automático
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_usuarios_updated_at
  before update on public.usuarios
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.usuarios     enable row level security;
alter table public.modulos      enable row level security;
alter table public.permissoes   enable row level security;
alter table public.log_acessos  enable row level security;
alter table public.chat_historico enable row level security;

-- Usuários: cada um vê/edita só o próprio perfil; admin vê todos
create policy "usuario_select_own" on public.usuarios
  for select using (auth.uid() = id);

create policy "usuario_select_admin" on public.usuarios
  for select using (
    exists (select 1 from public.usuarios u where u.id = auth.uid() and u.role = 'admin')
  );

create policy "usuario_update_own" on public.usuarios
  for update using (auth.uid() = id);

-- Módulos: todos logados podem ver
create policy "modulos_select_all" on public.modulos
  for select using (auth.role() = 'authenticated');

-- Permissões: usuário vê as próprias; admin vê todas
create policy "perm_select_own" on public.permissoes
  for select using (usuario_id = auth.uid());

create policy "perm_select_admin" on public.permissoes
  for all using (
    exists (select 1 from public.usuarios u where u.id = auth.uid() and u.role = 'admin')
  );

-- Chat: cada usuário vê o próprio
create policy "chat_select_own" on public.chat_historico
  for all using (usuario_id = auth.uid());

-- Log: apenas admin lê
create policy "log_admin_only" on public.log_acessos
  for select using (
    exists (select 1 from public.usuarios u where u.id = auth.uid() and u.role = 'admin')
  );
