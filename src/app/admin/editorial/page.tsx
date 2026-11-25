import type { Metadata } from "next";
import AdminEditorialWorkspacePreview from "@/components/AdminEditorialWorkspacePreview";

export const metadata: Metadata = {
  title: "Editorial",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminEditorialWorkspacePreview section="editorial" />;
}
