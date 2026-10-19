#!/usr/bin/env node
// Архітектурне правило «дизайн-система»: у застосунку кольори лише через семантичні токени.
// Шукає в src/ (поза src/components/ui і globals.css):
//   1) hex-кольори (#fff, #0f6b6e);
//   2) довільні кольори в класах Tailwind (bg-[#…], text-[oklch(…)]);
//   3) сирі палітри Tailwind (bg-zinc-900, text-rose-700, bg-white, text-black);
//   4) кольори в inline style (style={{ color: "…" }}).
// Виняток — коментар `design-ok: <причина>` у тому самому рядку.
// Використання: node scripts/check-design-tokens.mjs [--root <dir>] [--json]
// Код виходу: 0 — порушень немає, 1 — є порушення.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const args = process.argv.slice(2);
const rootIdx = args.indexOf("--root");
const root = rootIdx >= 0 ? args[rootIdx + 1] : process.cwd();
const asJson = args.includes("--json");

const SRC = join(root, "src");
const SKIP_DIRS = new Set(["node_modules", ".next"]);
const SKIP_FILES = [
  ["src", "components", "ui"].join(sep) + sep, // компоненти дизайн-системи — тут токени визначають вигляд
  ["src", "app", "globals.css"].join(sep), // тут токени оголошені
];
const EXT = /\.(tsx|ts|jsx|js|css)$/;

const PREFIX =
  "(?:bg|text|border|border-[trblxy]|ring|ring-offset|outline|fill|stroke|from|via|to|decoration|divide|placeholder|caret|accent|shadow)";
const PALETTE =
  "(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)";

const RULES = [
  {
    id: "hex",
    message: "hex-колір — візьміть семантичний токен (bg-primary, text-muted-foreground…)",
    re: /(?<![\w&/])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g,
  },
  {
    id: "arbitrary-color",
    message: "довільний колір у класі — додайте токен у globals.css і використайте його",
    re: new RegExp(`(?<![\\w-])${PREFIX}-\\[(?:#|rgb|hsl|oklch|oklab|lab|lch|color|var\\(--(?!color-))[^\\]]*\\]`, "g"),
  },
  {
    id: "raw-palette",
    message: "сира палітра Tailwind — замініть на семантичний клас із DESIGN.md",
    re: new RegExp(`(?<![\\w-])${PREFIX}-(?:${PALETTE}-\\d{2,3}|black|white)(?:\\/\\d{1,3})?(?![\\w-])`, "g"),
  },
  {
    id: "inline-style-color",
    message: "колір в inline style — використайте клас із токеном",
    re: /(?:\bcolor|backgroundColor|borderColor|background)\s*:\s*["'`](?!var\(--)[^"'`]+["'`]/g,
  },
];

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (EXT.test(name)) out.push(full);
  }
  return out;
}

const findings = [];
for (const file of walk(SRC)) {
  const rel = relative(root, file);
  if (SKIP_FILES.some((s) => rel === s || rel.startsWith(s))) continue;
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    if (/design-ok:/.test(line)) return;
    for (const rule of RULES) {
      if (rule.id === "inline-style-color" && !/\.(tsx|jsx)$/.test(file)) continue;
      for (const m of line.matchAll(rule.re)) {
        findings.push({ file: rel.split(sep).join("/"), line: i + 1, rule: rule.id, match: m[0], message: rule.message });
      }
    }
  });
}

if (asJson) {
  console.log(JSON.stringify({ ok: findings.length === 0, findings }, null, 2));
} else if (findings.length === 0) {
  console.log("check-design-tokens: OK — сирих кольорів поза src/components/ui немає.");
} else {
  for (const f of findings) console.log(`${f.file}:${f.line}  [${f.rule}]  ${f.match}  — ${f.message}`);
  const files = new Set(findings.map((f) => f.file)).size;
  console.log(`\ncheck-design-tokens: ${findings.length} порушень у ${files} файлах. Правила — у DESIGN.md.`);
}
process.exit(findings.length === 0 ? 0 : 1);
