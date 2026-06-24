import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

export default defineConfig({
  // `vite-tsconfig-paths` czyta `paths` z tsconfig.json, więc alias `@/...`
  // działa w testach dokładnie tak samo jak w aplikacji (np. `@/lib/prisma`).
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // Pliki z logiką serwerową mają `import "server-only"`. Ten pakiet
      // CELOWO rzuca błędem, gdy ktoś zaimportuje go poza środowiskiem
      // serwera (ochrona przed wyciekiem kodu na klienta). W testach
      // uruchamianych w Node nie ma znaczenia — podmieniamy go na pusty plik.
      "server-only": path.resolve(__dirname, "test/stubs/server-only.ts"),
    },
  },
  test: {
    // Logika domenowa nie dotyka DOM-u — szybsze, lżejsze środowisko Node.
    environment: "node",
    // Pliki testów rozpoznajemy po `.test.ts`.
    include: ["test/**/*.test.ts", "src/**/*.test.ts"],
    globals: false, // importujemy `describe/it/expect` jawnie (czytelniej).
  },
});
