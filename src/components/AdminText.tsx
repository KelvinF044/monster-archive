"use client";

import { useAdminText } from "@/components/useAdminText";

/** Reactive translation for text rendered by admin Server Components. */
export default function AdminText({ children }: { children: string }) {
  const t = useAdminText();
  return <>{t(children)}</>;
}
