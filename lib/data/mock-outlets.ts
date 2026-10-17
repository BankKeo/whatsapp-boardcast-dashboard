/** Outlet demo dataset accessor. */

import { getDemoDataset } from "./dataset";
import type { Outlet } from "@/types/outlet";

export function getMockOutlets(): Outlet[] {
  return getDemoDataset().outlets;
}
