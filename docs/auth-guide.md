# Гайд: автентифікація й авторизація в Next.js 16 + Supabase

Цей гайд — до треку розробника, завдання C і D. Стек — як у шаблоні проєкту: Next.js 16.4 (`src/proxy.ts`, Server
Actions), `@supabase/ssr` 0.12, `@supabase/supabase-js` 2.117, Supabase Postgres з RLS. Приклади — з нейтрального
домену (бронювання переговорних, ролі шаблону `member` і `admin`), а не з вашого брифу. Переносьте патерни, а не
текст.

- **Автентифікація (authn)** — хто ви: вхід, сесія, запрошення, пароль.
- **Авторизація (authz)** — що вам можна: ролі, матриця прав PM, політики RLS, перевірка в кожній дії.

Authn ≠ authz. «Користувач увійшов» не означає «користувачу можна». Більшість витоків — саме тут: вхід є, а
перевірки, чий це запис, немає.

## Як живе сесія

- **Cookies через `@supabase/ssr`.** Після входу Supabase кладе сесію в cookies. Серверний клієнт
  (`src/lib/supabase/server.ts`) читає їх у Server Components, Server Actions і Route Handlers. Створюйте новий
  клієнт на кожен запит, не тримайте його в змінній модуля.
- **`src/proxy.ts`** (у Next.js 16 це `proxy()`, а не `middleware.ts`) на кожен запит оновлює сесію й перенаправляє
  без входу на `/login`. **Це UX, а не захист.** Server Action можна викликати POST-запитом напряму, а умова
  `PUBLIC_PATHS` у шаблоні — `startsWith("/auth")`, тож під неї потрапить і `/authority`. Захищає лише перевірка в
  самій дії та RLS у базі.
- **`getClaims()`, а не `getSession()`.** `getClaims()` перевіряє підпис JWT. `getSession()` на сервері повертає
  те, що лежить у cookie, без перевірки, тож для авторизації йому не довіряємо.

## Перевірка в кожній дії

Документація Next.js 16 радить ставитися до Server Actions і Route Handlers **як до публічних API-ендпойнтів** і
перевіряти права в кожному. Обмеження в інтерфейсі (сховали кнопку, `return null` у layout) не захищають: у
застосунку багато точок входу, і дія доступна напряму.

Один хелпер — і кожна дія починається з нього:

```ts
// src/lib/auth/require-role.ts — лише сервер
import { createClient } from "@/lib/supabase/server";

export type AppRole = "member" | "admin";

export async function requireRole(...allowed: AppRole[]) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims(); // перевіряє підпис JWT
  const userId = data?.claims?.sub;
  if (!userId) return { ok: false as const, error: "Увійдіть, щоб продовжити." };

  // Роль — з таблиці profiles (RLS: користувач бачить свій профіль), ніколи з user_metadata.
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  const role = profile?.role as AppRole | undefined;
  if (!role || !allowed.includes(role)) return { ok: false as const, error: "Недостатньо прав." };

  return { ok: true as const, supabase, userId, role };
}
```

```ts
// src/app/bookings/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";

export async function renameBooking(formData: FormData) {
  const auth = await requireRole("member", "admin"); // 1) хто й з якою роллю — до будь-якого запису
  if (!auth.ok) return { error: auth.error };

  const id = String(formData.get("id") ?? "");
  const topic = String(formData.get("topic") ?? "").trim();
  if (!topic) return { error: "Вкажіть тему зустрічі." };

  // 2) Запис клієнтом користувача: RLS і GRANT вирішують, чи його це бронювання (id з форми не довіряємо).
  const { data, error } = await auth.supabase.from("bookings").update({ topic }).eq("id", id).select("id");
  if (error || !data?.length) return { error: "Змінити можна лише власне бронювання." };

  revalidatePath("/bookings");
  return { ok: true };
}
```

Для сторінок — той самий хелпер, але з `redirect("/login")` чи `notFound()` замість помилки. Це UX: дані сторінки
однаково захищає RLS.

## Ключі: publishable проти secret

