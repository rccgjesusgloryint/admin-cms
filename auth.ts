import NextAuth from "next-auth";

import { config } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 168 * 60 * 60,
  },
  ...config,
});
