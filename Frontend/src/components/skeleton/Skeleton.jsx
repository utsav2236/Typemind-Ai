import React from 'react';

/**
 * Base Skeleton component.
 * Uses pulse animation by default. Matches existing theme surfaces.
 */
const Skeleton = ({ className = '', rounded = 'rounded-md', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-surface border border-border-color/50 ${rounded} ${className}`}
      {...props}
    />
  );
};

export default Skeleton;
