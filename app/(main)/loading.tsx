import { SkeletonPredictions } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="shimmer rounded-2xl h-48 w-full" />
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 xl:col-span-8 space-y-4">
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shimmer h-6 w-16 rounded-full" />
            ))}
          </div>
          <SkeletonPredictions count={4} />
        </div>
        <div className="col-span-12 xl:col-span-4 space-y-4">
          <div className="shimmer rounded-xl h-48 w-full" />
          <div className="shimmer rounded-xl h-56 w-full" />
        </div>
      </div>
    </div>
  );
}
