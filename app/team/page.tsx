import type { Metadata } from "next";
import { TeamScreen } from "@/components/team/team-screen";

export const metadata: Metadata = {
  title: "Team & Permissions",
  description:
    "Team member table with roles, status and last activity, plus the role capability matrix used by the prototype.",
};

export default function TeamPage() {
  return <TeamScreen />;
}
