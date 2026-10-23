import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // O plugin do Tailwind processa as classes utilitárias automaticamente
  plugins: [react(), tailwindcss()],
});