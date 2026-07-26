import { TableSkeleton } from "@/components/Skeletons";

// Safety net for a screen whose shell hasn't been prefetched yet. Each page
// renders its own header and skeletons once the shell arrives, so this stays
// deliberately neutral.
export default function Loading() {
  return (
    <div className="p-8">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
      <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-8" />
      <TableSkeleton rows={8} columns={5} />
    </div>
  );
}
