import type { Metadata } from "next";
import { CampaignDetailScreen } from "@/components/campaigns/campaign-detail-screen";

export const metadata: Metadata = {
  title: "Campaign details",
  description:
    "Campaign audience, message preview and delivery metrics for a Partner Club WhatsApp campaign.",
};

/**
 * Campaign records live in the API, so the page is rendered on demand and the
 * client component fetches the campaign and its report.
 */
export default async function CampaignDetailPage(props: PageProps<"/campaigns/[id]">) {
  const { id } = await props.params;
  return <CampaignDetailScreen campaignId={id} />;
}
