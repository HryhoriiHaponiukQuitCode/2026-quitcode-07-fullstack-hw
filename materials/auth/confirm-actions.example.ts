// ПРИКЛАД (домашка WS7) → у вашому репо: src/app/auth/confirm/actions.ts
// Дія кнопки «Активувати акаунт» зі сторінки /auth/confirm (confirm-page.example.tsx). Лише тут витрачається
// одноразовий токен: verifyOtp перевіряє його й записує сесію в cookies.
//
// Server Action — публічний POST-ендпойнт. getClaims() тут немає і бути не може: сесії ще немає, її створює
// verifyOtp. Вхід дає лише дійсний одноразовий token_hash, а next — лише через safeNextPath (інакше open redirect).
//
// Строк дії посилання задають налаштування Auth хмарного проєкту Supabase (за замовчуванням 1 год). otp_expiry у
// supabase/config.toml діє лише на локальний стек: db-deploy переносить у хмару міграції, а не налаштування Auth.
// Перевірено 19.10 на хмарному Supabase з enable_signup = false: invite працює. Запасний шлях (не знадобився):
// admin.createUser({ email, email_confirm: true }) + generateLink({ type: "recovery", email }) — дія приймає обидва.
//
// /account/password — сторінка під входом: після verifyOtp у людини є сесія, тож proxy її пропустить. Її Server
// Action робить getClaims() і supabase.auth.updateUser({ password }) серверним клієнтом.
"use server";

import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/server";

// Лише типи посилань, які формує наш застосунок.
const ALLOWED_TYPES: readonly EmailOtpType[] = ["invite", "recovery"];

export async function activate(formData: FormData): Promise<void> {
  const tokenHash = formData.get("token_hash");
  const type = formData.get("type");
  // Куди вести після входу — лише відносний шлях нашого сайту (інакше open redirect: next=//evil.example).
  const next = safeNextPath(formData.get("next"));

  if (typeof tokenHash === "string" && tokenHash && ALLOWED_TYPES.includes(type as EmailOtpType)) {
    // Серверний клієнт із cookies: verifyOtp перевіряє токен і записує сесію в cookies відповіді.
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash });
    if (!error) redirect(next);
  }

  // Прострочене, уже використане чи підроблене посилання. Причину не розкриваємо.
  // У src/app/login/page.tsx додайте текст для error=link у ERRORS, наприклад:
  //   link: "Посилання недійсне або вже використане. Зверніться до адміністратора."
  // («Попросіть про нове посилання» обіцяйте, лише якщо PM описав повторне запрошення — див. auth-guide.)
  redirect("/login?error=link");
}
