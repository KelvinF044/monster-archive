import { redirect } from "next/navigation";
import AccountForm from "@/components/AccountForm";
import { getSessionClaims } from "@/lib/auth/session";

export default async function SignupPage() {
  if (await getSessionClaims()) redirect("/account");
  return <AccountForm variant="signup" />;
}
