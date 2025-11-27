import { Role } from "@prisma/client";
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      member: Role;
    } & DefaultSession["user"];
  }

  interface User {
    member: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    member: Role;
  }
}
