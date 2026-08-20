import React from 'react';
import Skeleton from './Skeleton';
import StatCardSkeleton from './StatCardSkeleton';
import ChartSkeleton from './ChartSkeleton';

const AnalyticsSkeleton = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" rounded="rounded-md" />
          <Skeleton className="h-4 w-64" rounded="rounded-md" />
        </div>
        
        {/* Time filters skeleton */}
        <div className="flex items-center gap-2 rounded-lg bg-surface p-1 border border-border-color">
           <Skeleton className="h-8 w-12" rounded="rounded-md" />
           <Skeleton className="h-8 w-12" rounded="rounded-md" />
           <Skeleton className="h-8 w-12" rounded="rounded-md" />
           <Skeleton className="h-8 w-12" rounded="rounded-md" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Main Chart */}
      <ChartSkeleton title={true} />

      {/* Bottom section (Weaknesses grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="rounded-xl border border-border-color bg-surface p-6">
            <Skeleton className="h-6 w-32 mb-6" rounded="rounded-md" />
            <div className="space-y-4">
               <Skeleton className="h-10 w-full" rounded="rounded-lg" />
               <Skeleton className="h-10 w-full" rounded="rounded-lg" />
               <Skeleton className="h-10 w-full" rounded="rounded-lg" />
               <Skeleton className="h-10 w-full" rounded="rounded-lg" />
               <Skeleton className="h-10 w-full" rounded="rounded-lg" />
            </div>
         </div>
         <div className="rounded-xl border border-border-color bg-surface p-6">
            <Skeleton className="h-6 w-32 mb-6" rounded="rounded-md" />
            <div className="space-y-4">
               <Skeleton className="h-10 w-full" rounded="rounded-lg" />
               <Skeleton className="h-10 w-full" rounded="rounded-lg" />
               <Skeleton className="h-10 w-full" rounded="rounded-lg" />
               <Skeleton className="h-10 w-full" rounded="rounded-lg" />
               <Skeleton className="h-10 w-full" rounded="rounded-lg" />
            </div>
         </div>
      </div>
    </div>
  );
};

export default AnalyticsSkeleton;
