# Environment variables and deployment

## Runtime

| Item | Value |
| --- | --- |
| Node.js | 24 (see `.node_modules`-free repo: only `packageManager` and `engines` matter) |
| Package manager | pnpm 12.6.0 (`packageManager` field) |
| Framework | Next.js 16.4.2 (App Router, Turbopack, Cache Components) |
| React | 19.3.0 |
| Styling | Tailwind CSS v4 via `@tailwindcss/turbopack` |
| TypeScript | strict, `next typegen` output in `.next/types` |

## Environment variables

The prototype needs **none**. It reads no configuration and holds no secrets.

When integrations are added, use this split:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | server only | Outlet/consent/campaign service of record. |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | server only | Business account for template and send calls. |
| `WHATSAPP_PHONE_NUMBER_ID` | server only | Sender identity. |
| `WHATSAPP_ACCESS_TOKEN` | server only | Graph API access token; rotate regularly, never log it. |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | server only | Webhook verification handshake. |
| `WHATSAPP_APP_SECRET` | server only | Webhook signature validation. |
| `AUTH_SECRET` / IdP settings | server only | Session signing or identity provider. |
| `NEXT_PUBLIC_APP_NAME` | public | Safe, non-sensitive branding value. |

Rules:

- Only `NEXT_PUBLIC_*` values reach the browser. Never put a token or id there.
- Validate environment variables at boot with Zod (reuse `lib/schemas/`) so a
  misconfigured deployment fails fast instead of silently running in demo mode.
- Keep `.env*` out of version control (already ignored) and document the required
  keys in this file.

## Deployment shape

```
CDN (static shell)  ->  Next.js server (SSR + server actions)  ->  Database
                             |                    |
                             |                    └─  Queue/worker (campaign sends, imports)
                             └─  WhatsApp Business Platform (Graph API + webhooks)
```

- The app already renders a static shell with Partial Prerendering, so most
  routes can be served from a CDN. Any route that reads real data must move that
  read into `use cache` or behind `<Suspense>` (Cache Components is enabled, and
  the dev overlay will point at the exact spot).
- Long work (bulk CSV import, campaign fan-out) belongs in a queue, not in a
  request. The prototype's simulate-send path is intentionally synchronous.
- Sends must be idempotent: key each attempt by `campaignId + outletId` so a
  retry cannot double-message a contact.
- Add rate limiting per campaign and per contact window before enabling real
  sends, and honour the WhatsApp messaging window for the recipient's timezone.

## Operational requirements

- **Backups** for outlet and consent data; retention policy for consent evidence.
- **Observability**: log every send decision (included/excluded + reason), every
  webhook receipt, and every template status change.
- **Audit**: keep the append-only audit trail the UI already visualises in
  Settings → Audit log.
- **Cost model**: pricing must be configured before the reports screen can show
  estimates. `PRICING.configured` in `lib/data/constants.ts` is the current
  switch; keep it false until real prices exist.
- **Demo data removal**: once the API is authoritative, remove
  `lib/data/generate.ts`, the `localStorage` persistence in
  `lib/store/demo-store.tsx`, and the “Reset demo data” controls.

## Build and checks

```bash
pnpm install
pnpm dev            # development server
pnpm build          # production build (also runs type generation + type check)
pnpm start          # serve the production build
pnpm lint           # eslint
pnpm exec tsc --noEmit   # standalone type check
```

`next build` runs TypeScript and fails on type errors, so it doubles as the CI
gate for the prototype.
