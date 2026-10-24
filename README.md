# Portal Sport Club do Recife

Portal do sócio-torcedor do Sport Club do Recife. O torcedor se cadastra, contrata um plano, paga mensalidades, emite a carteira digital com QR Code e compra ingressos com desconto. O portal também tem uma área pública (jogos, notícias, planos e patrocinadores) e um painel para os funcionários do clube, com gestão de notícias.

> **Projeto acadêmico** — UNINASSAU, Ciência da Computação (turma 4NA), disciplina Maturidade em Desenvolvimento de Software. Escudo e nome oficiais só podem ser usados publicamente com autorização do clube.

| Integrante | Responsabilidade |
| --- | --- |
| Ananda Almeida Ramos | Design (UI/UX) e documentação |
| José Lúfyo César França Camelo | Frontend |
| Vanessa Camelo Lins do Nascimento | Backend |

## Arquitetura

Três partes independentes, ligadas por um contrato de API combinado entre a equipe:

```
Navegador (React, porta 5173)
  → fetch com "Authorization: Bearer <token>"
  → API Express (porta 3333, prefixo /api)
      → middlewares: exigirLogin (token) e exigirPapel (perfil)
      → controller (valida o corpo com Zod)
      → service (regra de negócio)
  → Supabase: PostgreSQL + Supabase Auth
```

O frontend nunca acessa o banco diretamente: tudo passa pela API.

## Tecnologias

| Parte | O quê |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, qrcode.react, fonte Archivo (@fontsource), ESLint, Vitest + Testing Library (testes) |
| Backend | Node.js, TypeScript, Express 5, Zod 4, supabase-js, cors, dotenv, tsx, swagger-ui-express (documentação da API), Vitest + supertest (testes) |
| Banco e login | Supabase (PostgreSQL gerenciado + Supabase Auth) |

## Como rodar

