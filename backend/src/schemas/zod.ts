import { z } from "zod";

// Todos os schemas importam o Zod daqui. Cada campo tem sua própria mensagem;
// o idioma português fica como rede de segurança para qualquer caso sem
// mensagem própria, para nenhuma resposta sair em inglês (RNF06).
z.config(z.locales.pt());

export { z };
