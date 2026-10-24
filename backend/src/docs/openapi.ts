import { z } from "zod";
import { contratarSchema } from "../schemas/assinatura.schema";
import { loginSchema, perfilSchema, registerSchema, trocaDeSenhaSchema } from "../schemas/auth.schema";
import { compraSchema } from "../schemas/ingresso.schema";
import { categorias, noticiaSchema, publicacaoSchema, tipos } from "../schemas/noticia.schema";

// Documentação da API no formato OpenAPI 3.1, servida em /api/docs (Swagger UI)
// e em /api/openapi.json. Ao criar ou mudar uma rota, atualize este arquivo.

// O corpo de cada requisição sai do próprio schema Zod que o controller usa:
// assim a documentação e a validação nunca ficam diferentes.
function corpo(schema: z.ZodType, exemplo: object) {
  const { $schema: _versao, ...jsonSchema } = z.toJSONSchema(schema, { io: "input" });
  return {
    required: true,
    content: { "application/json": { schema: jsonSchema, example: exemplo } },
  };
}

const ref = (nome: string) => ({ $ref: `#/components/schemas/${nome}` });
const lista = (nome: string) => ({ type: "array", items: ref(nome) });

function json(descricao: string, schema: object) {
  return { description: descricao, content: { "application/json": { schema } } };
}

// Erro de regra de negócio no formato padrão { erro, campos }
function erro(descricao: string, exemplo: { erro: string; campos?: Record<string, string> }) {
  return {
    description: descricao,
    content: { "application/json": { schema: ref("Erro"), example: exemplo } },
  };
}

const mensagem = (texto: string) =>
  json(texto, { type: "object", properties: { mensagem: { type: "string", example: texto } } });

// Respostas que se repetem em várias rotas
const comLogin = [{ bearerAuth: [] }];
const semLogin: object[] = []; // rota pública
const r400 = { $ref: "#/components/responses/DadosInvalidos" };
const r401 = { $ref: "#/components/responses/NaoAutenticado" };
const r403 = { $ref: "#/components/responses/AcessoNegado" };
const r500 = { $ref: "#/components/responses/ErroInterno" };

const idNaUrl = (descricao: string) => ({
  name: "id",
  in: "path",
  required: true,
  description: descricao,
  schema: { type: "string", format: "uuid" },
});

const exemploNoticia = {
  titulo: "Sport vence o clássico na Ilha do Retiro",
  resumo: "Com gols no segundo tempo, o Leão garantiu a vitória diante da torcida.",
  conteudo: "Texto completo da notícia, com pelo menos 20 caracteres.",
  categoria: "Profissional masculino",
  tipo: "Notícia",
  publicada: false,
};

