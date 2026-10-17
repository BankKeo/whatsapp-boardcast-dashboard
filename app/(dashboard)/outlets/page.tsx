import type { Metadata } from "next";
import { OutletsScreen } from "@/components/outlets/outlets-screen";

export const metadata: Metadata = {
  title: "Outlet Database",
  description:
    "Search, filter and maintain the Partner Club outlet contact register, including WhatsApp eligibility and marketing consent.",
};

export default function OutletsPage() {
  return <OutletsScreen />;
}
