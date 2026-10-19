# WhatsApp Business Platform integration boundary

The prototype stops at this boundary. Everything below must run **server-side**;
no token, phone number id or template id is ever sent to the browser.

## What the prototype already produces

When a user finishes the campaign wizard, the app has everything a real send
needs:

| Wizard output | Where it lives | Server-side use |
| --- | --- | --- |
| Campaign name, objective, description, owner | `CampaignDetailsValues` | Campaign record + approval trail |
| Audience rules (`OutletFilters`) | `CampaignAudienceValues.filters` | Re-run the audience query at send time |
| Recipient count | `CampaignAudienceValues.recipients` | Sanity check against the re-run query |
| Template reference and language | `CampaignMessageValues` | Pick the approved template name/language |
| Message body with `{{n}}` variables | `CampaignMessageValues.message` | Build template components |
| Optional image header URL | `CampaignMessageValues.imageUrl` | Build the template's image header component |
| Schedule | `scheduledAt` (ISO string) | Cron/queue target |
| Confirmation flag | “I understand this is a demo run” checkbox | Replace with a real approval record |

## Boundary contract (proposed)

```ts
// server-only module, never imported by a client component
interface WhatsappGateway {
  syncTemplates(): Promise<ExternalTemplate[]>;
  submitTemplate(draft: TemplateDraft): Promise<ExternalTemplate>;
  sendCampaign(request: SendCampaignRequest): Promise<{ externalId: string }>;
  getMessageStatus(externalId: string): Promise<MessageStatus>;
}

interface SendCampaignRequest {
  campaignId: string;
  templateName: string;
  language: "en" | "lo";
  /** Resolved per-recipient variable values, keyed by {{1}}..{{6}}. */
  components: { parameters: { type: "text"; text: string }[] }[];
  recipients: { outletId: string; phone: string }[]; // already consented + eligible
  scheduledAt: string | null;
}

interface MessageStatus {
  attempted: number;
  sent: number;
  delivered: number;
  read: number | null;
  failed: number;
  failures: { phone: string; code: string; detail: string }[];
}
```

`CampaignMetrics` in `types/campaign.ts` already matches this shape exactly, so
webhook-fed numbers can drop into the same reporting code.

## Template lifecycle

1. **Local draft** — what the prototype creates (`status: "Draft"`).
2. **Local review** — `Pending Approval` in the prototype; in production this is
   your internal marketing review.
3. **Submission** — send the body, language, category and sample values to the
   platform. Store the returned template id in `externalApprovalId`.
4. **Platform review** — `Approved`, `Rejected` or `Paused`, derived from the
   platform, never set locally.
5. **Send** — only templates with a platform-approved status may be used for a
   real campaign.

The prototype deliberately marks locally approved templates as *locally*
approved (`externalApprovalId: local-approval-*`) and never claims Meta approval.
Keep that distinction when the integration lands.

## Sending

1. Re-run the audience query at send time (never trust the stored snapshot for
   real sends) and drop contacts without consent or with invalid numbers.
2. Expand variables per recipient from the outlet record
   (`lib/services/template-service.ts#renderTemplate` shows the mapping).
3. Enqueue in batches with retry/backoff; persist every attempt.
4. Record rejections separately from undelivered messages — the reports screen
   already separates `attempted`, `sent`, `delivered`, `read` and `failed`.
5. Respect the messaging window and rate limits (not configured in the
   prototype; see `environment-and-deployment.md`).

## Webhooks

Handle at least:

- `messages` status updates: `sent`, `delivered`, `read`, `failed`
- `template_status_update`: approval decisions
- `account_update` / quality rating changes

Each event should upsert into a `campaign_message_events` table keyed by the
provider message id, then roll up into `CampaignMetrics` per campaign. The
prototype's `read: null` case (“read receipts unavailable”) maps to older
campaigns where this data is missing — keep the field nullable.

## Failure and demo honesty

- The prototype shows `DemoNotice` banners on the dashboard, wizard, reports and
  settings. Replace those with a real connection status once credentials exist,
  and keep an explicit “no messages were sent” record for simulated runs.
- Never render a metric that a provider has not reported: if a field is unknown,
  show `—` or `Pending`, as the reports table already does for read receipts.

## What must never happen

- No WhatsApp token, phone number id, or business account id in client code or
  `NEXT_PUBLIC_*` variables.
- No claim of Meta approval for locally created templates.
- No client-side call to the Graph API: route everything through server actions
  or route handlers.
