# Checklist da Frota

App de checklist dos caminhões: o motorista preenche no celular tocando nas partes do
veículo; o administrador acompanha a frota, as ocorrências e o histórico.

React + Vite + Supabase.

---

## Rodar na sua máquina

```bash
npm install
npm run dev
```

Antes do primeiro `npm run dev`, crie o arquivo **`.env.local`** na raiz do projeto
(ao lado do `package.json`):

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

Os dois valores estão no painel do Supabase em **Project Settings → API**.

Três detalhes que costumam custar meia hora a quem está começando:

- O prefixo `VITE_` é obrigatório. Sem ele o Vite não entrega a variável ao navegador.
- O Vite lê o `.env.local` **quando inicia**. Criou o arquivo com o servidor rodando?
  Pare e rode de novo.
- Esse arquivo não vai para o GitHub (o `.gitignore` já cuida disso). Por isso as mesmas
  duas variáveis precisam ser cadastradas de novo no Vercel na hora do deploy.

Se faltar configuração, o app mostra uma tela explicando — não fica em branco.

## Banco de dados

Os scripts estão na pasta `supabase/`, para rodar em ordem no SQL Editor:

| Arquivo | O que faz |
|---|---|
| `01_schema.sql` | tabelas, índices, RLS, políticas e o gatilho do odômetro |
| `02_fotos_e_usuarios.sql` | bucket privado das fotos, políticas do Storage e o perfil automático |
| `03_primeiros_dados.sql` | promove você a adm e cadastra o primeiro caminhão |

### As quatro tabelas

- **perfis** — quem é quem. O `id` é o mesmo do usuário do Auth; é essa amarração que
  transforma um login em "este motorista".
- **veiculos** — a frota. A placa é a chave, e `motorista_id` diz de quem é o caminhão.
- **checklists** — um registro por checklist finalizado.
- **ocorrencias** — um registro por parte com problema.

### O que o RLS garante

Com o RLS ligado o banco devolve zero linhas por padrão; só passa o que as políticas
liberam. Na prática:

- o motorista enxerga apenas o caminhão vinculado a ele, e só cria checklist em nome
  próprio e do próprio veículo;
- só o adm cadastra caminhão, muda o status de uma ocorrência e vê a frota inteira;
- checklist não tem `update` nem `delete` — nem pelo adm. Ele é a assinatura do motorista
  de que o caminhão estava daquele jeito naquele dia; erro se corrige com um checklist
  novo, não apagando o antigo.

É por isso que a chave `anon` pode ficar pública no código: ela apenas identifica um
usuário autenticado, e quem decide o que esse usuário vê é o banco.

## Estrutura do código

```
src/
  main.jsx                    ponto de entrada
  App.jsx                     sessão, perfil e a escolha da tela (adm ou motorista)
  styles.css                  todo o visual, com os dois temas
  lib/
    supabase.js               o cliente
    partes.js                 catálogo dos 35 itens do checklist
    api.js                    todas as conversas com o Supabase
  components/
    Login.jsx
    Checklist.jsx             tela do motorista
    DesenhoCaminhao.jsx       os quatro desenhos em SVG
    SheetParte.jsx            o registro do problema
    Controle.jsx              painel do adm
    FichaVeiculo.jsx          ficha, ocorrências e histórico
    FormVeiculo.jsx           cadastro e edição
```

Toda chamada ao banco mora em `lib/api.js`. Quando algo der errado com dados, é o
primeiro arquivo a abrir — as telas só pedem e mostram.

### Regra dos itens do checklist

Cada item mora em **uma** vista só, definida pelo campo `v` em `lib/partes.js`
(`lateral`, `frente`, `traseira`, `cabine` ou `itens`).

Uma peça que aparece desenhada em outra vista — o pneu traseiro também se vê pela
lateral — é renderizada como contexto: fica esmaecida, não marca nada ali, e o toque
leva o motorista para a vista dona do item. É o que impede o mesmo problema de ser
registrado duas vezes.

Para acrescentar um item: uma linha em `PARTES` **e** um `<Peca id="…">` dentro do SVG
correspondente em `DesenhoCaminhao.jsx`. O total e os contadores das abas se ajustam
sozinhos.

### Fotos

A foto é reduzida no próprio celular antes de subir (`comprimirFoto`): sai de 3–5 MB
para cerca de 40 KB, o que mantém o armazenamento do plano Free viável por anos.

O bucket é privado, então a imagem só aparece através de um link temporário
(`urlAssinada`). E a foto é tratada como reforço da ocorrência, não como a ocorrência:
se o upload falhar, o problema ainda chega ao controle, e o app avisa quais fotos não
subiram.

## Publicar no Vercel

1. Suba o projeto para um repositório no GitHub.
2. No Vercel: **Add New → Project**, escolha o repositório.
3. Framework Preset: **Vite**. Build `npm run build`, output `dist` (ele detecta sozinho).
4. Em **Environment Variables**, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
   Sem isso o site publicado abre na tela de configuração.
5. Deploy.

Depois de publicar, vá ao Supabase em **Authentication → URL Configuration** e inclua o
endereço do Vercel em *Site URL* / *Redirect URLs*.

## No celular do motorista

O app é um site, mas se instala na tela inicial e abre como aplicativo, sem barra de
navegador. É o `public/manifest.webmanifest` mais as tags do `index.html` que fazem isso.

**Android (Chrome):** abrir o endereço → menu ⋮ → *Adicionar à tela inicial* / *Instalar
aplicativo*.

**iPhone (Safari):** abrir o endereço → botão compartilhar → *Adicionar à Tela de Início*.
Precisa ser o Safari; no iPhone o Chrome não instala.

Depois disso aparece o ícone do caminhão junto dos outros apps. A sessão fica salva, então
o motorista abre e já está logado — quem faz o login uma única vez, na entrega do aparelho,
é você.

Para trocar o ícone, substitua os PNGs em `public/` (192, 512, o maskable e o
`apple-touch-icon` de 180). O maskable tem margem maior de propósito: o Android recorta as
bordas do ícone em círculo em alguns aparelhos.
