import dns from "node:dns/promises";
import net from "node:net";

// Ochrona przed SSRF: zanim serwer pobierze URL podany przez klienta,
// upewniamy się, że host nie wskazuje na pętlę zwrotną / sieć prywatną /
// endpoint metadanych chmury (169.254.169.254).

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local + cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("::ffff:")) {
    return isPrivateIp(lower.replace("::ffff:", ""));
  }
  return false;
}

export class UnsafeUrlError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "UnsafeUrlError";
  }
}

/**
 * Waliduje, że URL jest publicznym zasobem http(s). Rozwiązuje DNS i odrzuca,
 * jeśli którykolwiek adres jest prywatny/loopback/link-local.
 * Rzuca `UnsafeUrlError` z kodem przy odrzuceniu.
 *
 * Uwaga: pozostaje teoretyczne okno DNS rebinding między tą walidacją a fetch —
 * akceptowalne dla endpointu chronionego rolą admina.
 */
export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("INVALID_URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("INVALID_SCHEME");
  }

  const host = url.hostname;

  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new UnsafeUrlError("PRIVATE_HOST");
    return url;
  }

  if (host === "localhost" || host.endsWith(".localhost")) {
    throw new UnsafeUrlError("PRIVATE_HOST");
  }

  let records: { address: string }[];
  try {
    records = await dns.lookup(host, { all: true });
  } catch {
    throw new UnsafeUrlError("DNS_FAIL");
  }

  if (records.length === 0) throw new UnsafeUrlError("DNS_FAIL");
  for (const r of records) {
    if (isPrivateIp(r.address)) throw new UnsafeUrlError("PRIVATE_HOST");
  }

  return url;
}
