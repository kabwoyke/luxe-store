export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-[1.25rem] border border-border bg-white sm:rounded-[1.6rem]">
          <div className="aspect-square animate-pulse bg-blush" />
          <div className="space-y-2 p-3 sm:p-4">
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-blush" />
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-blush" />
            <div className="h-10 animate-pulse rounded-full bg-blush" />
          </div>
        </li>
      ))}
    </ul>
  );
}
