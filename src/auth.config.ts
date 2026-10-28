import type { NextAuthConfig } from "next-auth";
import { safeCallbackPath } from "@/lib/safe-path";

// Config leve (edge-safe), usada pelo proxy para proteger as rotas privadas.
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      const loggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const home = new URL(role === "ADMIN" ? "/dashboard" : "/conta", nextUrl);

      // Dashboard: somente admin. Cliente logado vai para a própria área.
      if (path.startsWith("/dashboard")) {
        if (!loggedIn) return false;
        return role === "ADMIN" ? true : Response.redirect(new URL("/conta", nextUrl));
      }
      // Carrinho: exige login e volta para ele depois (callbackUrl relativo, fixo).
      if (path.startsWith("/carrinho") && !loggedIn) {
        return Response.redirect(new URL("/login?callbackUrl=%2Fcarrinho", nextUrl));
      }
      // Área do cliente: qualquer usuário logado.
      if (path.startsWith("/conta")) return loggedIn;
      // Já logado não precisa ver login/cadastro.
      if (loggedIn && (path === "/login" || path === "/cadastro")) {
        const back = safeCallbackPath(nextUrl.searchParams.get("callbackUrl"));
        return Response.redirect(back ? new URL(back, nextUrl) : home);
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
