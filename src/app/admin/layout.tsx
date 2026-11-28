import type { ReactNode } from "react";

import AdminLocaleProvider from "@/components/AdminLocaleProvider";
import AdminShell from "@/components/AdminShell";
import { getAccount } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const account = await getAccount();
  if (account?.role !== "admin") return children;

  return (
    <AdminLocaleProvider>
      <AdminShell>{children}</AdminShell>
    </AdminLocaleProvider>
  );
}
