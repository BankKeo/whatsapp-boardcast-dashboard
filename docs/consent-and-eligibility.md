# Consent and eligibility validation

Two independent conditions decide whether an outlet can receive a campaign
message. The prototype calculates both in the browser; production must enforce
them server-side, in the same order.

## Definitions

| Term | Rule | Implemented in |
| --- | --- | --- |
| **Phone valid** | Normalises to `+85620` + 8 digits | `lib/phone.ts` |
| **Eligible** | `whatsapp_verified` **and** phone valid | `isEligible()` in `lib/services/outlet-service.ts` |
| **Consented** | `marketing_consent` on file, with `consent_recorded_at` | outlet record |
| **Deliverable** | eligible **and** consented | `audienceBreakdown().deliverable` |
| **Duplicate** | same normalised number on another record | `buildDuplicatePhoneIndex()` |
| **Data quality** | `Complete` / `Needs review` / `Incomplete` | `getDataQuality()` |

## Where the UI already enforces it

- **Add/edit outlet** — Zod schema requires a valid Lao mobile number and blocks
  marking a contact verified on WhatsApp without one
  (`lib/schemas/outlet.ts`).
- **Segment builder** — live `audienceBreakdown` shows deliverable vs excluded
  contacts with a reason for each exclusion group.
- **Campaign audience step** — the recipient total is the *deliverable* count, not
  the matched count, and the excluded groups are listed.
- **Campaign review** — blocking warnings for zero eligible recipients, plus
  warnings for missing consent and invalid numbers, before a send can be
  simulated.
- **Reports** — metrics are only produced from simulated sends, so no number is
  presented as real delivery evidence.

## Consent capture requirements

1. Store the **exact text or channel** the consent was captured through, and the
   timestamp. The prototype only stores a boolean plus `consent_recorded_at`;
   add a `consent_source` and `consent_evidence_ref` column.
2. Never infer consent from a phone number being present in a distributor list.
3. Record withdrawal as a first-class event, not a silent boolean flip, and
   honour it immediately in every audience query.
4. Keep an immutable audit trail: who changed consent, when, and from where.

## Server-side enforcement checklist

- [ ] Audience queries always join on `marketing_consent = true` for marketing
      campaigns — never rely on the wizard snapshot.
- [ ] Re-validate the phone number at send time; numbers can be corrected or
      deactivated between planning and sending.
- [ ] Reject recipients whose verification has lapsed.
- [ ] Exclude duplicates from a single send (one message per unique number).
- [ ] Cap frequency: no more than N marketing messages per contact per period.
- [ ] Log every exclusion with a reason so the campaign review screen can show
      the same numbers it shows today.
- [ ] Persist the confirmation that a human approved the send, replacing the
      prototype's “I understand this is a demo run” checkbox.

## Validation reuse

`lib/schemas/*.ts` and `lib/services/*.ts` are pure and portable. When the server
tier is added, import the same schemas in route handlers/server actions so client
and server validation cannot drift. `AudienceBreakdown` is the single source of
truth for “how many contacts will actually receive this”.