| | Publishable (`sb_publishable_…`) | Secret (`sb_secret_…`) |
|---|---|---|
| Де | браузер і сервер, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | лише сервер, `SUPABASE_SECRET_KEY` |
| RLS | діє: запит іде від імені користувача з його сесією | **обходить RLS і GRANT** (роль `service_role`) |
| Хто бачить | будь-хто: ключ лежить у JS-бандлі | лише ваш сервер |

- **Секретний ключ — лише в `src/lib/supabase/admin.ts`**, і першим рядком там `import "server-only"`. Тоді імпорт
  цього файлу з Client Component зламає збірку. Встановлювати пакет `server-only` у Next.js необов'язково: Next.js
  обробляє цей імпорт сам. Vitest цієї домовленості не знає, тож `admin.ts` у тести не імпортуйте — тестуйте чисту
  логіку окремо.

  ```ts
  // src/lib/supabase/admin.ts
  import "server-only";
  import { createClient } from "@supabase/supabase-js";
  import type { Database } from "./database.types";

  // Обходить RLS. Викликати лише ПІСЛЯ перевірки ролі (requireRole) і лише для того, що без Admin API неможливо.
  export function createAdminClient() {
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!key) throw new Error("SUPABASE_SECRET_KEY не задано: він потрібен лише діям з Admin API.");
    return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  ```

- **Помилка, яку AI робить найчастіше,** — секрет із префіксом `NEXT_PUBLIC_`. Усе з `NEXT_PUBLIC_` потрапляє в
  браузер. Друга помилка — admin-клієнт «щоб не морочитись з RLS» у звичайній дії.
- **У Vercel** ключ додаємо, лише якщо зріз справді викликає Admin API (запрошення, керування користувачами Auth).
  Лише середовище Production, не Preview: відкриті preview зі старим кодом не мають отримати ключ. Разом з ADR і
  правилом у розділі «Секрети» вашого `AGENTS.md`.
- **Правило в CI** — `scripts/check-server-boundary.mjs`
  ([`materials/scripts/`](../materials/scripts/check-server-boundary.mjs)) у `architecture.yml`. Воно перевіряє чотири
  речі:
  - ключ читається лише в `admin.ts`;
  - `admin.ts` починається з `import "server-only"`;
  - admin-клієнт імпортують лише `actions.ts`, `route.ts` чи файли з `"use server"`;
  - жодної змінної `NEXT_PUBLIC_*SECRET*`.

## Запрошення посиланням

Вбудований SMTP Supabase надсилає 2 листи на годину і лише членам вашого проєкту Supabase. Тому «запрошення» в
навчальному проєкті — **посилання, яке адміністратор копіює й передає сам**. Реєстрацію вимкнено
(`enable_signup = false`), тож користувачів створює лише Admin API.

```text
адмін (Server Action)          Supabase Admin API                 запрошений
requireRole("admin") ──► generateLink({ type: "invite", email }) ──► hashed_token
посилання /auth/confirm?token_hash=…&type=invite&next=/account/password ──► адмін копіює й передає
                                       /auth/confirm (Route Handler): verifyOtp → сесія ──► /account/password
                                       /account/password (Server Action): getClaims → updateUser({ password })
```

1. **Server Action запрошення:**
   - спершу `requireRole("admin")`, потім `createAdminClient()`;
   - далі `auth.admin.generateLink({ type: "invite", email })`, з відповіді — `data.properties.hashed_token`;
   - дія повертає **шлях** `/auth/confirm?token_hash=…&type=invite&next=/account/password`, а клієнтський компонент
     додає `window.location.origin` і показує кнопку «Скопіювати».
   - Роль новому користувачу ставить адміністратор окремо: функцією бази або admin-клієнтом після перевірки. Не через
     `user_metadata` і не тригером, що читає метадані.
2. **`/auth/confirm`** — Route Handler: `verifyOtp({ type, token_hash })` дає сесію. Параметр `next` приймаємо лише
   як відносний шлях того самого сайту. Приклад з коментарями —
   [`materials/auth/confirm-route.example.ts`](../materials/auth/confirm-route.example.ts), перевірка `next` з
   тестом — [`materials/auth/safe-next.example.ts`](../materials/auth/safe-next.example.ts). Шлях `/auth/…` у
   шаблоні вже публічний (`PUBLIC_PATHS`).
