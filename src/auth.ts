import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeCredentials } from "@/lib/auth-credentials";
import { db } from "@/lib/db";
import { refreshToken } from "@/lib/session-refresh";
import { authConfig } from "./auth.config";

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  callbacks: {
    ...authConfig.callbacks,
    // Roda no Node (o proxy usa só authConfig, edge): aqui pode consultar o banco.
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);
      return refreshToken(token, (id) => db.user.findUnique({ where: { id }, select: { role: true, disabledAt: true } }));
    },
  },
  providers: [
    Credentials({
      authorize: (raw, request) => authorizeCredentials(raw, request),
    }),
  ],
});
