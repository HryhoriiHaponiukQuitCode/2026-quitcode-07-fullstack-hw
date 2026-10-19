# Покрокова інструкція: трек розробника

Ви продовжуєте **своє репо** `<я>/<team-slug>` з WS6: той самий Supabase, той самий Vercel, ruleset `solo-main`,
`/requirements-sync`, OpenSpec. Нового шаблону немає. Нові файли (архітектурні правила, шаблон `DESIGN.md`, приклади)
ви копіюєте з [`materials/`](../materials/README.md) цього репозиторію. Цього тижня у вашому застосунку з'являються два
шари:

- **дизайн-система:** `DESIGN.md`, семантичні токени в `globals.css`, компоненти в `src/components/ui`, правило
  `check:design` в окремому workflow `architecture.yml`;
- **ролі й права зрізу 2:** міграції з RLS на кожну операцію й column grants, привілейовані дії з явною перевіркою,
  `getClaims()` у кожній дії, тест на кожен відмовний AC PM, який падає без політики.

Корисні посилання:

- Рубрика й Definition of Done — у [README](../README.md#трек-розробника--100--5-балів).
- Гайди: [дизайн-система](design-system-guide.md) · [автентифікація й авторизація](auth-guide.md).
- Що куди копіювати — [`materials/README.md`](../materials/README.md).
- Процес WS6 (типи PR, `/requirements-sync`, переклад у специфікацію, `impl-<зріз>`, міграції, `conformance`) —
  [walkthrough розробника WS6](https://github.com/koldovsky/2026-quitcode-06-specs-in-practice-hw/blob/main/docs/walkthrough-dev.md).
  Тут — лише нове й те, що змінилось.

Позначення: `<я>` — ваш GitHub-логін, `<pm>` — логін PM, `<team-slug>` — слаг команди, `<зріз2>` — слаг зрізу 2
латиницею (наприклад, `room-rights`), `AC-<AREA>-<NN>` — ID критерію PM.

Команди — для Git Bash на Windows і терміналу macOS. У Windows PowerShell 5.1: `curl.exe` замість `curl`, без `&&`
(команди по черзі), `Copy-Item` замість `cp`, а команду з `\` наприкінці рядка пишіть одним рядком (`\` у PowerShell
не переносить команду; перенесення там — backtick `` ` ``).

**Бюджет треку: 13–16 годин за тиждень** (кроки 0–12, без бонусу).

**Порядок важливий.** Дизайн-система від вимог PM не залежить: робіть її 20–23.10, поки PM пише вимоги зрізу 2. Права
зрізу (C) — після вимог, із 24.10.

| Крок | Коли | Бюджет | Трек |
|---|---|---|---|
| 0. Підготовка | 20.10, після здачі WS6 | 15 хв | — |
| 1. Знімки екрана «до» | до будь-яких змін вигляду | 10 хв | B |
| 2. Дизайн-система | 20–23.10 | 3–4 год | B |
| 3. `/requirements-sync` зрізу 2 | після «вимоги оновлено» (до кінця 23.10) | 15 хв | A |
| 4. Питання PM | 23–25.10, якомога раніше | 30–45 хв | A |
| 5. Специфікація `add-<зріз2>` | 24.10 | 45 хв – 1 год | A |
| 6. План `impl-<зріз2>` | 24.10 | 45 хв | C |
| 7. Задачі зрізу: міграції, дії, тести відмов | 24–27.10 | 5–6 год | C |
| 8. ADR і друге архітектурне правило | разом із задачами | 1 год | D |
| 9. Прод, акаунти для PM, скріни за ролями | до кінця 26.10 (акаунти), 27.10 | 1 год | E |
| 10. Після уточнень PM | 26.10 | 30–45 хв | A |
| 11. Відхилення від PM | 26–27.10 | за потреби | E |
| 12. Здача | до кінця 27.10 | 15 хв | — |

## 0. Підготовка (15 хв)

1. **Здача WS6** — до кінця 20.10 у репо домашки WS6. Ваш SHA здачі WS6 — це той `main`, на якому ви починаєте WS7.
2. **Свіжий `main` і чисте дерево:**

   ```bash
   git switch main
   git pull
   git status --short     # порожньо
   ```

3. **Проєкт Supabase не спить:** Free-проєкт засинає після ~7 днів без активності. Dashboard → Restore project, якщо
   треба (точну назву кнопки перевірте в інтерфейсі).
4. **Інструменти:**
   - Claude Code або Cursor;
   - для шляху Claude Design (за бажанням) — план Claude Pro, Max, Team чи Enterprise. Design systems у Claude
     Design — beta;
   - для `/design` у Claude Code (лише для бонусу) — версія 2.1.265 чи новіша і вхід через `/login`, а не API key.

## 1. Знімки екрана «до» (10 хв) — трек B

Поки нічого не змінено, зніміть свій прод (або `npm run dev`) у світлій і темній темі: щонайменше `/login` і `/` (або
сторінку зрізу 1). Темну тему вмикає система: у браузері — DevTools → Rendering → Emulate CSS media feature
`prefers-color-scheme` (точну назву перевірте в інтерфейсі), або тема ОС. Збережіть як
`docs/img/ws7-before-login-light.png`, `…-dark.png` тощо. Без паролів і без адрес не з `example.test` у кадрі.

## 2. Дизайн-система (3–4 год) — трек B

Повний гайд з поясненнями — [`design-system-guide.md`](design-system-guide.md). Тут — порядок дій і промпти.

### 2.1 Гілка й матеріали

```bash
git switch -c task/design-system
mkdir -p .github/workflows
B=https://raw.githubusercontent.com/koldovsky/2026-quitcode-07-fullstack-hw/main/materials
curl -sLo scripts/check-design-tokens.mjs  $B/scripts/check-design-tokens.mjs
curl -sLo scripts/check-server-boundary.mjs $B/scripts/check-server-boundary.mjs
curl -sLo .github/workflows/architecture.yml $B/workflows/architecture.yml
curl -sLo DESIGN.md $B/DESIGN.template.md
npm pkg set scripts.check:design="node scripts/check-design-tokens.mjs" \
  scripts.check:boundary="node scripts/check-server-boundary.mjs"
npm run check:design     # на шаблоні: 11 порушень у 2 файлах — це й є завдання
npm run check:boundary   # на шаблоні: OK
```

PowerShell: `$B = "https://raw.githubusercontent.com/koldovsky/2026-quitcode-07-fullstack-hw/main/materials"`,
`curl.exe -sLo …`, `New-Item -ItemType Directory -Force .github/workflows` замість `mkdir -p`, а `npm pkg set …` —
одним рядком.

`architecture.yml` — **окремий** workflow із двома jobs: «Дизайн-система: лише токени» і «Секретний ключ лише на
сервері». `ci.yml` і назви його jobs не чіпайте: на них тримається ruleset. Нові jobs не є обов'язковими перевірками
ruleset-у, тож доказ — зелений прогін у PR і на `main`.

### 2.2 `DESIGN.md`

Два шляхи (подробиці — у гайді):

- **Claude Design** (план Pro, Max, Team чи Enterprise). У claude.ai створіть артефакт типу Design System з «Вигляду
  й тону» PM (або з брифу, якщо PM його не написав). Потім агент переносить його `project/README.md` і `tokens.json`
  у `DESIGN.md` і `globals.css`.
- **AI-чат або агент** — за шаблоном, який ви щойно поклали в `DESIGN.md`.

Якщо PM уже опублікував «Вигляд і тон» і написав про це в чаті команди, спершу зробіть `/requirements-sync` і PR
«Оновлення вимог» (як у кроці 3), щоб розділ з'явився в `requirements/product.md`. Вимоги потрапляють у ваше репо
лише так: issue PM напряму агенту не давайте. Розділ, який з'явився після злиття PR дизайн-системи, можна перенести
пізніше окремим PR, за бажанням.

Промпт агенту для другого шляху (Claude Code чи Cursor, у вашому репо):

```text
DESIGN.md зараз — порожній шаблон дизайн-системи. Заповни його для нашого продукту.
Джерела: requirements/product.md (розділ «Вигляд і тон», якщо він є; інакше — бачення й ролі) і src/app/globals.css.
Правила:
- токени семантичні, з іменами shadcn/ui: background, foreground, card, primary, secondary, muted, accent, destructive,
  border, input, ring і пари *-foreground; плюс статуси нашого домену, якщо вони є у вимогах;
- значення в OKLCH, світла й темна тема;
- контраст: текст ≥ 4.5:1 на своєму тлі в обох темах, межі полів і кільце фокусу ≥ 3:1 — порахуй і заповни таблицю;
- без брендингу, логотипів і назв справжніх компаній;
- нічого не вигадуй про продукт: чого немає в джерелах — познач «TODO: питання PM».
Не змінюй інших файлів. Покажи таблицю токенів і контрасту.
```

Перечитайте результат: агент охоче пише «сучасний і дружній» без жодного рішення. Кожен розділ має містити правило,
яке можна перевірити.

### 2.3 shadcn/ui і токени в `globals.css`

Перевірено на налаштуванні шаблону (Tailwind 4 через `@tailwindcss/turbopack`, без PostCSS).

**Перед `init` закомітьте зроблене** (скрипти, `architecture.yml`, `package.json` зі скриптами `check:*`,
`DESIGN.md`, знімки `docs/img/ws7-before-*`): `--dry-run` в `init` немає, і якщо щось піде не так, `git restore .` і
`git clean -fd` повернуть гілку до цього коміту без втрат.

```bash
git add -A
git commit -m "Design system: materials, DESIGN.md, before screenshots"
npx shadcn@latest init -d --no-monorepo
npx shadcn@latest add input label card table badge dialog select alert -y
```

Перевірено 19.10 з CLI 4.22.1. Якщо `@latest` поводиться інакше (питає інше чи падає), запустіть ту саму команду з
`npx shadcn@4.22.1`.

`init` створює `components.json`, `src/lib/utils.ts`, `src/components/ui/button.tsx` і додає залежності. Але він
**переписує `src/app/globals.css`** своєю нейтральною палітрою, і в ньому три пастки. Тому одразу після `init`:

1. **Темна тема — у `@media (prefers-color-scheme: dark)`, а не в `.dark { … }`.** `init` кладе темні значення в блок
   `.dark`, а блок `@media` шаблону прибирає. Клас `.dark` ніхто не ставить, тож такі значення не діють ніколи, а
   `dark:`-класи компонентів за системною темою діють — виходить суміш. Перенесіть темні значення в
   `@media (prefers-color-scheme: dark) { :root { … } }` і видаліть блок `.dark`.
2. Замініть значення в `:root` і в темній темі **своїми** токенами з `DESIGN.md`.
3. **Видаліть рядок `@custom-variant dark (&:is(.dark *));`.** Він перемикає `dark:` на клас `.dark`, а ваша тема
   слідує за системою. Без цього рядка вбудований `dark:` Tailwind 4 теж слідує за системою, і `dark:`-класи
   компонентів працюють.
4. **Виправте `--font-sans: var(--font-sans)`** у `@theme inline` на `var(--font-geist-sans), ui-sans-serif,
   system-ui, sans-serif`. Самопосилання губить шрифт Geist.
5. Залиште `@import "tw-animate-css";` і `@import "shadcn/tailwind.css";` — їх потребують компоненти.
6. Залиште `@layer base` з `* { border-color: var(--border); }`: у Tailwind 4 межа за замовчуванням — колір тексту, а
   Table і Card ставлять `border-b`/`border-t` без кольору.
7. Приберіть `font-family: Arial, Helvetica, sans-serif` у `body`, якщо він лишився.

Пізніший `shadcn add` компонента з власними CSS-змінними (наприклад, sidebar чи chart) знову додає блок `.dark` і
рядок `@custom-variant dark` — приберіть їх так само. Компоненти зі списку вище `globals.css` не змінюють.

Промпт:

```text
Після shadcn init перепиши src/app/globals.css за DESIGN.md: значення :root і @media (prefers-color-scheme: dark)
— наші токени; темні значення з блоку .dark перенеси в @media (prefers-color-scheme: dark) і видали блок .dark;
у @theme inline — --color-* на кожен токен і --radius-*; --font-sans — var(--font-geist-sans) з системним запасом;
видали @custom-variant dark; залиш @import "tw-animate-css" і "shadcn/tailwind.css"; залиш @layer base з
* { border-color: var(--border) }; жодного font-family: Arial. Потім npm run build і npm run lint.
```

### 2.4 Сторінки без сирих кольорів

`npm run check:design` на шаблоні знаходить **11 порушень у 2 файлах**: `src/app/page.tsx` (`text-zinc-500`,
`border-zinc-300`, `dark:border-zinc-700`) і `src/app/login/page.tsx` (`border-zinc-*`, `dark:bg-zinc-900`,
`text-red-600`). Плюс усе, що ви додали у WS6. Це ваше завдання:

```text
Запусти npm run check:design. Виправ кожне порушення поза src/components/ui:
- сирі класи → семантичні з DESIGN.md (text-zinc-500 → text-muted-foreground, text-red-600 → text-destructive,
  border-zinc-* → border-border або border-input);
- власні <button>, <input>, <label> зі стилями → Button, Input, Label з @/components/ui; таблиці → Table;
  повідомлення про помилку → Alert;
- не переносимо сирі класи в src/components/ui, щоб «сховати» їх від перевірки, і не ставимо design-ok без причини.
Після змін: npm run check:design, npm run lint, npm run typecheck, npm test, npm run build.
```

### 2.5 Правила для агента

- `CLAUDE.md`: рядок `@DESIGN.md` поруч з `@AGENTS.md`, щоб Claude Code читав дизайн-систему в кожній сесії.
- `AGENTS.md`: розділ «Дизайн-система» (Cursor читає `AGENTS.md`):

  ```markdown
  ## Дизайн-система
  - Правила вигляду — DESIGN.md. Кольори — лише семантичні утиліти з токенів (bg-primary, text-muted-foreground,
    border-input…); жодних hex, bg-[#…], сирих палітр (zinc-500, bg-white) і кольорів в inline style.
  - Компоненти — лише з @/components/ui (shadcn/ui, змінюються в цій теці). Нових кольорів у компонентах не вигадуй.
  - Новий токен: DESIGN.md → :root і темна тема в src/app/globals.css → --color-<назва> у @theme inline.
  - Перевірка: npm run check:design (CI: .github/workflows/architecture.yml).
  ```

### 2.6 Перевірки, знімки «після», PR

```bash
npm run check:design
npm run check:boundary
npm run lint
npm run typecheck
npm test
npm run build
```

Зніміть ті самі сторінки, що в кроці 1, у світлій і темній темі: `docs/img/ws7-after-…`. Перевірте контраст
(DevTools показує співвідношення в підказці кольору) і видимий фокус: пройдіть форму входу клавішею Tab.

```bash
git add DESIGN.md AGENTS.md CLAUDE.md components.json package.json package-lock.json scripts \
  .github/workflows/architecture.yml src docs/img
git commit -m "Design system: DESIGN.md, semantic tokens, shadcn/ui, pages without raw colors, architecture.yml"
git push -u origin task/design-system
gh pr create --web
```

В описі PR:

- тип «Реалізація»;
- **джерело `DESIGN.md`:** посилання на артефакт Claude Design або інструмент і промпт AI-чату;
- таблиця «до/після» зі знімками;
- вивід `npm run check:design` до (11 порушень) і після (OK);
- рядок: «Поза межами типу «Реалізація» свідомо (домашка WS7, B): DESIGN.md, AGENTS.md, CLAUDE.md,
  components.json, package.json, scripts/, .github/workflows/architecture.yml». Перевірка CodeRabbit «Тип PR і межі
  змін» попередить про ці файли — відповідайте цим рядком.

Окремим коментарем — `@coderabbitai review`. Зелений CI (`spec`, `app`, `conformance`, `db-check` і обидва jobs
`architecture`) → **Squash and merge**.

**Доказ:** злитий PR; зелений `architecture` на `main`; `DESIGN.md`, `docs/img/ws7-before-*`, `docs/img/ws7-after-*`.

## 3. `/requirements-sync` зрізу 2 (15 хв) — трек A

Коли PM напише «вимоги оновлено» (до кінця 23.10): чисте дерево → `/requirements-sync` (без адреси: вона вже в шапці
`docs/conformance.md`) → звіт → PR «Оновлення вимог» → `@coderabbitai review` → зелений CI → **Squash and merge**. Як у
WS6, крок 8. Попередження `ac:coverage` «вимогу PM ще не перекладено» для AC зрізу 2 тут очікуване.

Прочитайте `requirements/product.md` уважно: матриця прав і (якщо є) «Вигляд і тон» змінилися. Розбіжність між
матрицею й відмовними AC — перше питання до PM.

## 4. Питання PM (30–45 хв) — трек A

Щонайменше **2 питання** про зріз 2 через форму «Питання до вимог» репо PM. Щонайменше 1 — власне issue, решта
можуть бути змістовними коментарями в наявних питаннях. Спершу перегляньте наявні:
`gh issue list --repo <pm>/<team-slug>-spec --label question --state all`.

Промпт для пошуку діри (скіл `spec-clarify` + фокус на правах):

```text
Уточни вимоги зрізу 2 скілом spec-clarify. Окремо пройди матрицю прав у requirements/product.md і відмовні AC:
1) клітинки «—» чи з межею для дій зрізу 2, на які немає відмовного AC;
2) відмовні AC без тексту повідомлення чи без «що не змінилося»;
3) що бачить роль без даних (порожній стан) і хто призначає ролі новим користувачам;
4) суперечності між матрицею й AC.
Для кожного — варіанти A/B/C поведінки (не реалізації), рекомендований і вплив. Issues не створюй — дай тексти для форми.
```

Питайте якомога раніше: PM вносить зміни до кінця Нд 25.10. Журнал — новий розділ «Зріз 2» у `docs/spec-reading.md`.

## 5. Специфікація `add-<зріз2>` (45 хв – 1 год) — трек A

Як у WS6, крок 10: гілка `spec/add-<зріз2>` → переклад → `validate --strict` → `spec-review` → archive у гілці →
рядки `docs/conformance.md` → PR «Специфікація».

```text
/opsx:propose add-<зріз2>: переклади вимоги зрізу 2 з requirements/ у специфікацію; лише proposal.md і specs/, без
design.md і tasks.md. Кожен AC PM, зокрема всі відмовні AC і AC про стан інтерфейсу, — #### Scenario з тим самим
ID; відмовні сценарії мають THEN про відмову і AND про незмінні дані, як у PM. Ролі й межі доступу — у Users & roles
з матриці прав requirements/product.md. Нічого не вигадуй: неясне — Open questions з посиланням на питання PM.
```

Перевірка після archive: `npm run ac:coverage` без попереджень «не перекладено» для AC зрізу 2.

## 6. План `impl-<зріз2>` (45 хв) — трек C

```bash
git switch main && git pull
git switch -c spec/impl-<зріз2>
npx openspec new change impl-<зріз2>
```

`skip_specs: true` у `.openspec.yaml`, як у WS6. `design.md` — **три обов'язкові розділи**:

```text
Напиши openspec/changes/impl-<зріз2>/design.md і tasks.md для зрізу 2 з openspec/specs/ (AC ID — дослівно).
design.md — розділи:
## UI і компоненти — сторінки, які компоненти з @/components/ui, порожні стани й помилки (з текстами з AC), що бачить
кожна роль; лише токени з DESIGN.md.
## Дані й RLS — нові таблиці й колонки; revoke + явні GRANT; політика на КОЖНУ операцію (select/insert/update/delete)
з умовою й AC ID; column grants — які колонки користувач НЕ змінює (роль, статус, власник); функції бази для
привілейованих дій (security definer лише в private, set search_path = ''); зміна набору ролей — порядок drop-first.
## Auth — де перевіряється вхід і роль: proxy лише перенаправляє (UX); кожна Server Action і Route Handler — getClaims()
і роль з profiles до запису (крім дій, що сесію створюють: вхід і активація за посиланням — там verifyOtp чи
signInWithPassword, а next — через safeNextPath); чи потрібен admin-клієнт (SUPABASE_SECRET_KEY) і чому; роль ніколи
з user_metadata.
Кожне рішення — з AC ID. Рішення, які мають альтернативи (роль у таблиці чи в JWT, функція бази чи Server Action), —
кандидати в ADR.
tasks.md — вертикальні задачі (міграція + дія + сторінка + тести), кожна з «Done when: AC-…»; щонайменше дві задачі.
Окремим пунктом кожної задачі — тести на відмовні AC і мутаційна перевірка.
```

`npx openspec validate impl-<зріз2> --strict` → PR «Специфікація» → merge.

## 7. Задачі зрізу: міграції, дії, тести відмов (5–6 год) — трек C

Одна задача з `tasks.md` — одна гілка `task/<коротко>` — один PR «Реалізація». Щонайменше **2 злиті PR задач**, і
кожен — з CodeRabbit і зеленим CI. Рецепти й пояснення — у [`auth-guide.md`](auth-guide.md).

### 7.1 Тести бази на PGlite (один раз, у першому PR задачі)

PGlite — справжній Postgres у процесі Vitest, без Docker. Він застосовує ваші `supabase/migrations/*.sql` і
`seed.sql`, а `asUser(id, sql)` виконує запит з роллю `authenticated` і `auth.uid() = id`, як у Supabase.

```bash
npm i -D -E @electric-sql/pglite@0.5.8
mkdir -p tests/db
curl -sLo tests/db/supabase-pglite.ts https://raw.githubusercontent.com/koldovsky/2026-quitcode-06-leave-portal-demo/48337f0d64bb65498fc40de53156857796633fed/tests/db/supabase-pglite.ts
```

Файл написано під демо (`divisions`, `positions`). Адаптуйте:

```text
Адаптуй tests/db/supabase-pglite.ts (взято з демо, посилання на коміт — в описі PR) під наш проєкт: залиш
SUPABASE_SHIM, inTransaction, застосування міграцій і seed.sql, користувачів із supabase/demo-users.json, asUser і
asService; прибери поля й кроки демо (divisions, positions, manages); додай asAnon(sql) — та сама транзакція з роллю
anon без sub. Якщо наші політики використовують auth.jwt() — допиши його в SHIM. Міграцій не змінюй.
```

В описі PR: «`tests/db/supabase-pglite.ts` взято з <постійне посилання на файл у демо> і адаптовано» і рядок «Поза
межами типу «Реалізація» свідомо (домашка WS7, C): package.json, package-lock.json (PGlite)» — ним відповідайте на
попередження CodeRabbit «Тип PR і межі змін». Межа емуляції:
Auth, Data API і JWT тут спрощені (`auth.uid()` читає `request.jwt.claim.sub`). Налаштування хмарного проєкту
(реєстрація, адреси) тест бази не перевіряє.

### 7.2 Міграції ролей і прав

```bash
npx supabase migration new <назва>
```

```text
Напиши міграцію для задачі <N> з impl-<зріз2>/design.md. Для кожної нової таблиці: enable row level security;
revoke all from anon, authenticated; явні grant лише на потрібні операції; окрема політика на кожну операцію
(не for all), to authenticated, (select auth.uid()); хелпери — private, security definer, set search_path = ''.
Колонки, які користувач не змінює (role, status, власник), — без grant update: дай grant update лише на перелік
дозволених колонок. Привілейовану дію (<яку>) — функцією в private (security definer, set search_path = '') з
перевіркою ролі через private.current_app_role() першим рядком; якщо треба викликати її з застосунку — тонка
обгортка в public (security invoker) і grant execute лише authenticated. Застосованих міграцій не змінюй.
```

- **Пастка «update own row + `role`».** Шаблон уже дає `grant update (full_name)` — не розширюйте його на `role`.
  Інакше політика `profiles_update_own` дозволить працівнику підвищити собі роль одним запитом із браузера.
- **Новий набір ролей** — окремою міграцією, порядок **drop-first** (як у WS6, крок 12.1): зняти старий
  `profiles_role_check` → `update` наявних даних → новий `default` → новий `profiles_role_check`. Нові ролі в
  `supabase/demo-users.json` — у тому самому PR, після merge і зеленого `db-deploy` — `npm run users:demo`.
- **Захист останнього адміністратора**, якщо в зрізі змінюють ролі: функція не знімає роль `admin` з останнього
  адміністратора (рецепт — у [гайді](auth-guide.md#функція-бази-для-привілейованої-дії)). Чи може людина змінити
  роль сама собі, вирішує матриця PM: якщо там «власну роль не змінює ніхто», функція відмовляє й на це (перевірка
  `p_target = auth.uid()` у тому самому рецепті), і на це теж потрібен тест.

### 7.3 Server Actions і Route Handlers з перевіркою

Server Action — публічний POST-ендпойнт. Її можна викликати напряму, оминаючи сторінку й кнопку. Тому кожна дія
починається з перевірки.

```text
Реалізуй задачу <N> з tasks.md. Кожна Server Action і Route Handler:
1) getClaims() з серверного клієнта (@/lib/supabase/server), не getSession(); немає claims — помилка без запису;
2) роль — з public.profiles за claims.sub, ніколи з user_metadata; роль не та — повертай помилку з текстом із AC,
   без запису;
3) запис — серверним клієнтом користувача (діють RLS і GRANT); admin-клієнт (src/lib/supabase/admin.ts) — лише якщо
   design.md каже, що він потрібен, і лише ПІСЛЯ кроків 1–2;
4) вхідні дані перевіряй на сервері (id чужого об'єкта не довіряй — RLS або умова власника).
Виняток з кроків 1–2 — дії, що сесію створюють (вхід, активація за посиланням /auth/confirm): claims там ще немає,
вхід перевіряє signInWithPassword чи verifyOtp, а next — лише через safeNextPath.
Сторінки: компоненти з @/components/ui, тексти порожніх станів і помилок — дослівно з AC.
Не чіпай proxy.ts як захист: він лише перенаправляє на /login.
```

Якщо ваш зріз запрошує користувачів, потрібен Admin API. Як це зробити — `admin.ts`, `generateLink`, `/auth/confirm`
і `/account/password` — описано в [гайді](auth-guide.md#запрошення-посиланням) і в прикладах
[`confirm-page.example.tsx`](../materials/auth/confirm-page.example.tsx) (сторінка «Активувати акаунт»),
[`confirm-actions.example.ts`](../materials/auth/confirm-actions.example.ts) (дія з `verifyOtp`) і
[`safe-next.example.ts`](../materials/auth/safe-next.example.ts) (перевірка `next` і її тест).

### 7.4 Тести відмов

**На кожен відмовний AC PM — тест** з AC ID на початку назви:

- **RLS, GRANT, функція бази** — тест бази на PGlite (`tests/db/*.test.ts`);
- **перевірка в Server Action** (роль, вхідні дані) — тест чистої функції, яку дія викликає першою.

Тест перевіряє **і відмову, і незмінні дані**.

```ts
// Схема й політики — як у рецепті bookings з auth-guide.md.
it("AC-ROOM-11: учасник не змінює тему чужого бронювання", async () => {
  const rows = await t.asUser(MEMBER_2, "update public.bookings set topic = 'Чуже' where id = $1 returning id", [BOOKING_OF_1]);
  expect(rows).toHaveLength(0); // RLS: чужий рядок для update не видно
  const [b] = await t.asService<{ topic: string }>("select topic from public.bookings where id = $1", [BOOKING_OF_1]);
  expect(b.topic).toBe("Планування"); // дані не змінились
});

it("AC-ROOM-12: учасник не скасовує бронювання, змінюючи статус напряму", async () => {
  await expect(
    t.asUser(MEMBER_1, "update public.bookings set status = 'cancelled' where id = $1", [BOOKING_OF_1]),
  ).rejects.toThrow(/permission denied/); // column grant: статус не оновлюється
  const [b] = await t.asService<{ status: string }>("select status from public.bookings where id = $1", [BOOKING_OF_1]);
  expect(b.status).toBe("confirmed"); // дані не змінились
});
```

Промпт:

```text
Для кожного відмовного AC задачі (<перелік AC>) напиши тест у tests/db/<область>.test.ts: назва починається з AC ID;
запит від імені забороненої ролі, чужого користувача (asUser) чи відвідувача без входу (asAnon); перевір відмову
(rejects.toThrow або 0 рядків) І що дані не змінились (asService). Потім для кожного тесту тимчасово прибери політику,
GRANT чи перевірку, яку він охороняє, запусти npm test, переконайся, що саме цей тест червоний, і поверни. Дай мені
таблицю «AC → що прибрали → який тест упав». Застосовані міграції (вже в main) не редагуй навіть тимчасово.
```

### 7.5 Мутаційна перевірка: тест має впасти без політики

Зелений тест, який лишається зеленим без політики, AC не покриває. Тому:

1. **Локально, для кожного відмовного AC PR:** приберіть політику чи перевірку → `npm test` → тест червоний →
   поверніть. Результат — таблиця в описі PR:

   | AC | Що тимчасово прибрали | Який тест упав |
   |---|---|---|
   | AC-ROOM-11 | умову власника в політиці `bookings_update_own` | `tests/db/bookings.test.ts` › AC-ROOM-11 |
   | AC-ROOM-12 | тимчасовий `grant update (topic, status)` | `tests/db/bookings.test.ts` › AC-ROOM-12 |

2. **У CI, щонайменше для двох відмовних AC за зріз** — видимий доказ у PR:

   ```bash
   git commit -am "mutation: прибрати перевірку ролі в <функції/дії> (AC-ROOM-07)"
   git push
   # Дочекайтеся в Actions, поки job app стане червоним (упав саме тест AC-ROOM-07), і скопіюйте адресу прогону.
   git revert --no-edit HEAD
   git push                 # знову зелений
   ```

   **Revert — лише після червоного прогону.** `ci.yml` скасовує попередній прогін PR на кожен новий push
   (`cancel-in-progress`): якщо запушити revert одразу, замість червоного прогону буде «cancelled», і доказу немає.
   Посилання на червоний прогін (`…/actions/runs/N`) — в описі PR. Мутуйте лише **нову** міграцію цього PR (ще не
   в `main`) або код дії. Застосовану міграцію змінювати не можна навіть тимчасово: `db-check` впаде з `CHANGED`.
   Squash and merge прибере обидва коміти з `main`, а в PR вони лишаться як доказ.

### 7.6 PR задачі

Перевірки перед PR — як у WS6 (`lint`, `typecheck`, `test`, `build`, `ac:coverage`, `spec:check`) плюс
`npm run check:design` і `npm run check:boundary`. Рядки `docs/conformance.md` для AC задачі — у тому самому PR.

В описі PR:

- тип «Реалізація»;
- пункт `tasks.md` і AC;
- таблиця мутаційної перевірки, посилання на червоні прогони;
- джерело запозичених файлів.

Окремим коментарем — `@coderabbitai review`. На кожен коментар CodeRabbit — виправлення або аргумент у треді.
Зелений CI → **Squash and merge** → дочекайтеся зеленого `db-deploy`.

**Доказ:** щонайменше 2 злиті PR задач зрізу 2; тести з AC ID на кожен відмовний AC; червоні прогони мутацій.

## 8. ADR і друге архітектурне правило (1 год) — трек D

**ADR.** `docs/decisions/NNNN-<назва>.md` за форматом `docs/decisions/README.md` вашого репо. Кандидати — рішення з
альтернативами з `design.md`:

- роль у таблиці `profiles` + RLS чи роль у JWT (Custom Access Token Hook);
- функція бази чи Server Action з admin-клієнтом для привілейованої дії;
- дизайн-система: shadcn/ui і токени чи інший шлях.

Приклади формату — [`materials/adr/`](../materials/adr/) (інший домен; переказ — 0 за D). Додайте розділ «Як
перевіряємо»: яке правило в `architecture.yml` чи який тест охороняє рішення.

```text
Напиши ADR docs/decisions/NNNN-<назва>.md за форматом docs/decisions/README.md про рішення «<яке>» нашого зрізу 2.
Контекст — з design.md impl-<зріз2> і AC (ID); щонайменше два розглянуті варіанти з чесним «чому ні»; наслідки;
розділ «Як перевіряємо» — правило в .github/workflows/architecture.yml і тести з AC ID. Нічого не вигадуй про
продукт; чого не знаєш — спитай мене.
```

**Друге правило в `architecture.yml`, крім `check:design`.** `check:boundary` ви вже додали в кроці 2.1. Тепер
доведіть, що воно ловить порушення:

- **червоний прогін:** у PR задачі — коміт з навмисним порушенням (наприклад, `import { createAdminClient } from
  "@/lib/supabase/admin"` у файлі з `"use client"` або `process.env.SUPABASE_SECRET_KEY` у сторінці; назва функції —
  ваша) → дочекайтеся червоного job «Секретний ключ лише на сервері» і скопіюйте адресу прогону → лише потім revert;
- **або вивід скрипта** на цьому порушенні в описі PR.

Можна написати власне правило: «жодного `getSession()` у `src/`», «жодного `middleware.ts`», «кожен `actions.ts`
викликає `getClaims()`» (крім дій, що сесію створюють: вхід, активація за посиланням). Це новий job у тому самому
`architecture.yml` і скрипт у `scripts/`. ADR посилається на правило. В описі такого PR — рядок «Поза межами типу
«Реалізація» свідомо (домашка WS7, D): scripts/…, .github/workflows/architecture.yml»: ним відповідайте на
попередження CodeRabbit «Тип PR і межі змін».

**Доказ:** ADR у `main`; червоний прогін або вивід у PR; зелений `architecture` на `main`.

## 9. Прод, акаунти для PM, скріни за ролями (1 год) — трек E

### Прод

- Міграції застосовує лише `db-deploy` після merge — перевірте, що прогони зелені.
- **`SUPABASE_SECRET_KEY` у Vercel — лише якщо зріз викликає Admin API** (наприклад, запрошення):
  - Vercel → Settings → Environment Variables → `SUPABASE_SECRET_KEY` лише для **Production** (не Preview) →
    Redeploy;
  - у тому самому PR — правка розділу «Секрети» вашого `AGENTS.md` («ключ — лише в `src/lib/supabase/admin.ts`,
    у Vercel лише Production, бо …») і ADR. В описі PR — рядок «Поза межами типу «Реалізація» свідомо (домашка WS7,
    E): AGENTS.md (Секрети)» для попередження CodeRabbit «Тип PR і межі змін».
  - Без Admin API ключа у Vercel немає, як і у WS6.
- Пройдіть зріз на прод-URL під кожною роллю.

### Акаунти для PM — бажано до кінця Пн 26.10

1. У `supabase/demo-users.json` (PR «Реалізація») — по акаунту на кожну роль зрізу:

   ```json
   { "email": "pm-employee@example.test", "full_name": "PM Працівник", "role": "employee" },
   { "email": "pm-admin@example.test", "full_name": "PM Адміністратор", "role": "admin" }
   ```

2. Після merge — `npm run users:demo`. Пароль усім синтетичним акаунтам — ваш `DEMO_USER_PASSWORD` з `.env.local`
   (довгий і випадковий: сторінку входу проду може пробувати будь-хто). Якщо ваш зріз — запрошення, можна створити
   акаунти PM власним запрошенням.
3. **Пароль — PM особистим повідомленням у чаті команди.** У репо, issue, PR, коміті й на знімку — лише адреси.
4. У чат команди: «Зріз 2 на проді: <прод-URL>. Акаунти: pm-employee@…, pm-admin@… (пароль — в особистих)».

### Conformance і скріни за ролями

- `docs/conformance.md`: рядок на кожен AC зрізу 2 — `реалізовано` (шляхи коду й тесту) або `відкладено (причина)`.
  AC про стан інтерфейсу без автотесту — `відкладено (e2e — WS8)`, якщо стан реалізовано і видно на скріні.
  `npm run ac:coverage` зелений.
- Скріни за ролями: `docs/img/ws7-role-<роль>-<сторінка>.png`. Для кожної ролі — головна сторінка зрізу й одна
  відмова (що бачить заборонена роль чи відвідувач без входу). Посилання — в описі останнього PR задачі.

## 10. Після уточнень PM (30–45 хв) — трек A

Після кінця Нд 25.10 — `/requirements-sync` → PR «Оновлення вимог» → якщо PM змінив AC — зміна специфікації
`clarify-<зріз2>` з MODIFIED / ADDED / REMOVED (як у WS6, крок 13) → реалізація або `відкладено` з посиланням на
рішення PM. Якщо агент відповів «Вимоги актуальні» — рядок `/requirements-sync <YYYY-MM-DD>: Вимоги актуальні` у
файлі здачі. Дата — день запуску команди (26.10 чи пізніше), а не дата знімка з повідомлення агента.

## 11. Відхилення від PM — трек E

PM приймає зріз на вашому проді й на кожне розходження відкриває у вашому репо issue
`Відхилення від вимог: AC-… — …` з кроками, очікуваним і фактичним. На issues, відкриті до кінця 26.10, відповідайте до
здачі:

- **ваша помилка** — PR «Реалізація» з тестом, який відтворює відхилення (AC ID у назві), і `Fixes #N` в описі (issue
  у вашому репо, тож тут це доречно);
- **читання вимоги різне** — коментар з поясненням і питання PM у його репо через форму, якщо AC неоднозначний.

## 12. Здача (15 хв)

[`submissions/README.md`](../submissions/README.md): PR з `submissions/<team-slug>/<github-login>.md`, заголовок
`WS7: Ім'я Прізвище`. SHA — коміт `main` вашого репо (`git fetch origin` → `git rev-parse origin/main`).

## Бонус (+5) — одне з двох

- **Цикл візуальної перевірки в браузері агента.** Підключіть браузер агенту — один із варіантів:
  - Browser pane у Claude Desktop (`.claude/launch.json`);
  - Playwright MCP — `claude mcp add playwright npx @playwright/mcp@latest`;
  - Claude in Chrome (платний план).

  Промпт:

  ```text
  Запусти застосунок (npm run dev). Зніми /login і сторінки зрізу 2 у світлій і темній темі під ролями <…>.
  Порівняй з DESIGN.md: кольори лише з токенів, контраст, видимий фокус, label у кожного поля, статус не лише
  кольором, порожні стани з текстами з AC. Склади список відхилень, виправ їх, зніми ще раз і покажи до/після.
  ```

  В описі PR — промпт, знімки до й після, що агент знайшов і виправив, що пропустив.
- **`/design`-артборд → реалізація.** У Claude Code `/design <бриф сторінки зрізу 2>`. Вбудований design-скіл шукає
  дизайн-систему проєкту (`CLAUDE.md` чи theme-файл). Пріоритет: ваш промпт > дизайн-система проєкту > дефолти
  скіла. Далі реалізуйте артборд на компонентах з `@/components/ui`. В описі PR — знімок артборда, знімок
  реалізації, чим вони відрізняються і чому.

Звіт — у розділі «Бонус» файлу здачі: посилання на PR і до пів сторінки висновків.
