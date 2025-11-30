import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { Role } from "@prisma/client";
export const config = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Add other providers as needed
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign in, fetch the full user from database
      if (user?.email) {
        // Query by email since OAuth provider ID !== database ID
        const { prisma } = await import("@/lib/db");
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, member: true },
        });

        if (dbUser) {
          // Use the database user's ID and role
          token.id = dbUser.id;
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
      console.log("isLoggedIn", isLoggedIn);
      console.log("expires", auth?.expires);
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
