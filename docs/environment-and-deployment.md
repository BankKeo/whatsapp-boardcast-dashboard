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

The dashboard needs exactly one variable:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | public | Base URL of the Partner Club API, including the version prefix (default `http://localhost:4000/api/v1`). |

Copy [`.env.example`](../.env.example) to `.env.local`. It is inlined into the
client bundle, so only non-sensitive values belong there — **never** a WhatsApp
access token, app secret or database URL.

Everything else (MongoDB, JWT secrets, WhatsApp credentials, queue driver) is
owned by the API deployment; see the backend `.env.example`. The dashboard
learns the provider state at runtime from `GET /whatsapp/health`, which reports
`simulated: true` whenever no real WhatsApp credentials are configured.

Rules:

- Only `NEXT_PUBLIC_*` values reach the browser.
- CORS on the API must allow this origin (`FRONTEND_URL` / `CORS_ORIGINS` on the
  backend), and requests are sent with credentials so the HTTP-only refresh
  cookie is accepted.

## Request authentication

1. `POST /auth/login` with email + password returns a short-lived access token in
   the response body and sets an HTTP-only refresh cookie scoped to
   `/api/v1/auth`.
2. The access token is kept in memory only (`lib/api/client.ts`); nothing is
   written to `localStorage`.
3. On a cold load, `POST /auth/refresh` restores the session from the cookie.
4. A `401` on any request triggers one single-flight refresh and a retry, so
   parallel calls cannot rotate the refresh token several times at once.
5. `POST /auth/logout` revokes the refresh token server-side and clears cookies.

## Deployment shape

```
CDN (static shell)  ->  Next.js server  ->  Partner Club API  ->  MongoDB
                                                |
                                                └─  Queue/worker (campaign sends, imports)
```

- The app renders a static shell with Partial Prerendering; data is fetched
  client-side from the API with `AbortController`, so no route reads the database
  directly.
- Long work (bulk CSV import, campaign fan-out) runs in the API's queue, not in a
  request. `POST /campaigns/:id/send` prepares recipients and enqueues dispatch,
  so the request returns immediately.
- Sends are idempotent server-side (`campaignId + outletId`) and re-resolve
  consent at send time.
- The API applies rate limiting and a rolling 24-hour per-contact cap
  (`MESSAGING_DAILY_CAP_PER_CONTACT`).

## Operational requirements

- **Backups** for outlet and consent data; retention policy for consent evidence.
- **Observability**: the API logs every send decision (included/excluded +
  reason), every webhook receipt, and every template status change.
- **Audit**: the append-only audit trail is served by `GET /audit-logs` and
  visualised in Settings → Audit log and the dashboard activity feed.
- **Cost model**: pricing is the `reporting.pricing` settings section. Until an
  administrator configures it, the review step and Settings report the estimate
  as unavailable.

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
