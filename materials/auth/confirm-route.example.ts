// ПРИКЛАД (домашка WS7) → у вашому репо: src/app/auth/confirm/route.ts
// Вхід за посиланням-запрошенням (або відновлення пароля). Потрібен, лише якщо ваш зріз запрошує користувачів.
// Пара до нього — safe-next.example.ts → src/lib/auth/safe-next.ts (перевірка `next`, окремо — щоб покрити тестом:
// route.ts може експортувати лише GET/POST/…, а не допоміжні функції).
//
// Звідки посилання. Server Action адміністратора — спершу getClaims() + роль admin з profiles, ПОТІМ admin-клієнт —
// робить auth.admin.generateLink({ type: "invite", email }) і бере data.properties.hashed_token. Дія повертає ШЛЯХ
//   /auth/confirm?token_hash=<hashed_token>&type=invite&next=/account/password
// а клієнтський компонент додає window.location.origin і показує «Скопіювати». Листа немає: адміністратор передає
// посилання сам. Посилання — живий вхід в акаунт: одноразове (повторний перехід → 403 otp_expired), діє обмежений
// час (otp_expiry у supabase/config.toml). Справжнє посилання не вставляйте в issue, PR чи на знімок екрана.
// Перевірено 19.10 на хмарному Supabase з enable_signup = false: invite працює. Запасний шлях (не знадобився):
// admin.createUser({ email, email_confirm: true }) + generateLink({ type: "recovery", email }) — маршрут приймає обидва.
//
// /auth/… у шаблоні вже публічний (PUBLIC_PATHS у src/lib/supabase/proxy.ts), а /account/password — ні: після
// verifyOtp у людини є сесія, тож proxy її пропустить. На /account/password Server Action робить getClaims() і
// supabase.auth.updateUser({ password }) серверним клієнтом.

import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/safe-next";

// Лише типи посилань, які формує наш застосунок.
const ALLOWED_TYPES: readonly EmailOtpType[] = ["invite", "recovery"];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Куди вести після входу — лише відносний шлях нашого сайту (інакше open redirect: next=//evil.example).
  const next = safeNextPath(searchParams.get("next"), origin);

  if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    // Серверний клієнт із cookies: verifyOtp перевіряє токен і записує сесію в cookies відповіді.
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) redirect(next);
  }

  // Прострочене, уже використане чи підроблене посилання. Причину не розкриваємо.
  // У src/app/login/page.tsx додайте текст для error=link у ERRORS, наприклад:
  //   link: "Посилання недійсне або вже використане. Попросіть адміністратора про нове."
  redirect("/login?error=link");
}
