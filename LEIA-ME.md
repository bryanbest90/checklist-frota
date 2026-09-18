# Checklist da Frota — protótipo

App de checklist dos caminhões: tela de campo (celular do motorista) e página de controle (adm).
Tudo em um arquivo só, sem servidor, sem banco. Roda offline.

## Como abrir

Dê dois cliques em `index.html`. Abre no navegador e funciona.

Para usar no celular: coloque o arquivo em qualquer pasta compartilhada (Drive, OneDrive)
e abra o link pelo navegador do celular. A câmera funciona a partir daí.

## Onde ficam os dados

No `localStorage` do próprio navegador — uma chave chamada `checklist_frota_v2`.
Isso significa:

- cada aparelho tem a sua própria cópia dos dados, eles não conversam entre si;
- fechar o navegador não apaga nada, mas limpar dados do site apaga;
- o botão **Zerar dados do protótipo** (aba Campo, coluna da direita) volta tudo ao estado inicial.

## Estrutura do arquivo

O `index.html` tem três blocos, na ordem:

1. `<style>` — todo o visual. As cores ficam nas variáveis no topo, dentro de `:root`
   (tema claro) e repetidas em `@media (prefers-color-scheme: dark)` e `:root[data-theme="dark"]`
   (tema escuro). Mudar `--brand` muda o azul do sistema inteiro.
2. O HTML das duas telas: `#view-campo` e `#view-adm`. Os desenhos do caminhão são os
   quatro `<svg>` dentro de `.stage` — cada parte clicável é um `<g class="part" data-part="id">`.
3. `<script>` — a lógica. Começa com o catálogo `PARTS` e a função `seed()`.

## O que mexer primeiro

| Quero mudar | Onde |
|---|---|
| Itens do checklist | objeto `PARTS`, no início do `<script>` |
| Itens obrigatórios (as "pílulas") | array `CHIP_PARTS` |
| Caminhões, motoristas, equipes | função `seed()` |
| Desenho do caminhão | os `<svg id="svg-lateral">`, `svg-frente`, `svg-traseira`, `svg-cabine` |
| Cores | variáveis `--brand`, `--ok`, `--warn`, `--crit` no `:root` |
| Data de referência | constante `HOJE`, no início do `<script>` |

Para uma parte nova aparecer no desenho e contar no progresso, ela precisa das duas coisas:
uma entrada em `PARTS` **e** um `<g class="part" data-part="mesmo_id">` dentro de algum `<svg>`.
O mesmo `data-part` pode aparecer em mais de uma vista — aí é o mesmo item, marcado uma vez só.

## Regras de negócio embutidas

- Gravidade **crítico** bloqueia o veículo: ele aparece como *Impedido* no controle.
- Gravidade **atenção** não bloqueia, mas abre ocorrência.
- O checklist só pode ser finalizado com os 34 itens marcados (o botão "Restantes OK"
  marca de uma vez os que sobraram).
- Uma ocorrência sai da lista quando é marcada como *Resolvida* no painel do adm.

## Quando for ligar no banco

O protótipo já está modelado nas três tabelas que o sistema real vai precisar:

- `veiculos` — placa (chave), modelo, tipo, ano, chassi, equipe, motorista, km, licenciamento, revisão
- `checklists` — placa, motorista, km, data/hora, contagem de conformes/atenção/crítico
- `ocorrencias` — placa, parte, gravidade, observação, foto, status (aberta / manutenção / resolvida)

No código isso está em `S.trucks`, `S.checks` e `S.issues`. Trocar o `localStorage` por
chamadas ao Supabase é substituir a função `save()` e os pontos que leem esses três arrays.
