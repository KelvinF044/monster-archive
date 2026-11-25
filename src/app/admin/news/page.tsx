import type { Metadata } from "next";
import AdminEditorialWorkspacePreview from "@/components/AdminEditorialWorkspacePreview";

export const metadata: Metadata = {
  title: "News",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminEditorialWorkspacePreview section="news" />;
}
