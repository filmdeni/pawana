import { SkeletonProfile } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <SkeletonProfile />
      <div className="shimmer rounded-xl h-48 w-full" />
      <div className="shimmer rounded-xl h-40 w-full" />
      <div className="shimmer rounded-xl h-56 w-full" />
    </div>
  );
}
