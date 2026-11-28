import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import AccountForm from "@/components/AccountForm";
import { RECOVERY_COOKIE } from "@/lib/auth/redirects";
import { getSessionClaims } from "@/lib/auth/session";

export default async function ResetPasswordPage() {
  const [claims, cookieStore] = await Promise.all([getSessionClaims(), cookies()]);
  if (!claims?.session_id || claims.session_id !== cookieStore.get(RECOVERY_COOKIE)?.value) {
    redirect("/login?status=invalid-link");
  }

  return <AccountForm variant="recovery" />;
}
