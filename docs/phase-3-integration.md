# Phase 3 — Integration preparation

The prototype in this repository is a **front-end demonstration only**. It runs
entirely in the browser against a generated demo dataset. Nothing in it talks to
a database, an email service, or the WhatsApp Business Platform.

This folder documents what has to happen for the prototype to become a real
product, and it marks the boundary between what is already implemented and what
is deliberately missing.

| Document | Covers |
| --- | --- |
| [`outlet-database-integration.md`](./outlet-database-integration.md) | Where outlet, consent and audience data must come from, and the contracts the UI already expects. |
| [`whatsapp-integration-boundary.md`](./whatsapp-integration-boundary.md) | The WhatsApp Business Platform boundary: templates, sends, webhooks, metrics, failures. |
| [`consent-and-eligibility.md`](./consent-and-eligibility.md) | Consent capture, eligibility rules and the validation already enforced in the UI. |
| [`environment-and-deployment.md`](./environment-and-deployment.md) | Environment variables, secrets handling, deployment shape and operating limits. |

## What is already real

- Route structure, layouts and the full navigation shell (Next.js App Router).
- Outlet search, filter, sort, paginate, create, edit, delete, CSV import and
  export — all genuinely interactive against the in-memory dataset.
- Audience segment building with live matching counts, save, rename, duplicate
  and delete.
- The five-step campaign wizard, including review checks and the demo send flow.
- Template library with categories, languages, variables, approval state and
  warnings.
- Reports with summary metrics, charts, an apportioned province/category
  breakdown, a results table and CSV export.
- Zod schemas shared by every form, with React Hook Form validation.

## What is not real

- No database. Records are generated deterministically in the browser and
  optionally persisted to `localStorage`.
- No authentication. The signed-in user and role are fixed demo values.
- No WhatsApp Business Platform connection, no credential storage, no webhook,
  no template submission and no real delivery.
- No campaign scheduling engine. A scheduled campaign is a stored timestamp.
- No cost model. Pricing is explicitly unconfigured, so no estimate is shown.

## Suggested sequence

1. **Stand up the outlet service of record** (see
   `outlet-database-integration.md`) and replace `lib/data/dataset.ts` reads with
   server-side queries behind the same service functions in `lib/services/`.
2. **Add authentication and roles** (see `environment-and-deployment.md`) so
   `CURRENT_USER` in `lib/data/constants.ts` is replaced by the real session.
3. **Connect WhatsApp templates and sends** (see
   `whatsapp-integration-boundary.md`) behind a server-only module. The wizard
   already produces everything that boundary needs: audience rules, recipient
   count, template reference, language, message body and schedule.
4. **Turn on eligibility and consent enforcement server-side** (see
   `consent-and-eligibility.md`). The UI already calculates the same numbers.
5. **Replace simulated metrics** with webhook-fed delivery data, keeping the same
   `CampaignMetrics` shape so reports and the results table keep working.
