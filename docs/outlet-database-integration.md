# Outlet database integration

## Current behaviour

- `lib/data/generate.ts` creates 12,480 outlet records from a fixed seed with
  `mulberry32`, so the same data appears on every render.
- `lib/data/dataset.ts` composes outlets, campaigns, segments, templates, team
  members and activity into one object, cached per page load.
- `lib/store/demo-store.tsx` generates that dataset in a browser effect, keeps it
  in React state, and persists only the user's changes:
  - outlet upserts and deletion ids
  - segments, campaigns, templates, team members and the activity feed
- `lib/services/outlet-service.ts` holds every query the UI performs. Those
  functions take `Outlet[]` as their first argument, which is the seam to
  replace with a data layer.

## Target shape

```
Browser (React)  ->  Server actions / route handlers  ->  Outlet service  ->  Database
```

Recommended contracts (all already implemented as pure functions):

| Function | Purpose | SQL shape |
| --- | --- | --- |
| `filterOutlets(outlets, filters)` | search + province/district/category/eligibility/consent/phone/quality filters | `SELECT … WHERE …` with indexed columns on `province`, `category`, `phone_e164` |
| `audienceBreakdown(outlets, filters)` | matched / eligible / consented / deliverable counts | aggregate query (`COUNT(*) FILTER (WHERE …)`) |
| `computeOutletStats(outlets)` | dashboard KPIs and distributions | grouped aggregates, cached for a few minutes |
| `outletsToCsv(outlets)` | export of the filtered set | streamed export for large sets |
| `parseOutletsCsv(text, existing)` | import validation and duplicate detection | unique index on `phone_e164` |

## Required table

`outlets`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text / uuid, PK | UI uses opaque strings (`out-00001`). |
| `name` | text, not null | Outlet name, 2–120 chars. |
| `owner_name` | text, not null | 2–120 chars. |
| `phone_raw` | text | Exactly what was captured, used for auditing. |
| `phone_e164` | text, unique-ish | Normalised (`+85620XXXXXXXX`). Nullable when invalid/missing. |
| `province` | text, not null | Must match the configured province list. |
| `district` | text, not null | Must belong to the province. |
| `village` | text | Optional. |
| `category` | text, not null | `On-Trade`, `Off-Trade`, `Modern Trade` (extensible). |
| `whatsapp_verified` | boolean, not null | Confirmed opt-in on WhatsApp. |
| `marketing_consent` | boolean, not null | Marketing consent on file. |
| `consent_recorded_at` | timestamptz | Required when `marketing_consent` is true. |
| `status` | text, not null | `Active`, `Inactive`, `Pending Review`. |
| `channel` | text, not null | `Field team`, `CSV import`, `Distributor list`, `Partner referral`. |
| `notes` | text | Free text, ≤ 400 chars. |
| `created_at`, `updated_at` | timestamptz, not null | `updated_at` drives the “Last updated” column. |

Also needed:

- `outlet_categories` and `provinces`/`districts` reference tables (or enums plus
  a districts table) so settings can add values without a deploy.
- An append-only `outlet_audit` table for edits, imports and deletions, feeding
  the audit log that the prototype currently renders from demo activity.

## Data quality rules the UI already applies

1. A phone number is **Valid** only when it normalises to a Lao mobile number
   (`+856 20` + 8 digits). `lib/phone.ts` holds that logic — port it server-side
   rather than re-implementing it.
2. **Eligible** = `whatsapp_verified` **and** valid phone number.
3. **Deliverable** = eligible **and** `marketing_consent`.
4. **Duplicate** = the same normalised number on more than one record. Import
   surfacing already warns per row (`database` or `file` duplicates).
5. **Data quality** buckets: `Complete` (valid + verified + consented + unique),
   `Needs review` (valid but missing verification, consent or uniqueness),
   `Incomplete` (missing or invalid phone).

## Import/export notes

- Only CSV is implemented. Excel (`.xlsx`) is **not** parsed, and the UI says so.
  Adding Excel support means a server-side parser step before
  `parseOutletsCsv`.
- Import is currently all-or-nothing per row: rows with errors are skipped,
  warning-level rows are importable with a placeholder district when the incoming
  district is unknown.
- For large registers, move import to a background job with a progress record; the
  UI already renders a per-row validation table that can poll instead.

## Migration steps

1. Create the schema above and import the seeded data if the demo dataset is
   useful as a starting point (`pnpm tsx scripts/export-demo-outlets.ts` — add the
   script when the database is available).
2. Move `lib/services/outlet-service.ts` filters into SQL, keeping the same
   return shapes so the table, segment builder and campaign wizard are untouched.
3. Replace the store's outlet slice with server data plus optimistic mutations.
4. Keep `localStorage` persistence only as an offline-demo fallback, or remove it
   once the API is authoritative.
