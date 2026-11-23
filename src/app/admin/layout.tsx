import type { ReactNode } from "react";

import AdminLocaleProvider from "@/components/AdminLocaleProvider";
import AdminShell from "@/components/AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminLocaleProvider>
      <AdminShell>{children}</AdminShell>
    </AdminLocaleProvider>
  );
}
