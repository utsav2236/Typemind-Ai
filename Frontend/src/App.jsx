import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import CheckEmail from './pages/CheckEmail';
import VerifyEmail from './pages/VerifyEmail';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

import Dashboard from './pages/Dashboard';
import TypingTest from './components/typing/ActiveTypingTest';
import TestResult from './pages/TestResult';
import AIPractice from './pages/AIPractice';
import Analytics from './pages/Analytics';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import GuestResults from './pages/GuestResults';
import NavbarSkeleton from './components/skeleton/NavbarSkeleton';

import { AuthContext } from './context/AuthContext';

const NotFound = () => <div className="p-8 text-center text-error text-xl">404 - Page Not Found</div>;

const UnifiedHome = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <NavbarSkeleton />;
  }

  if (user) {
    return (
      <DashboardLayout>
        <Landing />
      </DashboardLayout>
    );
  }

  return (
    <PublicLayout>
      <Landing />
    </PublicLayout>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" toastOptions={{
            style: {
              background: 'var(--theme-card)',
              color: 'var(--theme-text-main)',
              border: '1px solid var(--theme-border-color)'
            }
          }} />
          <Routes>
            {/* The Unified Home page is rendered at the top level so it can switch layouts */}
            <Route path="/" element={<UnifiedHome />} />

            <Route element={<PublicLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/check-email" element={<CheckEmail />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/typing-test" element={<TypingTest />} />
              <Route path="/results/guest" element={<GuestResults />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/typing" element={<TypingTest />} />
              <Route path="/practice" element={<AIPractice />} />
              <Route path="/results/:id" element={<TestResult />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

