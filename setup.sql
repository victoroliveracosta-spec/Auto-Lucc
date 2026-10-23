-- AUTO LUCC / Banco de dados no Supabase
-- Execute este arquivo no SQL Editor do seu projeto Supabase.
-- Não cole credenciais nem senhas neste arquivo.

create extension if not exists pgcrypto;

-- Lista de usuários que podem administrar lavagens. Inserida somente pelo proprietário no painel SQL.
create table if not exists public.auto_lucc_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.auto_lucc_admins enable row level security;
revoke all on public.auto_lucc_admins from anon, authenticated;
grant select on public.auto_lucc_admins to authenticated;
drop policy if exists "admins_view_self" on public.auto_lucc_admins;
create policy "admins_view_self" on public.auto_lucc_admins
 for select to authenticated using (user_id = (select auth.uid()));

-- Cada cliente recebe um código aleatório de 80 bits: AL- + 20 caracteres hexadecimais.
create table if not exists public.auto_lucc_lavagens (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('AL-' || upper(encode(gen_random_bytes(10),'hex'))),
  vehicle text not null check (char_length(vehicle) between 1 and 80),
  status text not null default 'Aguardando'
    check (status in ('Aguardando','Em lavagem','Finalização','Pronto para retirada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.auto_lucc_lavagens enable row level security;
revoke all on public.auto_lucc_lavagens from anon, authenticated;
grant select, insert, update on public.auto_lucc_lavagens to authenticated;

drop policy if exists "staff_select" on public.auto_lucc_lavagens;
create policy "staff_select" on public.auto_lucc_lavagens
 for select to authenticated using (
  exists (select 1 from public.auto_lucc_admins a where a.user_id = (select auth.uid()))
 );
drop policy if exists "staff_insert" on public.auto_lucc_lavagens;
create policy "staff_insert" on public.auto_lucc_lavagens
 for insert to authenticated with check (
  exists (select 1 from public.auto_lucc_admins a where a.user_id = (select auth.uid()))
 );
drop policy if exists "staff_update" on public.auto_lucc_lavagens;
create policy "staff_update" on public.auto_lucc_lavagens
 for update to authenticated using (
  exists (select 1 from public.auto_lucc_admins a where a.user_id = (select auth.uid()))
 ) with check (
  exists (select 1 from public.auto_lucc_admins a where a.user_id = (select auth.uid()))
 );

-- Atualiza o relógio sempre que o status for editado.
create or replace function public.auto_lucc_tocar_atualizacao()
returns trigger language plpgsql set search_path='' as $$
begin
  new.updated_at := now();
  -- Não permitir troca do código ou do ID em operações de atualização.
  new.id := old.id;
  new.code := old.code;
  return new;
end; $$;
drop trigger if exists auto_lucc_atualizado_em on public.auto_lucc_lavagens;
create trigger auto_lucc_atualizado_em
before update on public.auto_lucc_lavagens
for each row execute function public.auto_lucc_tocar_atualizacao();

-- Consulta pública SEGURA: retorna somente o status e a data pelo código aleatório.
-- NÃO publica nomes, placas, modelos, e não permite listar a tabela anonimamente.
create or replace function public.consultar_lavagem(codigo text)
returns table (etapa text, atualizado_em timestamptz)
language sql stable security definer set search_path = '' as $$
  select l.status as etapa, l.updated_at as atualizado_em
  from public.auto_lucc_lavagens l
  where l.code = upper(btrim(codigo))
  limit 1;
$$;
revoke all on function public.consultar_lavagem(text) from public, anon, authenticated;
grant execute on function public.consultar_lavagem(text) to anon, authenticated;

-- PASSO MANUAL APÓS CRIAR O ADMIN EM Authentication > Users:
-- Executar como uma consulta SQL separada, substituindo o UUID:
-- insert into public.auto_lucc_admins(user_id)
-- values ('COLE_AQUI_O_UUID_DO_USUARIO') on conflict do nothing;
