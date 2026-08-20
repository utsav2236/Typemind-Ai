import React from 'react';
import { Keyboard } from 'lucide-react';
import Skeleton from './Skeleton';

const NavbarSkeleton = () => {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text-main">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border-color bg-bg/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xl font-bold text-text-main">
          <Keyboard className="h-6 w-6 text-primary" />
          <span>TypeMind AI</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          {/* Theme/Sound toggle skeletons */}
          <Skeleton className="h-8 w-8" rounded="rounded-md" />
          <Skeleton className="h-8 w-8" rounded="rounded-md" />
          
          {/* Auth Action Skeleton (pill) */}
          <Skeleton className="h-9 w-24 hidden sm:block" rounded="rounded-lg" />
          <Skeleton className="h-9 w-24" rounded="rounded-lg" />
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center">
        {/* Optional body skeleton loading state */}
        <div className="flex flex-col items-center justify-center space-y-4 opacity-50">
           <Skeleton className="h-12 w-12" rounded="rounded-full" />
           <Skeleton className="h-4 w-32" rounded="rounded-full" />
        </div>
      </main>
    </div>
  );
};

export default NavbarSkeleton;