3. **`/account/password`** — сторінка під входом. Її Server Action: `getClaims()` → `supabase.auth.updateUser({
   password })` серверним клієнтом.

- **Посилання — живий вхід в акаунт.** Воно одноразове й діє обмежений час (у `supabase/config.toml` шаблону —
  `otp_expiry = 3600`, тобто 1 год). Справжнє посилання не вставляйте в issue, PR чи чат і не показуйте на записі
  екрана: для демонстрації — одноразовий тестовий акаунт `*@example.test`.
- **Open redirect.** Без перевірки `next` ваш домен перенаправить людину на будь-який сайт: `next=//evil.example`
  (протокол-відносна адреса) або `next=https://…`. Ще й одразу після входу, коли людина довіряє сторінці. Приймаємо
  лише `/…`, не `//` і не `/\`, і звіряємо origin після розбору адреси.
- **Запасний шлях.** Якщо `generateLink({ type: "invite" })` у вашому проєкті поверне помилку, зробіть
  `auth.admin.createUser({ email, email_confirm: true })` і `generateLink({ type: "recovery", email })`. Далі все те
  саме: `/auth/confirm` приймає обидва типи.

## Роль — ніколи з `user_metadata`

`user_metadata` (`raw_user_meta_data`) користувач змінює **сам** через `supabase.auth.updateUser({ data: { … } })` з
браузера, з публічним ключем. Політика чи перевірка `user_metadata.role = 'admin'` — це «кожен може стати
адміністратором». Роль — лише з таблиці (`profiles.role`), яку користувач не змінює.

## RLS: рецепти

Правила шаблону (заголовок `supabase/migrations/20261012000000_profiles_and_roles.sql` і `AGENTS.md`) — для кожної
таблиці в `public`:

```sql
create table public.bookings (
  id        uuid primary key default gen_random_uuid(),
  owner_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  room      text not null,
  topic     text not null,
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  status    text not null default 'confirmed' check (status in ('confirmed', 'cancelled'))
);

alter table public.bookings enable row level security;

-- Права: спершу забрати все, потім видати лише потрібне. Автогрантів у нових проєктах Supabase немає.
revoke all on table public.bookings from anon, authenticated;
grant select on table public.bookings to authenticated;
grant insert (room, topic, starts_at, ends_at) on table public.bookings to authenticated; -- власник і статус — default
grant update (topic) on table public.bookings to authenticated;   -- власника й статус користувач не змінює
grant delete on table public.bookings to authenticated;
-- service_role (admin-клієнт, скрипти) RLS обходить, але GRANT потребує теж — як profiles у шаблоні.
grant select, insert, update, delete on table public.bookings to service_role;

-- Окрема політика на кожну операцію; auth.uid() — як (select auth.uid()), щоб рахувалось раз на запит.
create policy bookings_select_own_or_admin on public.bookings for select to authenticated
  using (owner_id = (select auth.uid()) or (select private.current_app_role()) = 'admin');

create policy bookings_insert_own on public.bookings for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy bookings_update_own on public.bookings for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy bookings_delete_admin on public.bookings for delete to authenticated
  using ((select private.current_app_role()) = 'admin');
