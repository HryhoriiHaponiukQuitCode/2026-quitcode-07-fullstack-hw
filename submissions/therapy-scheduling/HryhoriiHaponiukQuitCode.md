# Здача WS7

## Дані

- Роль: dev
- Команда: therapy-scheduling
- GitHub-логін: HryhoriiHaponiukQuitCode
- Ваше репо: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling
- SHA: ad46b18249d6cd3f469929fe050da0e145cf4acf
- Репо вимог PM: https://github.com/Sofiia-pm/therapy-scheduling-spec
- Прод-URL: https://therapy-scheduling-two.vercel.app

## PM

—

## Розробник

- Рядок «Вимоги:» з `docs/conformance.md` на SHA: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/ad46b18249d6cd3f469929fe050da0e145cf4acf/docs/conformance.md#L32
- PR «Оновлення вимог» зі зрізом 2 (A): https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/17
- PR «Оновлення вимог» після уточнень PM (A): https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/20
- Питання в репо PM (A; щонайменше 2, з них щонайменше 1 — власне issue): https://github.com/Sofiia-pm/therapy-scheduling-spec/issues
- PR «Специфікація» з `add-<зріз2>` (A): https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/18 (уточнення — https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/21)
- Дизайн-система — PR (B): https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/19
- Дизайн-система — `DESIGN.md` і джерело (B): https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/ad46b18249d6cd3f469929fe050da0e145cf4acf/DESIGN.md · джерело: артефакт Claude Design
- Дизайн-система — прогін `architecture` на `main` (B): https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/actions/runs/40590159182
- Знімки «до/після» (B): https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/tree/ad46b18249d6cd3f469929fe050da0e145cf4acf/docs/img/design
- Зміна `impl-<зріз2>` (C): https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/tree/ad46b18249d6cd3f469929fe050da0e145cf4acf/openspec/changes/archive/2026-10-27-impl-client-cards
- PR-и задач «Реалізація» (C; щонайменше 2): https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/23, https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/24, https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/25, https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/26, https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/27
- Мутаційна перевірка — червоні прогони (C; щонайменше 2): mutation-коміти й revert у https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/23 (AC-CARD-11), https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/24 (AC-CARD-06), https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/25 (AC-CARD-05)
- ADR (D): https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/ad46b18249d6cd3f469929fe050da0e145cf4acf/docs/decisions/0001-auth-boundary.md
- Архітектурне правило, крім `check:design` (D): job «Межа доступу: RLS, private і getClaims» (`node scripts/check-auth-boundary.mjs`) у architecture.yml; червоний прогін https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/actions/runs/40581723399, після revert зелений https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/actions/runs/40581894467 (PR https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/28)
- Акаунти для PM (E): pm-admin@example.test (admin), pm-scheduler@example.test (scheduler), pm-therapist@example.test (therapist). Паролі — PM у чаті
- Скріни за ролями (E): https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/ad46b18249d6cd3f469929fe050da0e145cf4acf/docs/img/roles/README.md
- AC зрізу 2 (E): усі 60 AC зрізів 1–2 — «реалізовано» в https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/ad46b18249d6cd3f469929fe050da0e145cf4acf/docs/conformance.md
- Відхилення від PM (E): не надходило

## Бонус

—
