import type { Metadata } from "next";
import EditorialLandingPreview from "@/components/EditorialLandingPreview";

export const metadata: Metadata = {
  title: "News",
  robots: { index: false, follow: false },
};

export default function NewsPage() {
  return <EditorialLandingPreview section="news" />;
}