-- anon: жодного grant і жодної політики — відвідувач без входу не бачить нічого.
```

- **Політика на кожну операцію**, а не `for all`. Матриця PM має окремі рядки «бачить», «створює», «змінює»,
  «видаляє». Окремі політики — окремі тести.
- **Хелпери ролей — у схемі `private`** (Data API її не бачить), `security definer`, `set search_path = ''`. Так
  політика `profiles` може читати `profiles` без рекурсії (42P17). У шаблоні вже є `private.current_app_role()`.
- **Column grants.** `grant update (topic)` — користувач змінює лише тему. Статус, власник, роль, підрозділ — лише
  через функцію бази з перевіркою або дію сервера.
- **Пастка «update own row + колонка `role`».** Політика `profiles_update_own` дозволяє оновлювати власний рядок
  профілю. Якщо ще й видати `grant update` на весь `profiles` (або на `role`), працівник одним запитом з консолі
  браузера зробить себе адміністратором: `update profiles set role = 'admin' where id = <свій id>`. Шаблон дає лише
  `grant update (full_name)`. Не розширюйте його на `role`, а зміну ролі робіть функцією з перевіркою адміністратора.
- **`service_role` обходить RLS.** Admin-клієнт не перевіряє нічого, тому перевірка ролі — до нього, а не після.

## Функція бази для привілейованої дії

Зміна ролі, рішення, переведення статусу — дії, де недостатньо «це мій рядок». Робимо їх однією функцією бази з
перевіркою всередині. Правило шаблону: `security definer` — лише в схемі `private`. Виклик із застосунку
(`supabase.rpc(…)`) іде через тонку обгортку в `public` з `security invoker`.

```sql
-- Логіка з правами власника функції: оминає column grant на role, тож перевіряє все сама.
create or replace function private.set_member_role(p_target uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admins integer;
begin
  -- 1) Хто викликає: лише адміністратор. Роль — з profiles через хелпер, не з JWT і не з user_metadata.
  if (select private.current_app_role()) is distinct from 'admin' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_role not in ('member', 'admin') then
    raise exception 'INVALID_ROLE' using errcode = '22023';
  end if;
  -- 2) Захист останнього адміністратора. FOR UPDATE блокує рядки адміністраторів: два одночасні виклики
  --    не понизять двох останніх адміністраторів одночасно.
  perform 1 from public.profiles where role = 'admin' for update;
  select count(*) into v_admins from public.profiles where role = 'admin';
  if p_role <> 'admin' and v_admins = 1
     and exists (select 1 from public.profiles where id = p_target and role = 'admin') then
    raise exception 'LAST_ADMIN' using errcode = '23514';
  end if;
  update public.profiles set role = p_role where id = p_target;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function private.set_member_role(uuid, text) from public, anon;
grant execute on function private.set_member_role(uuid, text) to authenticated;

