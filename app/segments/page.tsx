import type { Metadata } from "next";
import { SegmentsScreen } from "@/components/segments/segments-screen";

export const metadata: Metadata = {
  title: "Audience Segments",
  description:
    "Build reusable WhatsApp audiences from outlet province, category, eligibility and consent rules.",
};

export default function SegmentsPage() {
  return <SegmentsScreen />;
}
