import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Keyboard } from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import SoundToggle from '../components/typing/SoundToggle';

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text-main selection:bg-primary/30 selection:text-white">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border-color bg-bg/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-text-main hover:text-primary transition-colors">
          <Keyboard className="h-6 w-6 text-primary" />
          <span>TypeMind AI</span>
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <SoundToggle />
          <ThemeToggle />
          <Link to="/login" className="text-text-secondary hover:text-text-main transition-colors">
            Sign In
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primaryHover transition-colors"
          >
            Start Free
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children || <Outlet />}
      </main>

      <footer className="border-t border-border-color bg-surface py-8 text-center text-sm text-text-secondary">
        <div className="container mx-auto px-4">
          <p>Â© {new Date().getFullYear()} TypeMind AI. Every test makes your next test smarter.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;

