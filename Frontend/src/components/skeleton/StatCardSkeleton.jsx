import React from 'react';
import Skeleton from './Skeleton';

const StatCardSkeleton = ({ showTrend = false }) => {
  return (
    <div className="rounded-xl border border-border-color bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          {/* Title skeleton */}
          <Skeleton className="h-4 w-20" rounded="rounded-md" />
          {/* Value skeleton */}
          <Skeleton className="h-8 w-24 mt-1" rounded="rounded-md" />
        </div>
        {/* Icon skeleton */}
        <Skeleton className="h-12 w-12" rounded="rounded-lg" />
      </div>
      {showTrend && (
        <div className="mt-4 flex items-center gap-2">
          {/* Trend skeleton */}
          <Skeleton className="h-4 w-12" rounded="rounded-md" />
          <Skeleton className="h-4 w-24" rounded="rounded-md" />
        </div>
      )}
    </div>
  );
};

export default StatCardSkeleton;
