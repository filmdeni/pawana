import { SkeletonLeaderRow } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="shimmer h-8 w-56 rounded-full mx-auto" />
        <div className="shimmer h-4 w-40 rounded-full mx-auto" />
      </div>
      {/* Podium */}
      <div className="flex items-end justify-center gap-4">
        <div className="shimmer flex-1 max-w-40 h-36 rounded-2xl" />
        <div className="shimmer flex-1 max-w-48 h-44 rounded-2xl -mt-4" />
        <div className="shimmer flex-1 max-w-40 h-28 rounded-2xl" />
      </div>
      {/* Table */}
      <div className="glass rounded-xl overflow-hidden divide-y divide-[rgba(124,58,237,0.1)]">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonLeaderRow key={i} />)}
      </div>
    </div>
  );
}
