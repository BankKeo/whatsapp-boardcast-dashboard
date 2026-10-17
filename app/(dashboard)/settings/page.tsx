import type { Metadata } from "next";
import { SettingsScreen } from "@/components/settings/settings-screen";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Company profile, integration status, provincial settings, approval workflow, messaging limits, consent rules and audit log.",
};

export default function SettingsPage() {
  return <SettingsScreen />;
}
