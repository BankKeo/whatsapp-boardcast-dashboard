/** Demo activity feed types. */

export const ACTIVITY_TYPES = [
  "campaign",
  "outlet",
  "segment",
  "template",
  "team",
  "integration",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  actor: string;
  message: string;
  /** ISO timestamp. */
  at: string;
}
