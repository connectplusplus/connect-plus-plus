export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      <div>
        <div className="skeleton h-7 w-48 mb-2" />
        <div className="skeleton h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-5">
            <div className="skeleton h-3 w-24 mb-4" />
            <div className="skeleton h-8 w-16" />
          </div>
        ))}
      </div>
      <div>
        <div className="skeleton h-5 w-36 mb-5" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-5">
              <div className="skeleton h-4 w-3/4 mb-3" />
              <div className="skeleton h-3 w-1/2 mb-4" />
              <div className="skeleton h-1.5 w-full mb-4" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
