export function SkeletonCard() {
  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex gap-2">
        <div className="shimmer h-5 w-16 rounded-full" />
        <div className="shimmer h-5 w-20 rounded-full" />
      </div>
      <div className="shimmer h-4 w-full rounded-lg" />
      <div className="shimmer h-4 w-3/4 rounded-lg" />
      <div className="shimmer h-2 w-full rounded-full" />
      <div className="grid grid-cols-2 gap-2">
        <div className="shimmer h-9 rounded-lg" />
        <div className="shimmer h-9 rounded-lg" />
      </div>
      <div className="flex justify-between">
        <div className="shimmer h-3 w-20 rounded-full" />
        <div className="shimmer h-3 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonLeaderRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="shimmer w-5 h-5 rounded-full" />
      <div className="shimmer w-8 h-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <div className="shimmer h-3.5 w-28 rounded-full" />
        <div className="shimmer h-3 w-16 rounded-full" />
      </div>
      <div className="shimmer h-4 w-16 rounded-full" />
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="glass-gold rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="shimmer w-20 h-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="shimmer h-5 w-40 rounded-full" />
          <div className="shimmer h-4 w-28 rounded-full" />
          <div className="shimmer h-3 w-48 rounded-full" />
        </div>
      </div>
      <div className="shimmer h-2 w-full rounded-full" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shimmer h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonPredictions({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
