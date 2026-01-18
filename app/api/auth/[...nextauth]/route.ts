import { handlers } from "@/auth";

// Force Node.js runtime for auth routes (Prisma doesn't work on Edge)
export const runtime = "nodejs";

export const { GET, POST } = handlers;
