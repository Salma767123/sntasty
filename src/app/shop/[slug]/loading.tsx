export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav placeholder */}
      <div className="h-24 bg-[#234d1b]" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Image skeleton */}
          <div className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
          {/* Details skeleton */}
          <div className="space-y-4 py-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4" />
            <div className="h-20 bg-gray-200 rounded animate-pulse w-full mt-4" />
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse w-1/2 mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
