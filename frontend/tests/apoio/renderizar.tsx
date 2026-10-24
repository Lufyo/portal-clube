import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../../src/App";
import { AuthProvider } from "../../src/contexts/AuthProvider";
import type { Papel, Usuario } from "../../src/types/auth";
import { apiFalsa } from "./apiFalsa";

// Abre o app inteiro (rotas, AuthProvider, hooks e api.ts) já numa URL,
// como o main.tsx faz, mas com um roteador em memória.
export function abrirApp(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
}

// Simula quem já entrou antes: token salvo e o /auth/me respondendo
export function jaLogadoComo(papel: Papel, nome = "Maria") {
  const usuario: Usuario = { id: "u1", nome, email: "maria@exemplo.com", papel };
  localStorage.setItem("portal_token", "token-salvo");
  apiFalsa.responder("GET", "/auth/me", 200, usuario);
  return usuario;
}
