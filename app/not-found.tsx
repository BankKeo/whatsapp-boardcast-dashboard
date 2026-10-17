import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

export default function NotFound() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Page not found</h1>
      <Card>
        <EmptyState
          icon={<Compass aria-hidden="true" />}
          title="This screen does not exist"
          description="Check the address or return to the Partner Club overview."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button asChild size="sm">
                <Link href="/">Go to dashboard</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/campaigns">View campaigns</Link>
              </Button>
            </div>
          }
        />
      </Card>
    </div>
  );
}
