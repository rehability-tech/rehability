import { DefaultSession } from "next-auth";
import { Role } from "@/generated/prisma"; // Dostosuj ścieżkę do wygenerowanej Prismy z Twojego schema (output)

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role | string;
      /**
       * Dostęp do piaskownicy rabatów nadany per konto (User.sandboxAccess).
       * Administrator ma dostęp niezależnie od tej flagi — patrz
       * `viewerCanUseSandbox` w src/lib/discounts/sandbox.ts.
       */
      sandboxAccess: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role | string;
    sandboxAccess?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role | string;
    sandboxAccess?: boolean;
  }
}
