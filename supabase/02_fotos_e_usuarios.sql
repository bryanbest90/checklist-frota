-- ============================================================
-- Checklist da Frota — fotos (Storage) e criação de perfis
-- Rode este arquivo inteiro no SQL Editor, depois do 01_schema.sql.
-- ============================================================

-- ------------------------------------------------------------
-- 1. O BUCKET DAS FOTOS
-- ------------------------------------------------------------
-- public = false: ninguém abre a foto por link direto.
-- O app pede um link temporário quando precisa mostrar a imagem.
insert into storage.buckets (id, name, public)
values ('checklist-fotos', 'checklist-fotos', false)
on conflict (id) do nothing;

-- Caminho combinado para cada arquivo:
--   PLACA/ID-DO-CHECKLIST/parte.jpg      ex.: FQK7C42/8f3a.../pneus_tras.jpg
-- A primeira pasta ser a placa é o que permite as regras abaixo:
-- elas leem a placa do caminho e conferem de quem é o caminhão.

drop policy if exists "envia foto do proprio caminhao" on storage.objects;
create policy "envia foto do proprio caminhao" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'checklist-fotos'
    and (
      public.eh_adm()
      or exists (
        select 1 from veiculos v
        where v.placa = (storage.foldername(name))[1]
          and v.motorista_id = auth.uid()
      )
    )
  );

drop policy if exists "le foto do proprio caminhao" on storage.objects;
create policy "le foto do proprio caminhao" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'checklist-fotos'
    and (
      public.eh_adm()
      or exists (
        select 1 from veiculos v
        where v.placa = (storage.foldername(name))[1]
          and v.motorista_id = auth.uid()
      )
    )
  );

-- Apagar foto: só o adm. A foto é a prova do problema.
drop policy if exists "adm apaga foto" on storage.objects;
create policy "adm apaga foto" on storage.objects
  for delete to authenticated
  using (bucket_id = 'checklist-fotos' and public.eh_adm());

-- ------------------------------------------------------------
-- 2. PERFIL AUTOMÁTICO
-- ------------------------------------------------------------
-- Todo usuário criado no Auth ganha uma linha em perfis na mesma hora.
-- Sem isso, você teria que lembrar de criar o perfil na mão a cada
-- motorista novo — e um usuário sem perfil não enxerga absolutamente nada.
create or replace function public.novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into perfis (id, nome, papel, equipe)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'papel', 'motorista'),
    new.raw_user_meta_data->>'equipe'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_novo_usuario on auth.users;
create trigger trg_novo_usuario
  after insert on auth.users
  for each row execute function public.novo_usuario();

-- Para quem já foi criado antes deste gatilho existir:
insert into perfis (id, nome, papel)
select u.id, split_part(u.email, '@', 1), 'motorista'
from auth.users u
where not exists (select 1 from perfis p where p.id = u.id);
