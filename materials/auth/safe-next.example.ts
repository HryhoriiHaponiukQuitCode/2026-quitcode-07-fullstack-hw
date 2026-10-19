// ПРИКЛАД (домашка WS7) → у вашому репо: src/lib/auth/safe-next.ts
// Чиста функція без "server-only": її використовує src/app/auth/confirm/route.ts (confirm-route.example.ts), а
// unit-тест перевіряє без мережі й бази.

const FALLBACK = "/";

/**
 * Куди вести після входу. Приймаємо лише відносний шлях ТОГО САМОГО сайту, інакше — FALLBACK.
 * Без цієї перевірки маємо open redirect: /auth/confirm?…&next=//evil.example переведе людину на чужий сайт
 * одразу після входу, коли вона довіряє сторінці.
 */
export function safeNextPath(next: string | null | undefined, origin: string): string {
  if (!next) return FALLBACK;
  // Лише "/…": не "//host" (протокол-відносна адреса), не "/\host" (браузери читають "\" як "/"),
  // не "https://…" і не "javascript:…".
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return FALLBACK;
  // Керівні символи (таб, перенесення рядка) URL-парсер викидає: "/\t/evil.example" стане "//evil.example".
  if (/[\u0000-\u001f\u007f]/.test(next)) return FALLBACK;
  // Остаточна перевірка: після розбору адреса має лишитися на нашому origin.
  try {
    const url = new URL(next, origin);
    if (url.origin !== origin) return FALLBACK;
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
// const ORIGIN = "https://app.example.test";
// describe("safeNextPath", () => {
//   it.each([
//     ["/account/password", "/account/password"],
//     ["/account/password?tab=1", "/account/password?tab=1"],
//     ["//evil.example", "/"],
//     ["/\\evil.example", "/"],
//     ["https://evil.example", "/"],
//     ["javascript:alert(1)", "/"],
//     ["/\t/evil.example", "/"],
//     [null, "/"],
//   ])("%s → %s", (next, expected) => {
//     expect(safeNextPath(next, ORIGIN)).toBe(expected);
//   });
// });
