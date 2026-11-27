import { redirect } from "next/navigation";

export default async function LegacyAdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ access?: string }>;
}) {
  const { access } = await searchParams;
  redirect(access === "denied" ? "/account?status=restricted" : "/login?next=admin");
}
