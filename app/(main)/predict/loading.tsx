import { SkeletonPredictions } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-5">
      <div className="flex justify-between items-end">
        <div className="space-y-1.5">
          <div className="shimmer h-6 w-40 rounded-full" />
          <div className="shimmer h-4 w-56 rounded-full" />
        </div>
        <div className="shimmer h-9 w-36 rounded-xl" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="shimmer h-6 w-14 rounded-full" />
        ))}
      </div>
      <SkeletonPredictions count={6} />
    </div>
  );
}
