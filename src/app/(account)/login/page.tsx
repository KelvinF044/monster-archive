import { redirect } from "next/navigation";

import AccountForm from "@/components/AccountForm";
import { afterLogin } from "@/lib/auth/redirects";
import { getSessionClaims } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; status?: string }>;
}) {
  const { next, status } = await searchParams;
  const invalidLink = status === "invalid-link";
  if (!invalidLink && await getSessionClaims()) redirect(afterLogin(next));

  const destination = afterLogin(next);
  return <AccountForm variant="login" next={destination === "/account" ? undefined : next} invalidLink={invalidLink} />;
}
