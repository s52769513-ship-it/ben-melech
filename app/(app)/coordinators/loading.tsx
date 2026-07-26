export default function Loading() {
  return (
    <div className="p-8">
      <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-8" />
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
        <div className="h-12 bg-gray-50 border-b border-gray-200" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-14 border-b border-gray-100 flex items-center px-6 gap-4">
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-4 w-28 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
