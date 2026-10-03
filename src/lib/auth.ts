import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/roles";
import { rateLimit } from "@/lib/rate-limit";

function getClientIp(req?: { headers?: Record<string, string | string[] | undefined> | Headers }): string {
  if (req && typeof Headers !== "undefined" && req.headers instanceof Headers) {
    return (
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip")?.trim() ||
      "unknown"
    );
  }

  const forwarded = req?.headers && "x-forwarded-for" in req.headers ? req.headers["x-forwarded-for"] : undefined;
  const realIp = req?.headers && "x-real-ip" in req.headers ? req.headers["x-real-ip"] : undefined;

  const value = Array.isArray(forwarded)
    ? forwarded[0]
    : Array.isArray(realIp)
      ? realIp[0]
      : typeof forwarded === "string"
        ? forwarded
        : typeof realIp === "string"
          ? realIp
          : "";

  return value.split(",")[0]?.trim() || "unknown";
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const ip = getClientIp(req as { headers?: Record<string, string | string[] | undefined> | Headers });
        const limit = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
        if (!limit.allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        if (user.status === "BLOCKED" || user.status === "SUSPENDED") return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
