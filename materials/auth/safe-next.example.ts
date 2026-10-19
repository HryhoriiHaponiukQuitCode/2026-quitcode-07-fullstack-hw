// ПРИКЛАД (домашка WS7) → у вашому репо: src/lib/auth/safe-next.ts
// Чиста функція без "server-only": її використовує дія активації /auth/confirm (confirm-actions.example.ts), а
// unit-тест перевіряє без мережі й бази.

const FALLBACK = "/";
// Умовна адреса для розбору: нам потрібен лише шлях, а не справжній домен (.invalid не існує).
const BASE = "http://app.invalid";

/**
 * Куди вести після входу. Приймаємо лише відносний шлях ТОГО САМОГО сайту, інакше — FALLBACK.
 * Без цієї перевірки маємо open redirect: /auth/confirm?…&next=//evil.example переведе людину на чужий сайт
 * одразу після входу, коли вона довіряє сторінці.
 */
export function safeNextPath(next: unknown): string {
  // Лише рядок, що починається з одного "/": не "//host" (протокол-відносна адреса), не "/\host" (браузери читають
  // "\" як "/"), не "https://…" і не "javascript:…".
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return FALLBACK;
  }
  // Жодних пробілів, керівних символів і "\": URL-парсер викидає таб і перенесення рядка, тож "/\t/evil.example"
  // стане "//evil.example".
  if (/[\s\u0000-\u001f\u007f\\]/.test(next)) return FALLBACK;
  try {
    const url = new URL(next, BASE);
    // Після розбору адреса має лишитися на тому самому origin…
    if (url.origin !== BASE) return FALLBACK;
    // …і шлях не має починатися з "//" чи "/\": розбір нормалізує "/./" і "/../", тож "/.//evil.example"
    // (так само "/%2e//…" і "/x/..//…") стає "//evil.example" — а це вже адреса іншого сайту.
    if (url.pathname.startsWith("//") || url.pathname.startsWith("/\\")) return FALLBACK;
    return url.pathname + url.search + url.hash;
  } catch {
    return FALLBACK;
  }
}

// Тест (tests/auth/safe-next.test.ts) — назва з вашим AC ID, якщо PM має AC про посилання; інакше — без AC ID:
//
// import { describe, expect, it } from "vitest";
// import { safeNextPath } from "@/lib/auth/safe-next";
//
// // Так next приходить з адреси посилання: searchParams декодує %09 у таб.
// const fromLink = (raw: string) => new URLSearchParams(`next=${raw}`).get("next");
//
// const EVIL = [
//   "//evil.example",
//   "/\\evil.example",
//   "https://evil.example",
//   "javascript:alert(1)",
//   "/\t/evil.example",
//   fromLink("/%09/evil.example"),
//   fromLink("/%0a/evil.example"),
//   "/.//evil.example",
//   "/%2e//evil.example",
//   "/x/..//evil.example",
//   "/x/%2e%2e//evil.example",
//   " /evil.example",
// ];
//
// const CASES: [unknown, string][] = [
//   ["/account/password", "/account/password"],
//   ["/account/password?tab=1", "/account/password?tab=1"],
//   [null, "/"],
//   [undefined, "/"],
//   ...EVIL.map((next): [unknown, string] => [next, "/"]),
// ];
//
// describe("safeNextPath", () => {
//   it.each(CASES)("%j → %s", (next, expected) => {
//     expect(safeNextPath(next)).toBe(expected);
//   });
//
//   it("результат ніколи не веде на інший сайт", () => {
//     const ORIGIN = "https://app.example.test";
//     for (const next of [...EVIL, "/%2509/evil.example", "/a/../b", "/#//evil.example"]) {
//       const path = safeNextPath(next);
//       expect(path.startsWith("/")).toBe(true);
//       expect(path.startsWith("//") || path.startsWith("/\\")).toBe(false);
//       expect(new URL(path, ORIGIN).origin).toBe(ORIGIN);
//     }
//   });
// });
