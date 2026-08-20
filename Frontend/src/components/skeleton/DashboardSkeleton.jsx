import React from 'react';
import StatCardSkeleton from './StatCardSkeleton';
import ChartSkeleton from './ChartSkeleton';

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-64 animate-pulse rounded-md bg-surface border border-border-color/50"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
};

export default DashboardSkeleton;
