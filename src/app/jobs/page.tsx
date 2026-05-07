import { Suspense } from "react";
import JobsContent from "./JobsContent";

function JobsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Header skeleton */}
      <div>
        <div className="h-8 sm:h-10 bg-slate-100 rounded-lg w-48 mb-2 animate-pulse"></div>
        <div className="h-4 bg-slate-100 rounded w-64 animate-pulse"></div>
      </div>

      {/* Search bar skeleton */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 h-12 bg-slate-50 rounded-xl animate-pulse"></div>
          <div className="flex gap-2">
            <div className="w-24 h-12 bg-slate-50 rounded-xl animate-pulse"></div>
            <div className="w-20 h-12 bg-slate-50 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Results count skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-5 bg-slate-100 rounded w-32 animate-pulse"></div>
        <div className="h-4 bg-slate-100 rounded w-24 animate-pulse"></div>
      </div>

      {/* Job cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 h-60 animate-pulse">
            <div className="flex justify-between mb-4">
              <div className="h-5 bg-slate-100 rounded w-20"></div>
              <div className="h-5 bg-slate-100 rounded w-16"></div>
            </div>
            <div className="h-6 bg-slate-100 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-slate-100 rounded w-1/2 mb-6"></div>
            <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
            <div className="h-3 bg-slate-100 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function JobsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const initialSearch = typeof searchParams?.search === "string" ? searchParams.search : "";
  const initialCategory = typeof searchParams?.cat === "string" ? searchParams.cat : "";
  const initialType = typeof searchParams?.type === "string" ? searchParams.type : "";
  const initialLocation = typeof searchParams?.location === "string" ? searchParams.location : "";

  return (
    <Suspense fallback={<JobsSkeleton />}>
      <JobsContent
        initialSearch={initialSearch}
        initialCategory={initialCategory}
        initialType={initialType}
        initialLocation={initialLocation}
      />
    </Suspense>
  );
}
