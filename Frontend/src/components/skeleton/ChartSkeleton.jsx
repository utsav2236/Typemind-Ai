import React from 'react';
import Skeleton from './Skeleton';

const ChartSkeleton = ({ title = true }) => {
  return (
    <div className="rounded-xl border border-border-color bg-surface p-6 shadow-sm">
      {title && <Skeleton className="h-6 w-32 mb-6" rounded="rounded-md" />}
      <div className="h-64 w-full flex items-end gap-2 overflow-hidden pb-4">
        {/* Render a realistic looking chart skeleton using alternating height bars */}
        {[...Array(12)].map((_, i) => {
          // generate varied heights for realism
          const heights = ['h-12', 'h-24', 'h-32', 'h-16', 'h-40', 'h-48', 'h-36', 'h-52', 'h-44', 'h-20', 'h-64', 'h-28'];
          return (
            <Skeleton
              key={i}
              className={`flex-1 ${heights[i % heights.length]}`}
              rounded="rounded-t-md"
            />
          );
        })}
      </div>
    </div>
  );
};

export default ChartSkeleton;
