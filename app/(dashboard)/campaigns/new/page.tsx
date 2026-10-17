import type { Metadata } from "next";
import { CampaignWizard } from "@/components/campaigns/campaign-wizard";

export const metadata: Metadata = {
  title: "Create campaign",
  description:
    "Five-step campaign wizard: details, audience, message composition, review and send or schedule.",
};

export default function NewCampaignPage() {
  return <CampaignWizard />;
}
