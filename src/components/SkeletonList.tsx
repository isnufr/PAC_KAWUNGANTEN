import React from 'react';

export default function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full flex flex-col gap-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center p-3 bg-slate-50/70 rounded-2xl border border-slate-100 gap-3">
          {/* Avatar / Icon Skeleton */}
          <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-200 rounded-xl shrink-0"></div>
          
          {/* Info Skeleton */}
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-slate-200 rounded-md w-2/3 md:w-1/3"></div>
            <div className="flex gap-2">
              <div className="h-3 bg-slate-200 rounded-md w-16"></div>
              <div className="h-3 bg-slate-200 rounded-md w-16"></div>
              <div className="h-3 bg-slate-200 rounded-md w-12 hidden sm:block"></div>
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex gap-1.5 shrink-0">
            <div className="w-7 h-7 sm:w-9 sm:h-9 bg-slate-200 rounded-lg sm:rounded-xl"></div>
            <div className="w-7 h-7 sm:w-9 sm:h-9 bg-slate-200 rounded-lg sm:rounded-xl hidden sm:block"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
