-- ============================================================
-- Checklist da Frota — primeiros dados
-- Rode DEPOIS de criar os usuários no painel (Authentication → Users).
-- Troque os e-mails e os dados do caminhão pelos seus.
-- ============================================================

-- 1. Você vira adm. Troque o e-mail e o nome.
update perfis
   set papel = 'adm',
       nome  = 'Bryan'
 where id = (select id from auth.users where email = 'SEU-EMAIL@exemplo.com');

-- 2. Ajuste o nome e a equipe do motorista de teste.
update perfis
   set nome   = 'José Ferreira',
       equipe = 'Equipe 04'
 where id = (select id from auth.users where email = 'MOTORISTA@exemplo.com');

-- 3. Cadastre o primeiro caminhão já vinculado a esse motorista.
insert into veiculos (placa, modelo, tipo, ano, chassi, equipe, motorista_id, km, licenciamento, proxima_revisao)
values (
  'FQK7C42',
  'VW Constellation 17-230',
  'Caçamba',
  2019,
  '…9K2841',
  'Equipe 04',
  (select id from auth.users where email = 'MOTORISTA@exemplo.com'),
  184320,
  '2026-11-30',
  '2026-10-08'
)
on conflict (placa) do nothing;

-- 4. Confira como ficou.
select p.nome, p.papel, p.equipe, v.placa, v.modelo
  from perfis p
  left join veiculos v on v.motorista_id = p.id
 order by p.papel, p.nome;