Precisa do **Node 22.12 ou mais novo** (exigência do Vitest 5, usado nos testes) e de um projeto no [Supabase](https://supabase.com) com as tabelas descritas em [Banco de dados](#banco-de-dados).

### 1. API

```bash
cd backend
npm install
```

Copie o modelo e preencha com os dados do seu projeto Supabase (em Project Settings → API). O `.env` está no `.gitignore` e **nunca** deve ir para o Git:

```bash
cp .env.example .env
```

| Variável | O que é |
| --- | --- |
| `SUPABASE_URL` | endereço do projeto Supabase |
| `SUPABASE_SERVICE_KEY` | chave `service_role` (secreta: só no servidor) |
| `PORT` | porta da API (opcional, padrão 3333) |

```bash
npm run dev      # tsx watch: reinicia a cada alteração

# produção
npm run build    # compila para dist/
npm start        # roda dist/server.js (também lê o .env)
```

Confira em <http://localhost:3333/api/health>: a resposta deve ser `{ "status": "ok", "banco": "conectado" }`.

A documentação interativa da API (Swagger) fica em <http://localhost:3333/api/docs>. Veja [Documentação da API](#documentação-da-api).

### 2. Site

Em outro terminal:

```bash
cd frontend
npm install
npm run dev      # abre em http://localhost:5173
npm run lint     # confere o código
npm run build    # confere os tipos e gera o site em dist/
npm test         # roda os testes
```

O site chama `http://localhost:3333/api` por padrão. Para outro endereço, copie `frontend/.env.example` para `frontend/.env` e ajuste o `VITE_API_URL`. Tudo que começa com `VITE_` vai para o navegador: nunca coloque chaves secretas no `.env` do frontend.

### Usuários do painel

Todo cadastro feito pelo site é um **sócio**. Para testar o painel, cadastre-se normalmente e, no Supabase, troque o campo `papel` da sua linha na tabela `perfis` para `editor`, `gestor` ou `admin`.

## Estrutura

```
portal-clube/
├── backend/
│   └── src/
│       ├── server.ts      lê o .env e sobe a API
│       ├── app.ts         CORS, JSON, registro das rotas, /api/health e /api/docs
│       ├── config/        supabase.ts: cliente do banco e do Auth
│       ├── docs/          openapi.ts: documentação da API (OpenAPI 3.1)
│       ├── routes/        endereços e middlewares de cada rota
│       ├── middlewares/   exigirLogin (token) e exigirPapel (perfil)
│       ├── controllers/   recebem a requisição, validam e respondem
│       ├── schemas/       regras de validação (Zod); os tipos saem delas
│       ├── services/      regras de negócio e consultas ao banco
│       ├── errors/        ErroDeNegocio: mensagem, status HTTP e campo
│       └── utils/         respostas.ts: responderErro e formatarErrosZod
└── frontend/
    └── src/
        ├── main.tsx       BrowserRouter + AuthProvider + fonte
        ├── App.tsx        todas as rotas, agrupadas por nível de acesso
        ├── index.css      tema do Tailwind com os tokens do design
        ├── pages/         uma página por rota
        ├── components/    partes reutilizáveis (cartões, seções, RotaProtegida...)
        ├── hooks/         lógica de cada tela (useLogin, useCompraIngressos...)
        ├── contexts/      AuthContext e AuthProvider: usuário logado (use com o hook useAuth)
        ├── services/      api.ts: função única para chamar a API
        ├── types/         formato dos dados que a API devolve
        ├── utils/         formatadores (moeda, datas, CPF) e permissões
        └── data/          patrocinadores (lista fixa)
```

Cada assunto do backend segue o mesmo caminho: `routes/x.routes.ts` → `controllers/x.controller.ts` → `schemas/x.schema.ts` → `services/x.service.ts`. No frontend, cada página delega a busca de dados a um hook, e o hook chama a API sempre por `api()` de `services/api.ts`.

## Testes

Os testes não precisam do Supabase nem de `.env`: o banco (no backend) e a API (no frontend) são trocados por versões falsas em memória. Rode dentro de `backend/` ou de `frontend/`:

```bash
npm test                  # todos
npm run test:unitarios    # só os unitários
npm run test:integracao   # só os de integração
npm run test:watch        # roda de novo a cada alteração
```

| Pasta | O que testa |
| --- | --- |
| `backend/tests/unitarios/` | schemas Zod (CPF, senha, limite de ingressos...), respostas de erro, middlewares de login e perfil e as regras de cada service (desconto, lugares por setor, mensalidade no fuso de São Paulo, cadastro desfeito se o perfil falhar...) |
| `backend/tests/integracao/` | requisições HTTP de verdade contra o `app` Express (`supertest`), passando por rota → middlewares → controller → service: cadastro e login, matriz de permissões do painel, assinatura, mensalidades, compra de ingressos, CORS, `/health` e a documentação da API |
| `frontend/tests/unitarios/` | formatadores, regras de permissão e o `api.ts` (token, corpo, erros e falha de rede) |
| `frontend/tests/integracao/` | o app inteiro renderizado (Testing Library): acesso às páginas por perfil, login com volta à página de origem, erros nos campos e pagamento de mensalidade |

### Como escrever um teste

**Backend:** o `tests/apoio/preparacao.ts` troca `src/config/supabase` pelo banco falso de `tests/apoio/supabaseFalso.ts`. Cada teste diz o que cada tabela responde, na ordem das consultas, e pode conferir os filtros usados:

```ts
banco.responder("mensalidades", { data: { id: "m1", status: "pendente" } }, {});
await pagarMensalidade("u1", "m1");
expect(filtrosEq(banco.consultasA("mensalidades")[1])).toEqual({ id: "m1", usuario_id: "u1" });
```

Nos testes de integração, `entrarComo("u1", "editor")` (em `tests/apoio/api.ts`) cria o token e responde a consulta de perfil do `exigirPapel`. Resposta configurada que nenhuma consulta usou faz o teste falhar: assim um teste não passa por engano.

**Frontend:** `tests/apoio/apiFalsa.ts` substitui o `fetch`. `abrirApp("/mensalidades")` renderiza o app numa URL e `jaLogadoComo("socio")` simula um login salvo:

```ts
jaLogadoComo("socio");
apiFalsa.responder("GET", "/mensalidades", 200, [mensalidade]);
abrirApp("/mensalidades");
expect(await screen.findByText("Pendente")).toBeInTheDocument();
```

Chamada à API sem resposta configurada falha o teste. No frontend, os testes também passam pelo `tsc` no `npm run build`.

## Rotas da API

Todas começam com `/api`.

| Rota | Acesso | Função |
| --- | --- | --- |
| `POST /auth/register` · `POST /auth/login` | Público | Cadastro e login |
| `GET /auth/me` | Logado | Dados do usuário autenticado |
| `GET /planos` | Público | Planos de sócio |
| `POST /assinatura` · `DELETE /assinatura` | Logado | Contratar ou cancelar plano |
| `GET /mensalidades` · `POST /mensalidades/:id/pagar` | Logado | Listar e pagar mensalidades |
| `GET /jogos` · `GET /noticias` · `GET /noticias/:id` | Público | Conteúdo da área pública |
| `GET /ingressos/jogos/:jogoId` · `POST /ingressos` · `GET /ingressos` | Logado | Setores e preços, compra e ingressos do sócio |
| `GET /admin/resumo` | Editor, gestor, admin | Indicadores do painel |
| `/admin/noticias` (listar, buscar, criar, editar, `PATCH /:id/publicacao`, excluir) | Editor, admin | Gestão de notícias |
| `GET /health` | Público | Confere a API e o banco |
| `GET /docs` · `GET /openapi.json` | Público | Documentação da API (Swagger e arquivo OpenAPI) |

### Documentação da API

Com a API rodando:

- **<http://localhost:3333/api/docs>** — tela do Swagger com todas as rotas, os campos de cada requisição, as respostas e os erros possíveis. Dá para testar direto por ela: faça `POST /auth/login`, copie o `token`, clique em **Authorize** e cole o token para liberar as rotas com cadeado (o token fica salvo ao recarregar a página).
- **<http://localhost:3333/api/openapi.json>** — o mesmo conteúdo no formato OpenAPI 3.1, para importar no Postman, no Insomnia ou em geradores de código.

A documentação está em `backend/src/docs/openapi.ts`. O corpo de cada requisição é gerado a partir do schema Zod que o controller usa (`z.toJSONSchema`), então as regras de validação documentadas são sempre as mesmas do código. As respostas são descritas à mão.

### Contrato

- **Login:** a API devolve um token; o frontend guarda no `localStorage` (`portal_token`) e envia em toda chamada no cabeçalho `Authorization: Bearer <token>`.
- **Campos** em camelCase no JSON.
- **Erros** sempre no formato `{ "erro": "mensagem", "campos": { "campo": "mensagem" } }`. No backend, lance um `ErroDeNegocio(mensagem, status, campo)`; no frontend, o `ApiError` leva `campos` até o formulário, que mostra o erro embaixo do campo certo.
- **Permissões:** o admin sempre pode; os demais, conforme a lista de cada rota. A regra existe em `exigirPapel` (backend) e em `utils/permissoes.ts` (frontend). A tela só esconde o que a pessoa não pode usar: **quem decide é sempre a API**.

## Regras de negócio

- **Cadastro:** CPF validado pelos dígitos verificadores; senha com no mínimo 8 caracteres, letras e números. Se gravar o perfil falhar, o usuário criado no Auth é apagado (sem cadastro pela metade).
- **Mensalidades:** o vencimento é sempre no dia 10, no fuso de São Paulo. Na assinatura nova, a primeira cobrança já é criada: a do mês atual se for até o dia 10, ou a do mês seguinte se o dia 10 já passou, para ninguém começar em atraso. Depois, a cobrança de cada mês é criada quando o sócio abre suas mensalidades, sem duplicar. Na troca de plano, as pendentes são apagadas e a do mês é refeita com o plano novo. O pagamento só é registrado: ainda não há Pix nem cartão.
- **Ingressos:** até 4 por jogo por sócio, limitado aos lugares do setor, venda encerrada depois do jogo e desconto conforme o plano. O id do comprador vem sempre do token, nunca do corpo da requisição.
- **Notícias:** nascem como rascunho; tipos (`Notícia`, `Coletiva`, `Comunicado`, `Entrevista`) e categorias (`Profissional masculino`, `Profissional feminino`, `Categorias de base`, `Esportes olímpicos`) são listas fixas, iguais no banco, no schema Zod e no frontend.

## Banco de dados

Tabelas no Supabase (PostgreSQL):

| Tabela | Guarda |
| --- | --- |
| `perfis` | dados do sócio (mesmo `id` do usuário do Auth), `papel` (`socio`, `editor`, `gestor`, `admin`) e plano |
| `planos` | preço, benefícios e desconto em ingressos |
| `mensalidades` | referência, valor, vencimento, `status` (`pendente`/`paga`) e data do pagamento |
| `jogos` | adversário, data, local, competição, mando e resultado |
| `setores` | setores do estádio, preços e lugares |
| `ingressos` | compras dos sócios |
| `noticias` | título, resumo, conteúdo, tipo, categoria e se está publicada |

As senhas ficam no **Supabase Auth**, com hash, e nunca são devolvidas pela API.

A compra de ingressos é feita pela função `comprar_ingressos(p_usuario, p_jogo, p_setor, p_quantidade)`, que confere e grava de uma vez. Quando recusa a compra, ela levanta um erro com um destes códigos, que a API traduz em `services/ingresso.service.ts`: `QUANTIDADE_INVALIDA`, `JOGO_NAO_ENCONTRADO`, `SETOR_NAO_ENCONTRADO`, `VENDA_ENCERRADA`, `LIMITE_EXCEDIDO`, `SEM_LUGARES`.

> O SQL das tabelas e da função ainda não está neste repositório: ele existe só no projeto Supabase da equipe.

## Problemas conhecidos

- **CORS** aceita só `http://localhost:5173` (`backend/src/app.ts`); para publicar, o endereço do site precisa vir de configuração.

## Convenções

- Textos de tela, comentários, nomes de arquivos e de funções em português.
- Cor, fonte e espaçamento vêm dos tokens do tema em `frontend/src/index.css` (ex.: `bg-rubro`, `text-marfim`), nunca de códigos soltos.
- Endpoint novo: rota → controller → schema Zod → service, com erros via `ErroDeNegocio`, a rota documentada em `backend/src/docs/openapi.ts` e testes unitários e de integração.
- Antes de abrir um PR: `npm test`, `npm run lint` (frontend) e `npm run build` sem erros.
- Nunca suba o `.env` nem a chave `service_role` para o Git.