-- Точка виклику для supabase.rpc("set_member_role", { p_target, p_role }).
create or replace function public.set_member_role(p_target uuid, p_role text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.set_member_role(p_target, p_role);
end;
$$;

revoke execute on function public.set_member_role(uuid, text) from public, anon;
grant execute on function public.set_member_role(uuid, text) to authenticated;
```

- **`set search_path = ''`** і повні імена (`public.profiles`) — інакше функцію з правами власника можна підмінити
  власним об'єктом з тим самим ім'ям.
- **Коди помилок** (`FORBIDDEN`, `LAST_ADMIN`) Server Action перекладає в тексти з AC PM.
- **Альтернатива** — Server Action з `requireRole("admin")` і admin-клієнтом. Вона теж правильна, якщо перевірка
  стоїть до admin-клієнта. Але тоді прямий виклик з консолі браузера захищає лише column grant, а «останнього
  адміністратора» доводиться перевіряти в коді без блокування. Вибір — тема для ADR.

## Ролі в таблиці чи в JWT

| | Роль у таблиці `profiles` + RLS через хелпер | Роль у JWT (Custom Access Token Hook) | `user_metadata` |
|---|---|---|---|
| Свіжість | одразу після зміни | лише після оновлення токена: понижений адміністратор ще якийсь час адміністратор | — |
| Хто змінює | адміністратор функцією з перевіркою | хук під час видачі токена | **користувач сам** |
| Перевірка в політиці | `(select private.current_app_role())` | `auth.jwt() ->> '…'` | — |
| Тест на PGlite | так, як є | треба емулювати claims у тесті | — |
| Вердикт | за замовчуванням | коли таблиця повільна й роль майже не змінюється | **ніколи** |

Шаблон уже робить роль у таблиці. Якщо обираєте JWT — це ADR з чесним розділом «Наслідки».

## IDOR і випадок CVE-2025-48757

**IDOR** (insecure direct object reference) — коли застосунок довіряє `id` з адреси чи форми:
`update … where id = $1`. Будь-хто підставляє чужий `id`. Ліки: вибірка обмежена власником чи межею з матриці. У
нас це робить RLS, а в коді — умова власника, де RLS немає (admin-клієнт).

**CVE-2025-48757** — масовий випадок застосунків, згенерованих AI-конструктором (Lovable). Таблиці без RLS або з
хибним RLS, і дані були доступні будь-кому з публічним ключем із бандла. Висновок для нас: публічний ключ — не
секрет, тож дані захищає лише база. Спробуйте самі: увійдіть у свій застосунок, створіть у консолі браузера клієнт
Supabase з URL і publishable key (вони є в бандлі) і спробуйте змінити собі роль. Має прийти відмова.

## Тести доступу на PGlite

PGlite — справжній Postgres у процесі Vitest, без Docker. Хелпер `tests/db/supabase-pglite.ts` з демо (як його взяти
й адаптувати — [walkthrough, крок 7.1](walkthrough-dev.md#71-тести-бази-на-pglite-один-раз-у-першому-pr-задачі))
застосовує ваші міграції й дає:

- `asUser(id, sql)` — роль `authenticated`, `auth.uid() = id`;
- `asAnon(sql)` — відвідувач без входу (допишіть самі);
- `asService(sql)` — в обхід RLS, щоб перевірити, що дані не змінились.

```ts
it("AC-ACCESS-04: учасник не підвищує собі роль ні оновленням профілю, ні функцією", async () => {
  await expect(
    t.asUser(MEMBER, "update public.profiles set role = 'admin' where id = $1", [MEMBER]),
  ).rejects.toThrow(/permission denied/); // column grant: role не можна оновлювати
  await expect(t.asUser(MEMBER, "select public.set_member_role($1, 'admin')", [MEMBER])).rejects.toThrow("FORBIDDEN");
  const [p] = await t.asService<{ role: string }>("select role from public.profiles where id = $1", [MEMBER]);
  expect(p.role).toBe("member"); // і дані не змінились
});
```

**Зелені тести брешуть, поки ви не бачили їх червоними.** Тимчасово додайте `grant update (full_name, role)` або
приберіть перевірку `FORBIDDEN` → `npm test` → цей тест має впасти → поверніть. Порядок доказів у PR —
[walkthrough, крок 7.5](walkthrough-dev.md#75-мутаційна-перевірка-тест-має-впасти-без-політики).

## Чекліст перед мерджем дії чи ендпойнта

Кожна Server Action, Route Handler і функція бази, яку написав агент:

- [ ] **`getClaims()` першим кроком** (не `getSession()`); без claims — відмова без запису.
- [ ] **Роль — з `profiles`** (через хелпер чи функцію бази), не з `user_metadata`, не з форми, не з cookie.
- [ ] **Перевірка в самій дії,** а не лише в proxy, layout чи схованій кнопці.
- [ ] **Вибірка обмежена власником чи межею з матриці** (RLS чи умова), а не лише `id` з форми — жодного IDOR.
- [ ] **Клієнт не виставляє полів, яких не має права:** власник, роль, статус, підрозділ — без column grant, не з
  `formData`.
- [ ] **Нова таблиця:** RLS увімкнено, `revoke all … from anon, authenticated`, явні GRANT, політика на кожну операцію
  `to authenticated` з `(select auth.uid())`.
- [ ] **`security definer` — лише в `private`,** з `set search_path = ''`, перевіркою ролі першим рядком і
  `revoke execute … from public, anon`.
- [ ] **Admin-клієнт** — лише з `admin.ts` (`import "server-only"`), лише після перевірки ролі й лише там, де без
  Admin API ніяк. `npm run check:boundary` зелений.
- [ ] **Відповідь без зайвого:** вибрано лише потрібні колонки; помилка входу не підказує, чи існує email.
- [ ] **Редирект за параметром** (`next`, `redirect_to`) — лише відносний шлях свого сайту.
- [ ] **Тест на кожен відмовний AC** (чужі дані, заборонена роль, не увійшов) перевіряє відмову і незмінні дані — і
  червоний, якщо прибрати політику.
- [ ] **Перевірено руками** від імені іншого користувача (або з консолі браузера з publishable key) — прийшла
  відмова, а не чужі дані.
