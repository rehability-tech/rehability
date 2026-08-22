import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma";

const ADMIN_EMAILS = ["biuro@kocikdev.com", "piotrsiemaszko.fizjo@gmail.com"];

const MOCK_USERS: Record<string, { email: string; name: string; role: Role }> =
  {
    "biuro@kocikdev.com": {
      email: "biuro@kocikdev.com",
      name: "Michał (Mock Admin)",
      role: "ADMIN",
    },
    "piotr.eher@gmail.com": {
      email: "piotr.eher@gmail.com",
      name: "Piotr (Mock User)",
      role: "USER",
    },
    "mch.kocik@gmail.com": {
      email: "mch.kocik@gmail.com",
      name: "Michał (Mock User)",
      role: "USER",
    },
  };

const isDev = process.env.NODE_ENV === "development";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    ...(isDev
      ? [
          CredentialsProvider({
            id: "dev-mock",
            name: "Dev Mock Login",
            credentials: {
              email: { label: "Email", type: "text" },
            },
            async authorize(credentials) {
              if (!isDev) return null;

              const email = credentials?.email?.trim().toLowerCase();
              if (!email) return null;

              const mock = MOCK_USERS[email];
              if (!mock) return null;

              const user = await prisma.user.upsert({
                where: { email: mock.email },
                update: { role: mock.role },
                create: {
                  email: mock.email,
                  name: mock.name,
                  role: mock.role,
                  emailVerified: new Date(),
                },
              });

              return {
                id: user.id,
                email: user.email!,
                name: user.name,
                image: user.image,
                role: user.role,
              };
            },
          }),
        ]
      : []),
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

    async jwt({ token, user, trigger, session }) {
      // 0. Aktualizacja sesji z klienta (useSession().update) — np. po zmianie
      //    imienia/zdjęcia w profilu. Wartości lecą w `session`.
      if (trigger === "update" && session) {
        const s = session as { name?: string; image?: string };
        if (typeof s.name === "string") token.name = s.name;
        if (typeof s.image === "string") token.picture = s.image;
      }

      // 1. Logowanie po raz pierwszy (rejestracja) - wyciągamy z obiektu user
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // 2. Każde kolejne żądanie sesji — synchronizujemy id ORAZ rolę z bazy po
      //    e-mailu. Kluczowe: token JWT żyje w ciasteczku, więc po resecie/
      //    reseedzie bazy (dev) zapisane `token.id` wskazywałoby na nieistniejący
      //    rekord User → naruszenie klucza obcego przy każdym zapisie powiązanym
      //    z userId (Enrollment, Booking, HealthProfile…). Reconcile po e-mailu
      //    (pole @unique) utrzymuje aktualne id i rolę.
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true, sandboxAccess: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role; // Pociągnie wartość typu Enum z bazy (USER lub ADMIN)
          // Dostęp do piaskownicy rabatów nadany per konto — czytany z bazy
          // przy każdym żądaniu, więc odebranie go działa od razu (nie czeka
          // na wygaśnięcie tokena).
          token.sandboxAccess = dbUser.sandboxAccess;
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
        session.user.sandboxAccess = token.sandboxAccess ?? false;
      }
      return session;
    },
  },
};
