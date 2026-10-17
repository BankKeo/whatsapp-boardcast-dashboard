import { LoadingState } from "@/components/shared/loading-state";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="h-6 w-56 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded-md bg-muted" />
      </div>
      <LoadingState variant="page" label="Loading Partner Club workspace…" />
    </div>
  );
}
