# Матеріали WS7: що куди покласти у вашому репо

Шаблон проєкту цього тижня **не змінюється**. Нові файли розробник копіює звідси у своє репо `<я>/<team-slug>` —
у PR «Реалізація» дизайн-системи (крок 2 [walkthrough розробника](../docs/walkthrough-dev.md)). В описі PR: «взято
з `koldovsky/2026-quitcode-07-fullstack-hw/materials/…`». Використання матеріалів балів не знімає — для цього вони й
існують. Знімає лише переказ прикладів (ADR, підказок) замість власної роботи.

| Файл тут | Куди у вашому репо | Навіщо |
|---|---|---|
| [`scripts/check-design-tokens.mjs`](scripts/check-design-tokens.mjs) | `scripts/check-design-tokens.mjs` | правило «лише токени»: hex, `bg-[#…]`, сирі палітри (`zinc-500`, `bg-white`), кольори в inline style поза `src/components/ui` і `globals.css`; виняток — коментар `design-ok: <причина>` |
| [`scripts/check-server-boundary.mjs`](scripts/check-server-boundary.mjs) | `scripts/check-server-boundary.mjs` | правило «секретний ключ лише на сервері»: `SUPABASE_SECRET_KEY` лише в `src/lib/supabase/admin.ts` з `import "server-only"`, admin-клієнт імпортують лише серверні файли, жодного `NEXT_PUBLIC_*SECRET*` |
| [`workflows/architecture.yml`](workflows/architecture.yml) | `.github/workflows/architecture.yml` | окремий workflow з двома jobs: «Дизайн-система: лише токени», «Секретний ключ лише на сервері». `ci.yml` не чіпаємо: на назвах його jobs тримається ruleset |
| [`DESIGN.template.md`](DESIGN.template.md) | `DESIGN.md` у корені | шаблон дизайн-системи; `CLAUDE.md` імпортує `@DESIGN.md` |
| [`adr/`](adr/) | — (формат для вашого `docs/decisions/NNNN-….md`) | два приклади ADR з іншого домену |
| [`auth/confirm-route.example.ts`](auth/confirm-route.example.ts) | за потреби: `src/app/auth/confirm/route.ts` | маршрут `/auth/confirm` для запрошень (`verifyOtp` → сесія → `next`); потрібен, лише якщо ваш зріз запрошує користувачів |
| [`auth/safe-next.example.ts`](auth/safe-next.example.ts) | разом з ним: `src/lib/auth/safe-next.ts` (+ тест у коментарі) | перевірка `next`: лише відносний шлях свого сайту, захист від open redirect |
| [`slice2-hints.md`](slice2-hints.md) | — | кандидати зрізу 2 для кожного брифу й шаблони відмовних AC (для PM) |

## Команди

З кореня вашого репо, у гілці `task/design-system`:

```bash
mkdir -p .github/workflows
B=https://raw.githubusercontent.com/koldovsky/2026-quitcode-07-fullstack-hw/main/materials
curl -sLo scripts/check-design-tokens.mjs  $B/scripts/check-design-tokens.mjs
curl -sLo scripts/check-server-boundary.mjs $B/scripts/check-server-boundary.mjs
curl -sLo .github/workflows/architecture.yml $B/workflows/architecture.yml
curl -sLo DESIGN.md $B/DESIGN.template.md
npm pkg set scripts.check:design="node scripts/check-design-tokens.mjs" \
  scripts.check:boundary="node scripts/check-server-boundary.mjs"
```

PowerShell: `$B = "https://raw.githubusercontent.com/koldovsky/2026-quitcode-07-fullstack-hw/main/materials"`, далі
`curl.exe -sLo …` (у Windows PowerShell 5.1 `curl` — інша команда), `New-Item -ItemType Directory -Force
.github/workflows` замість `mkdir -p`.

У `package.json` з'являться два скрипти:

```json
"check:design": "node scripts/check-design-tokens.mjs",
"check:boundary": "node scripts/check-server-boundary.mjs"
```

## Що покажуть перевірки

```bash
npm run check:design     # шаблон проєкту: 11 порушень у 2 файлах (src/app/page.tsx, src/app/login/page.tsx)
npm run check:boundary   # шаблон проєкту: OK
node scripts/check-design-tokens.mjs --json   # той самий результат у JSON — зручно дати агенту
node scripts/check-design-tokens.mjs --root <тека>   # перевірити інший клон
```

Код виходу `1` при порушеннях — тому job у CI стає червоним. Обидва скрипти без залежностей: лише Node 24.

`architecture.yml` запускає обидва скрипти на кожен PR і push у `main`. Ці jobs не входять в обов'язкові перевірки
ruleset-у `solo-main`, тож злиття вони не блокують. Доказом для рубрики є зелений прогін у PR і на `main`. Новий
власний скрипт додавайте третім job у той самий `architecture.yml`.
