"use client";

import type { ComponentProps } from "react";
import { useAdminText } from "@/components/useAdminText";

type Props = Omit<ComponentProps<"input">, "placeholder"> & { placeholder: string };

/** Translated placeholder for native inputs in admin Server Components. */
export default function AdminLocalizedInput({ placeholder, ...props }: Props) {
  const t = useAdminText();
  return <input {...props} placeholder={t(placeholder)} />;
}
