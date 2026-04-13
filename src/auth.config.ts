import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

// Config without database adapter - used in proxy/middleware (Edge)
export default {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {},
      async authorize() {
        return null; // Real auth happens in auth.ts with Prisma
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
