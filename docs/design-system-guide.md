# Гайд: дизайн-система для проєкту з AI-агентом

Цей гайд — до треку розробника, завдання B. Покроковий порядок дій і промпти — у
[walkthrough розробника, крок 2](walkthrough-dev.md#2-дизайн-система-34-год--трек-b). Тут — що і чому.

## Навіщо

Попросіть трьох розробників з агентами зробити сторінку «Мої заявки». Вийдуть три різні кнопки: агент без правил
щоразу бере кольори й відступи зі своїх дефолтів. Через тиждень в одному застосунку п'ять відтінків сірого, а
виправлення «зробити кнопки однаковими» торкається кожного файлу.

Дизайн-система в нашому проєкті — це чотири речі, і кожна має свого читача:

| Що | Де | Хто читає |
|---|---|---|
| Правила вигляду словами: тон, кольори за змістом, стани, доступність, Do/Don't | `DESIGN.md` у корені | людина й агент (`CLAUDE.md` імпортує `@DESIGN.md`) |
| Токени — значення кольорів, радіусів, шрифтів | `src/app/globals.css`: `:root`, темна тема, `@theme inline` | Tailwind 4 і компоненти |
| Компоненти — кнопка, поле, таблиця, діалог | `src/components/ui/` (shadcn/ui — код у вашому репо) | сторінки й агент |
| Перевірка, що сторінки не обходять токени | `scripts/check-design-tokens.mjs` у `.github/workflows/architecture.yml` | CI |

Вхід для дизайн-системи — розділ «Вигляд і тон» у продукті PM (бонус E треку PM, у вас — `requirements/product.md`).
Якщо його немає, беріть бриф і бачення продукту. **Без брендингу клієнта:** жодних справжніх кольорів, логотипів,
шрифтів і назв.

## Шлях 1: Claude Design

**Claude Design** — тип артефакту в claude.ai: його можна створити в чаті, у Claude Code і на вкладці Artifacts.
Design systems у Claude Design зараз — **beta на планах Pro, Max, Team і Enterprise**. Окремий сайт
`claude.ai/design` закривається 14.12.2026, тож ми працюємо лише з артефактами.

**Що всередині артефакту Design System:**

- `project/README.md` — бренд-бук: тон, кольори з поясненням, типографіка, відступи, радіуси, стани, доступність;
- `tokens.json` — теми, кольори, типографіка, відступи, радіуси;
- компоненти з `preview.html` — як вони виглядають.

Агенти читають саме `project/README.md`.

**Як наповнити** — один із трьох способів:

- **з чату:** опис, файли, Figma, логотипи (лише вигадані);
- **з Claude Code** — `/design-sync`: з React-дизайн-системи репо. Перший раз може йти годинами — не на цей тиждень;
- **онбординг** самого Claude Design.

Найпростіше — з чату. Попросіть створити артефакт типу Design System (точну назву типу перевірте в інтерфейсі):

```text
Створи артефакт типу Design System для навчального вебзастосунку «<продукт одним реченням>».
Вигляд і тон (від PM): <вставте розділ «Вигляд і тон» з requirements/product.md або бачення продукту>.
Вимоги:
- семантичні токени з іменами shadcn/ui: background, foreground, card, popover, primary, secondary, muted, accent,
  destructive, border, input, ring і пари *-foreground; статуси домену: <перелік статусів зі зрізу, якщо є>;
- кольори в OKLCH, світла й темна тема; контраст тексту ≥ 4.5:1 на своєму тлі, межі полів і кільце фокусу ≥ 3:1;
- шрифт Geist; радіус і шкала відступів;
- компоненти: Button (основна, другорядна, небезпечна, контурна), Input + Label, Card, Table, Badge для статусів,
  Dialog, повідомлення про помилку й порожній стан;
- статус ніколи не лише кольором — завжди з підписом;
- без логотипів і назв справжніх компаній.
```

**Перенесення в репо.** Дайте агенту посилання на артефакт:

```text
Прочитай project/README.md і tokens.json артефакту дизайн-системи <посилання>. Перенеси правила в DESIGN.md (структура
— розділи цього файлу, не змінюй їх), а токени — у src/app/globals.css: :root, @media (prefers-color-scheme: dark),
@theme inline з --color-* на кожен токен. Посилання на артефакт — першим рядком DESIGN.md.
```

Якщо ваш агент не відкриває артефакт (Cursor, інший інструмент або немає доступу), відкрийте `project/README.md` і
`tokens.json` в артефакті самі й вставте їхній текст у чат агента. Артефакт приватний за замовчуванням. Посилання в
`DESIGN.md` — для вас, а для рецензента в PR — знімок артефакту.

## Шлях 2: без Claude Design — `DESIGN.md` з AI-чатом

Підійде будь-який AI-чат або ваш агент. Шаблон — [`materials/DESIGN.template.md`](../materials/DESIGN.template.md),
промпт — у [walkthrough, крок 2.2](walkthrough-dev.md#22-designmd). Результат той самий: `DESIGN.md` з таблицею
токенів і контрастом.

**Формат `DESIGN.md` з Google Labs** (alpha) — YAML-токени плюс markdown-обґрунтування. Його розділи: Overview,
Colors, Typography, Layout, Elevation, Shapes, Components, Do's and Don'ts. У нього є CLI `@google/design.md`: lint з
перевіркою WCAG і export у CSS для Tailwind. Наш шаблон сумісний за змістом. Брати цей формат і CLI — за бажанням,
рубрика їх не вимагає.

## Спільне для обох шляхів

### Токени Tailwind 4

У шаблоні Tailwind 4 підключено без `tailwind.config.js`: тема живе в CSS. Структура `src/app/globals.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";        /* додає shadcn init */
@import "shadcn/tailwind.css";   /* додає shadcn init */

:root {
  --radius: 0.625rem;
  --background: oklch(<L> <C> <H>);           /* ваші значення з DESIGN.md */
  --foreground: oklch(<L> <C> <H>);
  --primary: oklch(<L> <C> <H>);
  --primary-foreground: oklch(<L> <C> <H>);
  /* … card, popover, secondary, muted, accent, destructive, border, input, ring, статуси домену */
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: oklch(<L> <C> <H>);
    --foreground: oklch(<L> <C> <H>);
    /* … ті самі імена, інші значення */
  }
}

@theme inline {
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* … --color-<токен> на кожен токен */
  --radius-md: calc(var(--radius) - 2px);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}
```

`<L> <C> <H>` — ваші значення з `DESIGN.md` (світлота, насиченість, відтінок). Палітра демо чи колеги — 0 за B.

- **Три місця для одного токена.** `:root` (світла тема) → темна тема → `--color-<назва>` у `@theme inline`. Тоді
  Tailwind створює утиліти `bg-<назва>`, `text-<назва>`, `border-<назва>`. Новий токен «статус: на розгляді» — це
  `--status-pending` і `--status-pending-foreground` в обох темах плюс два `--color-…`, і в сторінці — `bg-status-pending
  text-status-pending-foreground`.
- **Семантичні пари.** Кожне тло має свій колір тексту: `primary`/`primary-foreground`, `muted`/`muted-foreground`,
  `card`/`card-foreground`. Агент бере пару, а не вгадує контраст.
- **Темна тема — за системою** (`prefers-color-scheme`), як у шаблоні. Вбудований варіант `dark:` у Tailwind 4 теж
  слідує за системою, тому `dark:`-класи компонентів shadcn працюють. Хочете перемикач теми — це інший спосіб (клас
  `.dark`), і тоді і токени, і `@custom-variant dark` мають бути під клас. Змішувати два способи не можна.
- **`--color-*: initial` не вмикаємо.** Він прибирає дефолтну палітру Tailwind, але мовчки ламає наявні класи
  (`bg-zinc-900` просто зникає без помилки). Видиму перевірку дає `check:design`.
- **`font-family: Arial` шаблону прибираємо:** шрифт задає `--font-sans` (Geist).

### shadcn/ui

shadcn/ui — не бібліотека в `node_modules`, а **код компонентів у вашому репо** (`src/components/ui/`). Ви їх
читаєте, змінюєте, і агент бачить, як вони зроблені. CLI 4.x з липня 2026 за замовчуванням ставить компоненти на
**Base UI**. Якщо потрібен Radix — `--base radix`.

**Перевірено на налаштуванні шаблону** (Tailwind 4 через `@tailwindcss/turbopack`, без PostCSS-конфігу; CLI
`shadcn@latest` = 4.22.1, 19.10.2026):

```bash
npx shadcn@latest init -d --no-monorepo
npx shadcn@latest add input label card table badge dialog select alert -y
```

- Якщо `@latest` уже новіший і поводиться інакше, запустіть ті самі команди з `npx shadcn@4.22.1`. Ця версія
  перевірена; її поведінка за замовчуванням уже раз змінювалась (Base UI з липня 2026).
- `init -d` бере налаштування за замовчуванням (стиль `base-nova`, Base UI). Він знаходить Next.js і Tailwind 4 без
  PostCSS. Створює `components.json` (аліаси `@/components/ui`, `@/lib/utils`), `src/lib/utils.ts` (функція `cn`),
  `src/components/ui/button.tsx`. Додає залежності `@base-ui/react`, `class-variance-authority`, `cn`, `lucide-react`,
  `shadcn`, `tw-animate-css`.
- `--dry-run` у `init` немає (лише в `add`). Тому запускайте `init` у гілці: якщо щось не так, `git restore` і
  `git clean` її повернуть.
- **Після `init` — обов'язково виправте `globals.css`.** `init` переписує його своєю нейтральною палітрою і додає дві
  пастки:
  1. **`@custom-variant dark (&:is(.dark *));`** перемикає `dark:` на клас `.dark`, а ваша тема слідує за системою.
     Видаліть цей рядок.
  2. **`--font-sans: var(--font-sans);`** — самопосилання, шрифт Geist губиться. Поверніть
     `var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif`.

  Значення `:root` і темної теми замініть своїми з `DESIGN.md`. Рядки `@import "tw-animate-css";` і
  `@import "shadcn/tailwind.css";` залиште: другий дає компонентам Base UI варіанти станів
  (`data-open`, `data-closed` тощо).
- Перевірка: `npm run build` (є `ƒ Proxy (Middleware)`), `npm run lint`, `npm run typecheck`.
- **Компоненти змінюють лише в `src/components/ui/`.** Скрипт `check-design-tokens.mjs` цю теку пропускає: тут токени
  визначають вигляд. Але компонент shadcn сам бере кольори з токенів (`bg-primary`, `border-input`). Якщо ви вписуєте
  в нього `bg-zinc-900`, ви не змінили дизайн-систему, а сховали порушення.

**Агенту — skill і MCP shadcn** (за бажанням): `npx skills add shadcn/ui` додає скіл зі знанням компонентів, а
`npx shadcn@latest mcp init --client claude` — MCP, через який агент шукає й додає компоненти з реєстру.

### Правила для агента

- **`CLAUDE.md`:** `@DESIGN.md` поруч з `@AGENTS.md` — Claude Code читає дизайн-систему в кожній сесії.
- **`AGENTS.md`:** розділ «Дизайн-система» — текст у [walkthrough, крок 2.5](walkthrough-dev.md#25-правила-для-агента).
  Cursor читає `AGENTS.md`.
- **Пріоритет `/design` у Claude Code:** ваш промпт > дизайн-система проєкту (`CLAUDE.md` чи theme-файл) > дефолти
  скіла. Тобто без `DESIGN.md` у `CLAUDE.md` артборди йдуть за дефолтами.

### Контраст: `frontend-design` проти дизайн-системи

Офіційний скіл `frontend-design` (`/plugin install frontend-design@claude-plugins-official`) штовхає агента до
«виразного» власного стилю і не згадує повагу до наявних токенів. У порожньому проєкті це дає гарний старт. У проєкті
з дизайн-системою — сторінку, що виглядає як з іншого застосунку. Якщо вмикаєте його, додайте в промпт: «лише
токени й компоненти з DESIGN.md і `@/components/ui`; нових кольорів не вводь». Порівняйте результат зі скілом і без
нього на одній сторінці — це гарний матеріал для бонусу.

### Перевірка: `check:design`

`scripts/check-design-tokens.mjs` ([`materials/scripts/`](../materials/scripts/check-design-tokens.mjs)) шукає в
`src/` (поза `src/components/ui/` і `src/app/globals.css`):

1. hex-кольори (`#fff`, `#0f6b6e`);
2. довільні кольори в класах (`bg-[#…]`, `text-[oklch(…)]`);
3. сирі палітри Tailwind (`bg-zinc-900`, `text-rose-700`, `bg-white`, `text-black`);
4. кольори в inline style (`style={{ color: "…" }}`).

Виняток — коментар `design-ok: <причина>` у тому самому рядку. Він для справжніх винятків (наприклад, колір
стороннього віджета), а не щоб «прибрати червоне».

```bash
npm run check:design                    # OK або список: файл:рядок [правило] клас — що зробити
node scripts/check-design-tokens.mjs --json   # для агента
```

На шаблоні проєкту правило знаходить **11 порушень у 2 файлах** (`src/app/page.tsx`, `src/app/login/page.tsx`). Типові
заміни:

| Було | Стало |
|---|---|
| `text-zinc-500` | `text-muted-foreground` |
| `text-red-600` | `text-destructive` (або компонент `Alert`) |
| `border-zinc-300 dark:border-zinc-700` | `border-input` (поле) чи `border-border` (розділювач) — темну тему дає токен |
| `dark:bg-zinc-900` на `<input>` | компонент `Input` без власних кольорів |
| `bg-foreground text-background` на кнопці | компонент `Button` (`bg-primary text-primary-foreground`) |

### Візуальна перевірка в браузері агента

Агент, який бачить сторінку, ловить те, чого не бачить скрипт: зламану темну тему, нечитабельний сірий, зниклий фокус.
Варіанти:

- **Browser pane у Claude Desktop** — сервер з `.claude/launch.json`, агент сам відкриває сторінку й знімає скріни;
- **Playwright MCP** — `claude mcp add playwright npx @playwright/mcp@latest`, безкоштовно;
- **Claude in Chrome** — розширення, платний план, не працює з WSL;
- Next.js 16 має скіл `next-dev-loop` і MCP-ендпойнт `/_next/mcp` dev-сервера.

Промпт: «зніми `/login` і `<сторінку зрізу>` у світлій і темній темі, порівняй з DESIGN.md, виправ відхилення,
зніми ще раз». Цикл «зняв → порівняв → виправив → зняв» з доказами в PR — бонус треку розробника.

**Figma MCP** (`get_design_context`, `get_variable_defs`) читає змінні й макети з Figma. Безкоштовне місце дає 20
викликів на місяць, Code Connect — лише на планах Organization чи Enterprise. Для цієї домашки не потрібен.

### Доступність — мінімум

- **Label у кожного поля** (`Label` + `htmlFor`, не лише placeholder).
- **Видимий фокус:** Tab по формі показує, де ви. Кільце фокусу — токен `ring`, контраст ≥ 3:1.
- **Контраст:** текст ≥ 4.5:1 на своєму тлі в обох темах; таблиця пар — у `DESIGN.md`.
- **Статус не лише кольором:** бейдж «На розгляді» має текст, а не лише жовтий фон.
- **Спершу семантичний HTML** (`<button>`, `<table>`, `<label>`), а `aria-*` — там, де HTML бракує, а не замість нього.

## Що здати (завдання B)

Повний перелік — у [рубриці B](../README.md#рубрика-розробника-що-дивимось). Коротко:

- `DESIGN.md` із джерелом;
- токени light/dark;
- компоненти в `src/components/ui`;
- `check:design` OK і `architecture.yml` зелений;
- знімки «до/після» у `docs/img/`.
