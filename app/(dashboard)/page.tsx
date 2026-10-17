import type { Metadata } from "next";
import { DashboardScreen } from "@/components/dashboard/dashboard-screen";

export const metadata: Metadata = {
  title: "Partner Club Overview",
  description:
    "Manage outlets, target the right audience, and track WhatsApp campaigns from one place.",
};

export default function DashboardPage() {
  return <DashboardScreen />;
}
