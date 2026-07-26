// Shared placeholders for the parts of a screen that stream in from Airtable.
// The page shell (title, filters, chrome) renders instantly; these fill the gap
// for the few moments the data is in flight.

export function TableSkeleton({ rows = 8, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="h-12 bg-gray-50 border-b border-gray-200" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 border-b border-gray-100 flex items-center px-6 gap-6">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className="h-4 rounded bg-gray-100 animate-pulse"
              style={{ width: `${[9, 6, 5, 7, 4, 6][j % 6]}rem` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div className="h-5 w-32 bg-gray-100 rounded mb-4" />
          <div className="h-3 w-24 bg-gray-50 rounded" />
        </div>
      ))}
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 h-[74px] animate-pulse" />
  );
}

export function BlockSkeleton({ className = "h-64" }: { className?: string }) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 animate-pulse ${className}`}
    />
  );
}
