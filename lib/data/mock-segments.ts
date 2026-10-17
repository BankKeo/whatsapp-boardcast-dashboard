/** Audience segment demo dataset accessor. */

import { getDemoDataset } from "./dataset";
import type { Segment } from "@/types/segment";

export function getMockSegments(): Segment[] {
  return getDemoDataset().segments;
}
