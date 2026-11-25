import type { Metadata } from "next";
import EditorialLandingPreview from "@/components/EditorialLandingPreview";

export const metadata: Metadata = {
  title: "Events",
  robots: { index: false, follow: false },
};

export default function SchedulePage() {
  return <EditorialLandingPreview section="schedule" />;
}
