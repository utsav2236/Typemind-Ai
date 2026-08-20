import React, { useContext, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Keyboard, LayoutDashboard, BarChart3, UserCircle, LogOut, Settings, Award, Menu, ChevronLeft, Home } from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import SoundToggle from '../components/typing/SoundToggle';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Practice', href: '/typing', icon: Keyboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Leaderboard', href: '/leaderboard', icon: Award },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-text-main">
      {/* Sidebar for Desktop */}
      <aside className={`hidden flex-col border-r border-border-color bg-surface transition-all duration-300 md:flex ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className={`flex h-16 items-center border-b border-border-color ${isSidebarOpen ? 'px-6' : 'px-0 justify-center'}`}>
          <Link to="/dashboard" className="flex items-center gap-2 text-xl font-bold text-primary" title="TypeMind AI">
            <span className="text-xl">◆</span>
            {isSidebarOpen && <span>TypeMind AI</span>}
          </Link>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                title={!isSidebarOpen ? item.name : undefined}
                className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-card hover:text-text-main'
                  } ${!isSidebarOpen ? 'justify-center' : ''}`}
              >
                <item.icon
                  className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-text-secondary group-hover:text-text-main'
                    } ${isSidebarOpen ? 'mr-3' : ''}`}
                  aria-hidden="true"
                />
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border-color p-4 flex flex-col gap-1">

          <Link
            to="/settings"
            title={!isSidebarOpen ? "Settings" : undefined}
            className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-card hover:text-text-main transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
          >
            <Settings className={`h-5 w-5 flex-shrink-0 ${isSidebarOpen ? 'mr-3' : ''}`} />
            {isSidebarOpen && <span>Settings</span>}
          </Link>
          <button
            onClick={logout}
            title={!isSidebarOpen ? "Sign Out" : undefined}
            className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-card hover:text-error transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
          >
            <LogOut className={`h-5 w-5 flex-shrink-0 ${isSidebarOpen ? 'mr-3' : ''}`} />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar for Desktop (Mobile gets bottom nav) */}
        <header className="flex h-16 items-center justify-between border-b border-border-color bg-surface px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex p-2 -ml-2 rounded-lg text-text-secondary hover:bg-card hover:text-text-main focus:outline-none transition-colors"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div className="md:hidden flex items-center">
              <Link to="/dashboard" className="flex items-center gap-2 text-lg font-bold text-primary">
                <span className="text-xl">◆</span> TypeMind AI
              </Link>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4">
            <SoundToggle />
            <ThemeToggle />
            <Link to="/profile" className="hidden md:flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-full object-cover border border-border-color" />
              ) : (
                <UserCircle className="h-6 w-6" />
              )}
              <span>{user?.name}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-bg p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          {children || <Outlet />}
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 z-50 w-full border-t border-border-color bg-surface md:hidden">
        <div className="flex h-16 items-center justify-around">
          {navigation.map((item) => {
            const isActive = item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-text-secondary hover:text-text-main'
                  }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
