export default function Loading() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="shimmer h-4 w-24 rounded-full" />
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="shimmer rounded-2xl h-48 w-full" />
          <div className="shimmer rounded-2xl h-64 w-full" />
          <div className="shimmer rounded-2xl h-72 w-full" />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="shimmer rounded-xl h-32 w-full" />
          <div className="shimmer rounded-xl h-44 w-full" />
          <div className="shimmer rounded-xl h-36 w-full" />
        </div>
      </div>
    </div>
  );
}
