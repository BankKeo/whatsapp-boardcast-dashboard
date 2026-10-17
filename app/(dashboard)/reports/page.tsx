import type { Metadata } from "next";
import { ReportsScreen } from "@/components/reports/reports-screen";

export const metadata: Metadata = {
  title: "Campaign Reports",
  description:
    "Delivery performance by campaign, province and outlet category, with CSV export for the filtered results.",
};

export default function ReportsPage() {
  return <ReportsScreen />;
}
