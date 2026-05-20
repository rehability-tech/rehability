import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// Lista e-maili, które mają automatycznie dostać uprawnienia ADMINA
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
    // 1. Sprawdzamy e-mail w momencie pierwszego logowania/rejestracji
    async signIn({ user }) {
      if (user && user.email) {
        // Jeśli e-mail jest na liście adminów, przypisujemy mu rolę ADMIN
        if (ADMIN_EMAILS.includes(user.email)) {
          user.role = "ADMIN";
        }
        // W przeciwnym wypadku obiekt user zachowa rolę z bazy danych lub domyślny fallback
      }
      return true; // Zwrócenie true pozwala na kontynuowanie logowania
    },

    // 2. Zapisujemy rolę z bazy danych / callbacku signIn do tokena JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    // 3. Przekazujemy rolę z tokena do sesji widocznej w aplikacji
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
