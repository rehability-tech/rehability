// Robust JSON parser for Gemini model output.
//
// Gemini with responseMimeType: "application/json" *usually* returns clean
// JSON, but in practice we still see occasional drift:
//   • markdown fences ```json ... ```
//   • smart quotes (“ ” ‘ ’) inside strings
//   • trailing commas inside objects/arrays
//   • stray prose before/after the JSON object
//   • unescaped newlines inside strings (rare but happens)
//
// This helper tries a sequence of progressively more aggressive recoveries
// and throws ModelJsonParseError if none work, so the caller can surface a
// meaningful error and the client-side limiter can retry.

export class ModelJsonParseError extends Error {
  constructor(message: string, public readonly raw: string) {
    super(message);
    this.name = "ModelJsonParseError";
  }
}

function stripMarkdownFences(text: string): string {
  // ```json\n...\n``` or ```\n...\n```
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  if (fenceMatch) return fenceMatch[1].trim();
  return text;
}

function extractFirstJsonBlock(text: string): string {
  // Locate the first balanced { ... } or [ ... ] in the string, ignoring
  // braces inside string literals.
  const firstObj = text.indexOf("{");
  const firstArr = text.indexOf("[");
  if (firstObj === -1 && firstArr === -1) return text;
  const start =
    firstObj === -1
      ? firstArr
      : firstArr === -1
        ? firstObj
        : Math.min(firstObj, firstArr);
  const openChar = text[start];
  const closeChar = openChar === "{" ? "}" : "]";

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return text.slice(start);
}

function stripTrailingCommas(text: string): string {
  return text.replace(/,(\s*[}\]])/g, "$1");
}

function normalizeSmartQuotes(text: string): string {
  // Only replace smart quotes that act as JSON delimiters — heuristic
  // approach. Inside well-formed JSON strings the model normally outputs
  // straight quotes; smart quotes show up when the model "wrote prose."
  return text
    .replace(/[‘’‚‹›]/g, "'")
    .replace(/[“”„«»]/g, '"');
}

export function parseModelJson<T = unknown>(raw: string): T {
  const original = raw;
  const candidates: string[] = [];

  const step1 = raw.trim();
  candidates.push(step1);

  const step2 = stripMarkdownFences(step1);
  if (step2 !== step1) candidates.push(step2);

  const step3 = extractFirstJsonBlock(step2);
  if (step3 !== step2) candidates.push(step3);

  candidates.push(stripTrailingCommas(step3));
  candidates.push(normalizeSmartQuotes(stripTrailingCommas(step3)));

  let lastError: unknown;
  for (const c of candidates) {
    if (!c) continue;
    try {
      return JSON.parse(c) as T;
    } catch (err) {
      lastError = err;
    }
  }

  const msg =
    lastError instanceof Error
      ? lastError.message
      : "Unknown JSON parse failure";
  throw new ModelJsonParseError(
    `Nie udało się sparsować odpowiedzi modelu: ${msg}`,
    original,
  );
}
