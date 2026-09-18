-- ============================================================
-- Checklist da Frota — estrutura do banco
-- Rode este arquivo inteiro de uma vez no SQL Editor do Supabase.
-- Pode rodar de novo sem medo: tudo é "if not exists" / "or replace".
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABELAS
-- ------------------------------------------------------------

-- Quem é quem. O id é o mesmo do usuário criado no Auth:
-- é isso que liga o login do motorista aos dados dele.
create table if not exists perfis (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null,
  papel      text not null default 'motorista' check (papel in ('motorista','adm')),
  equipe     text,
  criado_em  timestamptz not null default now()
);

-- A frota. A placa é a chave: é assim que todo mundo se refere ao caminhão.
create table if not exists veiculos (
  placa            text primary key,
  modelo           text not null,
  tipo             text,
  ano              int,
  chassi           text,
  equipe           text,
  motorista_id     uuid references perfis(id) on delete set null,
  km               int not null default 0,
  licenciamento    date,
  proxima_revisao  date,
  ativo            boolean not null default true,
  criado_em        timestamptz not null default now()
);

-- Cada checklist finalizado vira uma linha aqui.
create table if not exists checklists (
  id            uuid primary key default gen_random_uuid(),
  placa         text not null references veiculos(placa) on update cascade,
  motorista_id  uuid not null references perfis(id),
  km            int,
  conformes     int not null default 0,
  atencao       int not null default 0,
  criticos      int not null default 0,
  criado_em     timestamptz not null default now()
);

-- Os problemas encontrados. Uma linha por parte com defeito.
create table if not exists ocorrencias (
  id             uuid primary key default gen_random_uuid(),
  checklist_id   uuid references checklists(id) on delete cascade,
  placa          text not null references veiculos(placa) on update cascade,
  parte          text not null,
  gravidade      text not null check (gravidade in ('atencao','critico')),
  observacao     text,
  foto_path      text,
  status         text not null default 'aberta' check (status in ('aberta','manutencao','resolvida')),
  criado_em      timestamptz not null default now(),
  resolvido_em   timestamptz,
  resolvido_por  uuid references perfis(id)
);

-- Índices: o banco usa para achar rápido o que as telas mais pedem.
create index if not exists idx_veiculos_motorista   on veiculos(motorista_id);
create index if not exists idx_checklists_placa     on checklists(placa, criado_em desc);
create index if not exists idx_ocorrencias_placa    on ocorrencias(placa, status);
create index if not exists idx_ocorrencias_abertas  on ocorrencias(status) where status <> 'resolvida';

-- ------------------------------------------------------------
-- 2. FUNÇÃO AUXILIAR
-- ------------------------------------------------------------
-- Responde "quem está logado é adm?".
-- security definer faz a consulta rodar por fora do RLS — sem isso,
-- uma regra da tabela perfis que consulta perfis entra em loop infinito.
create or replace function public.eh_adm()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from perfis where id = auth.uid() and papel = 'adm');
$$;

-- ------------------------------------------------------------
-- 3. LIGAR O RLS
-- ------------------------------------------------------------
-- A partir daqui, nenhuma linha é visível por padrão.
-- Só passa o que as políticas abaixo liberarem, explicitamente.
alter table perfis      enable row level security;
alter table veiculos    enable row level security;
alter table checklists  enable row level security;
alter table ocorrencias enable row level security;

-- ------------------------------------------------------------
-- 4. POLÍTICAS
-- ------------------------------------------------------------

-- PERFIS ------------------------------------------------------
drop policy if exists "perfil proprio ou adm" on perfis;
create policy "perfil proprio ou adm" on perfis
  for select to authenticated
  using (id = auth.uid() or public.eh_adm());

drop policy if exists "adm gerencia perfis" on perfis;
create policy "adm gerencia perfis" on perfis
  for all to authenticated
  using (public.eh_adm())
  with check (public.eh_adm());

-- VEICULOS ----------------------------------------------------
-- O motorista enxerga apenas o caminhão vinculado a ele.
drop policy if exists "ve o proprio caminhao" on veiculos;
create policy "ve o proprio caminhao" on veiculos
  for select to authenticated
  using (motorista_id = auth.uid() or public.eh_adm());

-- Cadastrar, editar e excluir caminhão é só do adm.
drop policy if exists "adm gerencia frota" on veiculos;
create policy "adm gerencia frota" on veiculos
  for all to authenticated
  using (public.eh_adm())
  with check (public.eh_adm());

-- CHECKLISTS --------------------------------------------------
drop policy if exists "le os proprios checklists" on checklists;
create policy "le os proprios checklists" on checklists
  for select to authenticated
  using (motorista_id = auth.uid() or public.eh_adm());

-- Só dá para criar checklist em nome de si mesmo, e só do próprio caminhão.
drop policy if exists "cria checklist do proprio caminhao" on checklists;
create policy "cria checklist do proprio caminhao" on checklists
  for insert to authenticated
  with check (
    motorista_id = auth.uid()
    and exists (
      select 1 from veiculos v
      where v.placa = checklists.placa and v.motorista_id = auth.uid()
    )
  );

-- Checklist assinado não se edita nem se apaga: é registro histórico.
-- (Nenhuma política de update/delete = ninguém altera, nem o adm pelo app.)

-- OCORRENCIAS -------------------------------------------------
drop policy if exists "le ocorrencias do proprio caminhao" on ocorrencias;
create policy "le ocorrencias do proprio caminhao" on ocorrencias
  for select to authenticated
  using (
    public.eh_adm()
    or exists (
      select 1 from veiculos v
      where v.placa = ocorrencias.placa and v.motorista_id = auth.uid()
    )
  );

drop policy if exists "abre ocorrencia pelo proprio checklist" on ocorrencias;
create policy "abre ocorrencia pelo proprio checklist" on ocorrencias
  for insert to authenticated
  with check (
    exists (
      select 1 from checklists c
      where c.id = ocorrencias.checklist_id and c.motorista_id = auth.uid()
    )
  );

-- Mudar status (manutenção / resolvida) é decisão do adm.
drop policy if exists "adm trata ocorrencia" on ocorrencias;
create policy "adm trata ocorrencia" on ocorrencias
  for update to authenticated
  using (public.eh_adm())
  with check (public.eh_adm());

-- ------------------------------------------------------------
-- 5. AUTOMAÇÃO
-- ------------------------------------------------------------
-- Ao finalizar um checklist, o odômetro do caminhão se atualiza sozinho
-- (só para frente — km digitado errado, menor que o atual, é ignorado).
create or replace function public.atualiza_km()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update veiculos
     set km = new.km
   where placa = new.placa
     and new.km is not null
     and new.km > km;
  return new;
end;
$$;

drop trigger if exists trg_atualiza_km on checklists;
create trigger trg_atualiza_km
  after insert on checklists
  for each row execute function public.atualiza_km();
