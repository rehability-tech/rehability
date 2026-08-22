#!/usr/bin/env node
/**
 * Uruchamia polecenie z podmienionym plikiem .env.
 *
 * Po co: Prisma 5.22 czyta wyłącznie `.env` i NIE ma flagi `--env-file`
 * (weszła dopiero w Prisma 6). Bez tego opakowania `npm run dev` gadałoby
 * z branchem Neona, a `prisma db push` z bazą główną — czyli dokładnie ten
 * rodzaj cichego rozjazdu, którego chcemy uniknąć.
 *
 * Świadomie bez `dotenv-cli`: to jedyne, czego nam brakowało, a wrapper ma
 * 30 linii i działa tak samo w PowerShellu, cmd i bashu.
 *
 * Użycie:
 *   node scripts/with-env.mjs .env.neon-test -- npx prisma db push
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [envFile, ...rest] = process.argv.slice(2);
const command = rest[0] === "--" ? rest.slice(1) : rest;

if (!envFile || command.length === 0) {
  console.error(
    "Użycie: node scripts/with-env.mjs <plik-env> -- <polecenie...>",
  );
  process.exit(1);
}

const envPath = path.resolve(process.cwd(), envFile);
if (!fs.existsSync(envPath)) {
  console.error(
    `\n✖ Brak pliku ${envFile}.\n` +
      `  Utwórz go i wpisz DATABASE_URL brancha Neona — instrukcja\n` +
      `  w docs/baza-testowa.md.\n`,
  );
  process.exit(1);
}

// Prosty parser: KLUCZ=wartość, komentarze i puste linie pomijamy.
// Wartości w cudzysłowach rozbieramy, bo Neon podaje URL-e w apostrofach.
const parsed = {};
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
  if (!match || line.trim().startsWith("#")) continue;
  parsed[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

if (!parsed.DATABASE_URL) {
  console.error(`\n✖ ${envFile} nie zawiera DATABASE_URL.\n`);
  process.exit(1);
}

// Pokazujemy, DO CZEGO się łączymy — bez danych logowania. Jedna linia,
// która oszczędza godzinę zastanawiania się „czemu tych danych tu nie ma".
try {
  const url = new URL(parsed.DATABASE_URL);
  console.log(
    `→ baza: ${url.hostname}${url.pathname} (z ${envFile})`,
  );
} catch {
  console.log(`→ baza: (nie udało się odczytać hosta z DATABASE_URL)`);
}

// Plik env NADPISUJE bieżące środowisko — o to cała rzecz.
const child = spawn(command[0], command.slice(1), {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, ...parsed },
});

child.on("exit", (code) => process.exit(code ?? 1));
