# Partner Club WhatsApp Marketing System — Admin Dashboard

Enterprise admin dashboard prototype for the **Partner Club** WhatsApp marketing
programme at Lao Brewery Co., Ltd. (Carlsberg Group).

Marketing staff manage outlet contacts, segment outlets by province and
category, compose targeted WhatsApp campaigns and monitor campaign performance —
all from one data-dense workspace.

> **This is a front-end prototype.** Every outlet, campaign, template and metric
> is generated sample data held in the browser. The WhatsApp Business Platform is
> **not** connected and no message is ever sent. See
> [`docs/phase-3-integration.md`](./docs/phase-3-integration.md).

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, Cache Components, Partial Prefetching) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (`@tailwindcss/turbopack`) |
| UI primitives | shadcn/ui-style components on Radix UI |
| Forms | React Hook Form + Zod (`zodResolver`) |
| Icons | Lucide React |
| Charts | Recharts |
| Toasts | Sonner |

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Other scripts:

```bash
pnpm build        # production build (runs type generation + type checking)
pnpm start        # serve the production build
pnpm lint         # eslint
pnpm exec tsc --noEmit   # standalone type check
```

## Screens

| Route | What it does |
| --- | --- |
| `/` | Partner Club Overview — KPIs, campaign performance chart (7/30/90 days), recent campaigns, outlet distribution, contact data quality, activity feed and quick actions. |
| `/outlets` | Outlet Database — search, province/district/category/eligibility/consent/phone/quality filters, sortable columns, pagination, page-size selector, row selection, bulk actions, add/edit dialogs, detail sheet, delete confirmation, CSV import with validation preview and CSV export. |
| `/segments` | Audience Segments — visual rule builder with live matching counts, recipient preview, and a saved-segment table with edit, duplicate and delete. |
| `/campaigns` | Campaigns — filterable table (search, status, province, owner, created date), duplicate, cancel schedules, edit metadata, delete drafts, export. |
| `/campaigns/new` | Five-step wizard: campaign details → audience → message composition → review with pre-flight checks → send or schedule. |
| `/campaigns/[id]` | Campaign detail — audience snapshot, metrics, message preview, apportioned province performance and state-specific actions. |
| `/templates` | Message Templates — searchable library with category, language, approval status, variables, preview sheet, duplicate and edit. |
| `/reports` | Campaign Reports — summary metrics, performance over time, province/category breakdowns and campaign comparison, plus a filterable results table and CSV export. |
| `/team` | Team & Permissions — member table, invite dialog, role changes, deactivate confirmation and the role capability matrix. |
| `/settings` | Settings — company profile, integration statuses, provinces/categories, permissions, approval workflow, messaging limits, consent rules and audit log. |

## Project structure

```
app/                     routes (server components that render client screens)
components/
  ui/                    shadcn/ui-style primitives built on Radix
  layout/                app shell, sidebar, header, page header, global search
  dashboard/ outlets/ segments/ campaigns/ templates/ reports/ team/ settings/
  shared/                data table, filters, status badges, dialogs, empty/loading states
lib/
  data/                  demo dataset generators (constants, generate, dataset, mock-*)
  schemas/               Zod schemas for outlets, campaigns, segments, templates, team
  services/              pure query/aggregation services per domain
  store/                 client demo-data store with localStorage persistence
  phone.ts format.ts utils.ts
types/                   domain types + constants
docs/                    Phase 3 integration documentation
```

## How the demo data works

- `lib/data/generate.ts` builds the dataset deterministically from a fixed seed:
  **12,480 outlets** (10,860 WhatsApp-eligible, 10,320 with consent, 96 missing
  and 288 invalid phone numbers, 84 duplicate phone records), **95 campaigns**
  (18 in the current month with exactly 42,650 delivered / 1,412 failed / 96.8%
  delivery rate), 8 templates, 6 saved segments and 7 team members.
- The dataset is created **in the browser after mount** so relative dates are
  always current and prerendering stays deterministic.
- Changes (outlet edits, imports, segments, campaigns, templates, team, activity)
  persist to `localStorage`. Campaign/outlet KPI totals, filters, pagination and
  the campaign workflow are all genuinely interactive and computed from that
  dataset — nothing is hardcoded in the UI.
- **Reset demo data** (sidebar or Settings) clears local changes and rebuilds the
  original sample dataset.

## Honest-demo rules followed

- Demo data is labelled on the dashboard, reports, wizard and settings.
- “Simulate send” generates metrics locally and states clearly that no WhatsApp
  message was delivered.
- Template approval is marked as *local* approval; the UI never claims Meta
  approval.
- Integrations show `Demo mode` / `Not configured` instead of fake “connected”
  states, and no API key or token is present in client code.
- Cost estimates are shown as unavailable because no pricing is configured.

## Integration documentation

`docs/` contains the Phase 3 preparation work:

- [`phase-3-integration.md`](./docs/phase-3-integration.md) — overview and sequence
- [`outlet-database-integration.md`](./docs/outlet-database-integration.md) — schema and query contracts
- [`whatsapp-integration-boundary.md`](./docs/whatsapp-integration-boundary.md) — send/template/webhook boundary
- [`consent-and-eligibility.md`](./docs/consent-and-eligibility.md) — consent and eligibility rules
- [`environment-and-deployment.md`](./docs/environment-and-deployment.md) — environment variables and deployment shape
