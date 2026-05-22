import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = ["biuro@kocikdev.com", "piotrsiemaszkofizjo@gmail.com"];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/logowanie",
  },
  callbacks: {
    async signIn() {
      return true;
    },

    async jwt({ token, user }) {
      // 1. Logowanie po raz pierwszy (rejestracja) - wyciągamy z obiektu user
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // 2. Kolejne żądania sesji (user jest undefined) - dociągamy aktualną rolę z DB
      if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role; // Pociągnie wartość typu Enum z bazy (USER lub ADMIN)
        }
      }

      // 3. Twarde nadpisanie uprawnień dla administratorów z tablicy (zabezpieczenie)
      if (token.email && ADMIN_EMAILS.includes(token.email)) {
        token.role = "ADMIN";
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
