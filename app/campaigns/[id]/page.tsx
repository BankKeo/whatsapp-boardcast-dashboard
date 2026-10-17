import type { Metadata } from "next";
import { Suspense } from "react";
import { getDemoDataset } from "@/lib/data/dataset";
import { CampaignDetailScreen } from "@/components/campaigns/campaign-detail-screen";
import { LoadingState } from "@/components/shared/loading-state";

export const metadata: Metadata = {
  title: "Campaign details",
  description:
    "Campaign audience, message preview and simulated delivery metrics for a Partner Club WhatsApp campaign.",
};

/**
 * Demo campaigns are generated deterministically, so the known references are
 * prerendered. Campaigns created in the browser resolve at request time.
 */
export function generateStaticParams() {
  return getDemoDataset().campaigns.map((campaign) => ({ id: campaign.id }));
}

export default function CampaignDetailPage(props: PageProps<"/campaigns/[id]">) {
  return (
    <Suspense fallback={<LoadingState variant="page" label="Loading campaign…" />}>
      <CampaignDetailLoader params={props.params} />
    </Suspense>
  );
}

async function CampaignDetailLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignDetailScreen campaignId={id} />;
}
