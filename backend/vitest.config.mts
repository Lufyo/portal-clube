import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Troca o Supabase de verdade por um falso em memória em todos os testes
    setupFiles: ["tests/apoio/preparacao.ts"],
  },
});
