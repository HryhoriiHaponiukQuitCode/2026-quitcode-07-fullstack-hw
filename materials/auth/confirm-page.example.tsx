// ПРИКЛАД (домашка WS7) → у вашому репо: src/app/auth/confirm/page.tsx
// Сторінка активації за посиланням-запрошенням (або відновлення пароля). Потрібна, лише якщо ваш зріз запрошує
// користувачів. Разом з нею:
//   confirm-actions.example.ts → src/app/auth/confirm/actions.ts (дія activate: verifyOtp → сесія → next);
//   safe-next.example.ts       → src/lib/auth/safe-next.ts (перевірка next, окремо — щоб покрити тестом).
//
// Чому сторінка з кнопкою, а не verifyOtp одразу на GET. Посилання одноразове: другий перехід дає 403 otp_expired.
// Месенджери (Telegram, Slack…) і поштові сканери відкривають посилання ботом, щоб показати прев'ю, — тобто роблять
// той самий GET. Якби GET витрачав токен, бот «активував» би посилання раніше за людину, і вона побачила б
// «Посилання недійсне». Тому GET лише показує цю сторінку, а токен витрачає дія activate (POST) після натискання
// «Активувати акаунт». verifyOtp на сторінці (GET) не викликайте.
//
// Звідки посилання. Server Action адміністратора — спершу getClaims() + роль admin з profiles, ПОТІМ admin-клієнт —
// робить auth.admin.generateLink({ type: "invite", email }) і бере data.properties.hashed_token. Дія повертає ШЛЯХ
//   /auth/confirm?token_hash=<hashed_token>&type=invite&next=/account/password
// а клієнтський компонент додає window.location.origin і показує «Скопіювати». Листа немає: адміністратор передає
// посилання сам. Посилання — живий вхід в акаунт: справжнє не вставляйте в issue, PR чи на знімок екрана.
//
// /auth/… у шаблоні вже публічний (PUBLIC_PATHS у src/lib/supabase/proxy.ts): людина ще не увійшла.
// Button — з вашої дизайн-системи (завдання B).

import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { activate } from "./actions";

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

export default async function ConfirmPage({ searchParams }: PageProps<"/auth/confirm">) {
  const params = await searchParams;
  const tokenHash = one(params.token_hash);
  const type = one(params.type);
  // Без токена активувати нічого — одразу на вхід з тим самим повідомленням, що й для недійсного посилання.
  if (!tokenHash || !type) redirect("/login?error=link");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">Активувати акаунт</h1>
      <p className="text-muted-foreground">
        Натисніть кнопку, щоб увійти й задати пароль. Посилання діє один раз.
      </p>
      {/* Значення з адреси — лише в прихованих полях; React екранує їх сам. */}
      <form action={activate}>
        <input type="hidden" name="token_hash" value={tokenHash} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="next" value={one(params.next)} />
        <Button type="submit">Активувати акаунт</Button>
      </form>
    </main>
  );
}
