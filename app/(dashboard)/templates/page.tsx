import type { Metadata } from "next";
import { TemplatesScreen } from "@/components/templates/templates-screen";

export const metadata: Metadata = {
  title: "Message Templates",
  description:
    "Searchable library of WhatsApp message templates, with category, language, approval status and variables.",
};

export default function TemplatesPage() {
  return <TemplatesScreen />;
}