export const documentoOpenApi = {
  openapi: "3.1.0",
  info: {
    title: "API do Portal Sport Club do Recife",
    version: "1.0.0",
    description:
      "API REST do portal do sócio-torcedor.\n\n" +
      "**Como testar rotas com cadeado:** faça `POST /auth/login`, copie o `token` da resposta, " +
      "clique em **Authorize** e cole o token.\n\n" +
      "**Erros** sempre vêm como `{ erro, campos }`: `erro` é a mensagem geral e `campos` " +
      "(quando existe) traz a mensagem de cada campo do formulário.\n\n" +
      "**Perfis:** o admin acessa todas as rotas; os demais, conforme indicado em cada uma.",
  },
  servers: [{ url: "/api", description: "Esta API" }],
  tags: [
    { name: "Autenticação", description: "Cadastro, login e dados do usuário logado" },
    { name: "Planos", description: "Planos de sócio e assinatura" },
    { name: "Mensalidades", description: "Cobranças mensais do sócio" },
    { name: "Conteúdo", description: "Jogos e notícias da área pública" },
    { name: "Ingressos", description: "Compra e consulta de ingressos" },
    { name: "Painel", description: "Indicadores e gestão de notícias (funcionários do clube)" },
    { name: "Sistema", description: "Verificação de funcionamento" },
  ],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Autenticação"],
        summary: "Cadastrar sócio",
        operationId: "cadastrar",
        security: semLogin,
        description:
          "CPF validado pelos dígitos verificadores (com ou sem pontuação). Senha com no mínimo 8 caracteres, letras e números.",
        requestBody: corpo(registerSchema, {
          nome: "Maria Leão da Silva",
          email: "maria@exemplo.com",
          cpf: "529.982.247-25",
          dataNascimento: "1995-04-13",
          senha: "leao1905",
        }),
        responses: {
          201: json("Cadastro realizado", {
            type: "object",
            properties: {
              mensagem: { type: "string", example: "Cadastro realizado com sucesso" },
              usuario: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  nome: { type: "string" },
                  email: { type: "string", format: "email" },
                },
              },
            },
          }),
          400: r400,
          409: erro("E-mail ou CPF já cadastrado", {
            erro: "CPF já cadastrado",
            campos: { cpf: "CPF já cadastrado" },
          }),
          500: r500,
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Autenticação"],
        summary: "Entrar",
        operationId: "entrar",
        security: semLogin,
        description: "Devolve o token que deve ir no cabeçalho `Authorization: Bearer <token>`.",
        requestBody: corpo(loginSchema, { email: "maria@exemplo.com", senha: "leao1905" }),
        responses: {
          200: json("Login feito", ref("RespostaLogin")),
          400: r400,
          401: erro("E-mail ou senha incorretos", { erro: "E-mail ou senha incorretos" }),
          500: r500,
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Autenticação"],
        summary: "Dados do usuário logado",
        operationId: "meusDados",
        security: comLogin,
        responses: {
          200: json("Perfil do usuário", ref("Perfil")),
          401: r401,
          404: erro("Perfil não encontrado", { erro: "Perfil não encontrado" }),
          500: r500,
        },
      },
      patch: {
        tags: ["Autenticação"],
        summary: "Editar meus dados",
        operationId: "editarMeusDados",
        description:
          "Atualiza nome, e-mail e data de nascimento. O CPF não pode ser alterado (se enviado, é ignorado). Para trocar o e-mail, envie também `senhaAtual`.",
        security: comLogin,
        requestBody: corpo(perfilSchema, {
          nome: "Maria Leão da Silva",
          email: "maria.nova@exemplo.com",
          dataNascimento: "1995-04-13",
          senhaAtual: "leao1905",
        }),
        responses: {
          200: json("Dados atualizados", {
            type: "object",
            properties: {
              mensagem: { type: "string", example: "Dados atualizados com sucesso" },
              perfil: ref("Perfil"),
            },
          }),
          400: erro("Dados inválidos, ou e-mail trocado sem a senha certa", {
            erro: "Senha incorreta",
            campos: { senhaAtual: "Senha incorreta" },
          }),
          401: r401,
          409: erro("E-mail já usado por outra conta", {
            erro: "E-mail já cadastrado",
            campos: { email: "E-mail já cadastrado" },
          }),
          500: r500,
        },
      },
    },
    "/auth/senha": {
      put: {
        tags: ["Autenticação"],
        summary: "Trocar minha senha",
        operationId: "trocarMinhaSenha",
        description:
          "Confere a senha atual e grava a nova, que segue a regra do cadastro (mínimo de 8 caracteres, com letras e números) e não pode ser igual à atual. As sessões abertas em outros aparelhos são encerradas.",
        security: comLogin,
        requestBody: corpo(trocaDeSenhaSchema, { senhaAtual: "leao1905", novaSenha: "sport1905" }),
        responses: {
          200: json("Senha alterada", {
            type: "object",
            properties: {
              mensagem: { type: "string", example: "Senha alterada com sucesso" },
              token: {
                type: ["string", "null"],
                description:
                  "Token novo. Trocar a senha encerra todas as sessões da conta, inclusive a atual: use este token daqui em diante. Se vier null, é preciso entrar de novo.",
              },
            },
          }),
          400: erro("Nova senha fraca ou igual à atual, ou senha atual incorreta", {
            erro: "Senha atual incorreta",
            campos: { senhaAtual: "Senha atual incorreta" },
          }),
          401: r401,
          500: r500,
        },
      },
    },
    "/planos": {
      get: {
        tags: ["Planos"],
        summary: "Listar planos de sócio",
        operationId: "listarPlanos",
        security: semLogin,
        responses: { 200: json("Planos", lista("Plano")), 500: r500 },
      },
    },
    "/assinatura": {
      post: {
        tags: ["Planos"],
        summary: "Contratar plano",
        operationId: "contratarPlano",
        description:
          "Na assinatura nova, já gera a primeira mensalidade: a do mês atual se for até o dia 10, ou a do mês seguinte se o dia 10 já passou (ninguém começa em atraso). Também serve para trocar de plano: as mensalidades pendentes do mês atual em diante passam para o plano novo, com o preço novo. Nenhuma dívida é apagada, nem na troca nem ao assinar de novo depois de cancelar.",
        security: comLogin,
        requestBody: corpo(contratarSchema, { planoId: "00000000-0000-0000-0000-000000000000" }),
        responses: {
          200: json("Plano contratado", {
            type: "object",
            properties: {
              mensagem: { type: "string", example: "Plano contratado com sucesso" },
              plano: {
                type: "object",
                properties: { id: { type: "string" }, nome: { type: "string" } },
              },
            },
          }),
          400: r400,
          401: r401,
          404: erro("Plano não encontrado", {
            erro: "Plano não encontrado",
            campos: { planoId: "Plano não encontrado" },
          }),
          500: r500,
        },
      },
      delete: {
        tags: ["Planos"],
        summary: "Cancelar plano",
        description:
          "Quem foi sócio no mês deve o mês: a cobrança do mês atual é garantida (exceto para quem assinou depois do dia 10 e ainda não tem cobrança no mês). Só as cobranças pendentes de meses que ainda não começaram são apagadas; dívidas e o histórico de pagas continuam.",
        operationId: "cancelarPlano",
        security: comLogin,
        responses: { 200: mensagem("Plano cancelado com sucesso"), 401: r401, 500: r500 },
      },
    },
    "/mensalidades": {
      get: {
        tags: ["Mensalidades"],
        summary: "Listar mensalidades do sócio",
        operationId: "listarMensalidades",
        description:
          "Gera a cobrança do mês atual na primeira consulta (vencimento no dia 10, fuso de São Paulo), sem duplicar. Não gera o mês da assinatura de quem assinou depois do dia 10: a primeira cobrança dessa pessoa é a do mês seguinte.",
        security: comLogin,
        responses: {
          200: json("Mensalidades", lista("Mensalidade")),
          401: r401,
          404: erro("Perfil não encontrado", { erro: "Perfil não encontrado" }),
          500: r500,
        },
      },
    },
    "/mensalidades/{id}/pagar": {
      post: {
        tags: ["Mensalidades"],
        summary: "Pagar mensalidade",
        operationId: "pagarMensalidade",
        description: "Só registra o pagamento: ainda não há integração com Pix ou cartão.",
        security: comLogin,
        parameters: [idNaUrl("Id da mensalidade")],
        responses: {
          200: mensagem("Mensalidade paga com sucesso"),
          401: r401,
          404: erro("Mensalidade não encontrada", { erro: "Mensalidade não encontrada" }),
          409: erro("Já paga", { erro: "Esta mensalidade já foi paga" }),
          500: r500,
        },
      },
    },
    "/jogos": {
      get: {
        tags: ["Conteúdo"],
        summary: "Listar jogos",
        operationId: "listarJogos",
        security: semLogin,
        responses: { 200: json("Jogos", lista("Jogo")), 500: r500 },
      },
    },
    "/noticias": {
      get: {
        tags: ["Conteúdo"],
        summary: "Listar notícias publicadas",
        operationId: "listarNoticias",
        security: semLogin,
        responses: { 200: json("Notícias publicadas", lista("Noticia")), 500: r500 },
      },
    },
    "/noticias/{id}": {
      get: {
        tags: ["Conteúdo"],
        summary: "Ler uma notícia publicada",
        operationId: "lerNoticia",
        security: semLogin,
        parameters: [idNaUrl("Id da notícia")],
        responses: {
          200: json("Notícia com o texto completo", ref("NoticiaCompleta")),
          404: erro("Não encontrada ou não publicada", { erro: "Notícia não encontrada" }),
          500: r500,
        },
      },
    },
    "/ingressos/jogos/{jogoId}": {
      get: {
        tags: ["Ingressos"],
        summary: "Dados para comprar ingressos de um jogo",
        operationId: "dadosDaCompra",
        description:
          "Setores com preço cheio, preço com o desconto do plano do sócio e lugares disponíveis, além de quantos ingressos o sócio ainda pode comprar.",
        security: comLogin,
        parameters: [
          {
            name: "jogoId",
            in: "path",
            required: true,
            description: "Id do jogo",
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: json("Dados da compra", ref("DadosCompra")),
          401: r401,
          404: erro("Jogo não encontrado", { erro: "Jogo não encontrado" }),
          500: r500,
        },
      },
    },
    "/ingressos": {
      get: {
        tags: ["Ingressos"],
        summary: "Meus ingressos",
        operationId: "listarMeusIngressos",
        security: comLogin,
        responses: { 200: json("Ingressos do sócio", lista("MeuIngresso")), 401: r401, 500: r500 },
      },
      post: {
        tags: ["Ingressos"],
        summary: "Comprar ingressos",
        operationId: "comprarIngressos",
        description:
          "Feita pela função `comprar_ingressos` do banco, que confere e grava de uma vez: até 4 ingressos por jogo por sócio, lugares no setor e venda aberta. O comprador é sempre o dono do token.",
        security: comLogin,
        requestBody: corpo(compraSchema, {
          jogoId: "00000000-0000-0000-0000-000000000000",
          setorId: "00000000-0000-0000-0000-000000000000",
          quantidade: 2,
        }),
        responses: {
          201: json("Compra realizada", ref("RespostaCompra")),
          400: r400,
          401: r401,
          404: erro("Jogo ou setor não encontrado", {
            erro: "Setor não encontrado",
            campos: { setorId: "Setor não encontrado" },
          }),
          409: erro("Venda encerrada, limite de 4 por jogo ou setor sem lugares", {
            erro: "O limite é de 4 ingressos por jogo",
            campos: { quantidade: "O limite é de 4 ingressos por jogo" },
          }),
          500: r500,
        },
      },
    },
    "/admin/resumo": {
      get: {
        tags: ["Painel"],
        summary: "Indicadores do painel",
        operationId: "obterResumo",
        description: "Perfis: editor, gestor e admin.",
        security: comLogin,
        responses: { 200: json("Indicadores", ref("Resumo")), 401: r401, 403: r403, 500: r500 },
      },
    },
    "/admin/noticias": {
      get: {
        tags: ["Painel"],
        summary: "Listar todas as notícias (inclusive rascunhos)",
        operationId: "listarNoticiasAdmin",
        description: "Perfis: editor e admin.",
        security: comLogin,
        responses: {
          200: json("Notícias", lista("NoticiaAdmin")),
          401: r401,
          403: r403,
          500: r500,
        },
      },
      post: {
        tags: ["Painel"],
        summary: "Criar notícia",
        operationId: "criarNoticia",
        description: "Perfis: editor e admin. Sem `publicada`, a notícia nasce como rascunho.",
        security: comLogin,
        requestBody: corpo(noticiaSchema, exemploNoticia),
        responses: {
          201: json("Notícia criada", respostaNoticia("Notícia criada com sucesso")),
          400: r400,
          401: r401,
          403: r403,
          500: r500,
        },
      },
    },
    "/admin/noticias/{id}": {
      get: {
        tags: ["Painel"],
        summary: "Buscar notícia para edição",
        operationId: "buscarNoticiaAdmin",
        description: "Perfis: editor e admin. Inclui o `conteudo`.",
        security: comLogin,
        parameters: [idNaUrl("Id da notícia")],
        responses: {
          200: json("Notícia", ref("NoticiaAdmin")),
          401: r401,
          403: r403,
          404: erro("Notícia não encontrada", { erro: "Notícia não encontrada" }),
          500: r500,
        },
      },
      put: {
        tags: ["Painel"],
        summary: "Editar notícia",
        operationId: "editarNoticia",
        description: "Perfis: editor e admin.",
        security: comLogin,
        parameters: [idNaUrl("Id da notícia")],
        requestBody: corpo(noticiaSchema, exemploNoticia),
        responses: {
          200: json("Notícia salva", respostaNoticia("Notícia salva com sucesso")),
          400: r400,
          401: r401,
          403: r403,
          404: erro("Notícia não encontrada", { erro: "Notícia não encontrada" }),
          500: r500,
        },
      },
      delete: {
        tags: ["Painel"],
        summary: "Excluir notícia",
        operationId: "excluirNoticia",
        description: "Perfis: editor e admin.",
        security: comLogin,
        parameters: [idNaUrl("Id da notícia")],
        responses: {
          200: mensagem("Notícia excluída"),
          401: r401,
          403: r403,
          404: erro("Notícia não encontrada", { erro: "Notícia não encontrada" }),
          500: r500,
        },
      },
    },
    "/admin/noticias/{id}/publicacao": {
      patch: {
        tags: ["Painel"],
        summary: "Publicar ou despublicar notícia",
        operationId: "alterarPublicacao",
        description: "Perfis: editor e admin.",
        security: comLogin,
        parameters: [idNaUrl("Id da notícia")],
        requestBody: corpo(publicacaoSchema, { publicada: true }),
        responses: {
          200: json("Publicação alterada", respostaNoticia("Notícia publicada")),
          400: r400,
          401: r401,
          403: r403,
          404: erro("Notícia não encontrada", { erro: "Notícia não encontrada" }),
          500: r500,
        },
      },
    },
    "/health": {
      get: {
        tags: ["Sistema"],
        summary: "Confere a API e o banco",
        operationId: "verificarApi",
        security: semLogin,
        responses: {
          200: json("Tudo funcionando", {
            type: "object",
            properties: {
              status: { type: "string", example: "ok" },
              banco: { type: "string", example: "conectado" },
            },
          }),
          500: json("Banco fora do ar", {
            type: "object",
            properties: {
              status: { type: "string", example: "erro" },
              mensagem: { type: "string" },
            },
          }),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token devolvido pelo POST /auth/login",
      },
    },
    responses: {
      DadosInvalidos: erro("Dados inválidos: a mensagem de cada campo vem em `campos`", {
        erro: "Dados inválidos",
        campos: { senha: "A senha deve ter no mínimo 8 caracteres" },
      }),
      NaoAutenticado: erro("Token ausente, inválido ou expirado", {
        erro: "Token inválido ou expirado",
      }),
      AcessoNegado: erro("O perfil do usuário não tem acesso a esta rota", {
        erro: "Acesso negado",
      }),
      ErroInterno: erro("Falha inesperada no servidor ou no banco", {
        erro: "Erro interno do servidor",
      }),
    },
    schemas: {
      Erro: {
        type: "object",
        required: ["erro"],
        properties: {
          erro: { type: "string", description: "Mensagem geral" },
          campos: {
            type: "object",
            additionalProperties: { type: "string" },
            description: "Mensagem de cada campo do formulário com problema",
          },
        },
      },
      Papel: { type: "string", enum: ["socio", "editor", "gestor", "admin"] },
      Usuario: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nome: { type: "string" },
          email: { type: "string", format: "email" },
          papel: ref("Papel"),
        },
      },
      RespostaLogin: {
        type: "object",
        properties: { token: { type: "string" }, usuario: ref("Usuario") },
      },
      Perfil: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nome: { type: "string" },
          cpf: { type: "string", description: "Só números", example: "52998224725" },
          dataNascimento: { type: "string", format: "date" },
          numeroSocio: { type: "integer" },
          papel: ref("Papel"),
          email: { type: "string", format: "email" },
          plano: {
            description: "null enquanto o sócio não contratou um plano",
            oneOf: [
              {
                type: "object",
                properties: {
                  id: { type: "string" },
                  nome: { type: "string" },
                  preco: { type: "number", description: "Valor mensal em reais" },
                },
              },
              { type: "null" },
            ],
          },
        },
      },
      Plano: {
        type: "object",
        properties: {
          id: { type: "string" },
          nome: { type: "string" },
          preco: { type: "number", description: "Valor mensal em reais" },
          beneficios: { type: "array", items: { type: "string" } },
          destaque: { type: "boolean", description: "Marca o plano em destaque" },
        },
      },
      Mensalidade: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          referencia: { type: "string", format: "date", description: "Primeiro dia do mês cobrado" },
          plano: { type: ["string", "null"], description: "Nome do plano" },
          valor: { type: "number" },
          vencimento: { type: "string", format: "date" },
          status: { type: "string", enum: ["pendente", "paga"] },
          pagoEm: { type: ["string", "null"], format: "date-time" },
        },
      },
      Jogo: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          adversario: { type: "string" },
          data: { type: "string", format: "date-time" },
          local: { type: "string" },
          competicao: { type: "string" },
          mandante: { type: "boolean", description: "true quando o Sport joga em casa" },
          resultado: {
            type: "object",
            description: "Só aparece em jogos já disputados",
            properties: {
              golsClube: { type: "integer" },
              golsAdversario: { type: "integer" },
            },
          },
        },
      },
      Noticia: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          titulo: { type: "string" },
          resumo: { type: "string" },
          categoria: { type: "string", enum: [...categorias] },
          tipo: { type: "string", enum: [...tipos] },
          data: { type: "string", format: "date-time", description: "Data de publicação" },
        },
      },
      NoticiaCompleta: {
        allOf: [ref("Noticia"), { type: "object", properties: { conteudo: { type: "string" } } }],
      },
      NoticiaAdmin: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          titulo: { type: "string" },
          resumo: { type: "string" },
          categoria: { type: "string", enum: [...categorias] },
          tipo: { type: "string", enum: [...tipos] },
          publicada: { type: "boolean" },
          publicadaEm: { type: ["string", "null"], format: "date-time" },
          criadoEm: { type: "string", format: "date-time" },
          conteudo: { type: "string", description: "Só vem ao buscar uma notícia específica" },
        },
      },
      DadosCompra: {
        type: "object",
        properties: {
          jogo: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              adversario: { type: "string" },
              data: { type: "string", format: "date-time" },
              local: { type: "string" },
              competicao: { type: "string" },
              mandante: { type: "boolean" },
              vendaAberta: {
                type: "boolean",
                description: "Fecha na hora da partida ou quando já há resultado",
              },
            },
          },
          desconto: { type: "number", description: "Percentual do plano do sócio (0 sem plano)" },
          limiteRestante: {
            type: "integer",
            description: "Quantos ingressos o sócio ainda pode comprar neste jogo",
          },
          setores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                nome: { type: "string" },
                preco: { type: "number" },
                precoComDesconto: { type: "number" },
                disponiveis: { type: "integer" },
              },
            },
          },
        },
      },
      RespostaCompra: {
        type: "object",
        properties: {
          mensagem: { type: "string", example: "Compra realizada com sucesso" },
          ingressos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                codigo: { type: "string", description: "Conteúdo do QR Code" },
                setorId: { type: "string", format: "uuid" },
                precoPago: { type: "number" },
                criadoEm: { type: "string", format: "date-time" },
              },
            },
          },
          total: { type: "number" },
        },
      },
      MeuIngresso: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          codigo: { type: "string", description: "Conteúdo do QR Code" },
          precoPago: { type: "number" },
          criadoEm: { type: "string", format: "date-time" },
          setor: { type: "string", description: "Nome do setor" },
          jogo: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              adversario: { type: "string" },
              data: { type: "string", format: "date-time" },
              local: { type: "string" },
              competicao: { type: "string" },
              mandante: { type: "boolean" },
            },
          },
        },
      },
      Resumo: {
        type: "object",
        properties: {
          cadastros: { type: "integer" },
          sociosComPlano: { type: "integer" },
          mensalidadesPendentes: { type: "integer" },
          noticiasPublicadas: { type: "integer" },
          jogos: { type: "integer" },
        },
      },
    },
  },
};

function respostaNoticia(texto: string) {
  return {
    type: "object",
    properties: {
      mensagem: { type: "string", example: texto },
      noticia: ref("NoticiaAdmin"),
    },
  };
}
