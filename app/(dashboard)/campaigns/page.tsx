import type { Metadata } from "next";
import { CampaignsScreen } from "@/components/campaigns/campaigns-screen";

export const metadata: Metadata = {
  title: "Campaigns",
  description:
    "Create, review and monitor Partner Club WhatsApp campaigns with audience, owner and delivery detail.",
};

export default function CampaignsPage() {
  return <CampaignsScreen />;
}
