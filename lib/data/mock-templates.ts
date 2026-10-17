/** Message template demo dataset accessor. */

import { getDemoDataset } from "./dataset";
import type { MessageTemplate } from "@/types/template";

export function getMockTemplates(): MessageTemplate[] {
  return getDemoDataset().templates;
}
