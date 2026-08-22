import { DefaultSession } from "next-auth";
import { Role } from "@/generated/prisma"; // Dostosuj ścieżkę do wygenerowanej Prismy z Twojego schema (output)

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role | string;
      /** Konto widzi treści sandbox (admin z urzędu, user przez flagę w bazie). */
      sandboxAccess?: boolean;
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
