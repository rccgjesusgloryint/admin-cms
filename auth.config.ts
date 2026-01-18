import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { Role } from "@prisma/client";

export const config = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Only fetch from database on initial sign-in (not on every request)
      // This avoids Prisma calls on Edge Runtime
      if (user?.email) {
        // Dynamic import only happens on sign-in (runs in Node.js route)
        const { prisma } = await import("@/lib/db");
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, member: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.member = dbUser.member;
        }
      }

      // On manual refresh trigger, refetch role from database
      if (trigger === "update" && token.id && typeof token.id === "string") {
        const { prisma } = await import("@/lib/db");
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { member: true },
        });
        if (dbUser) {
          token.member = dbUser.member;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.member = token.member as Role;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const publicRoutes = ["/", "/login"];
      const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

      if (!isPublicRoute && !isLoggedIn) {
        return false;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
