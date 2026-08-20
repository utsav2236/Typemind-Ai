import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Target, Zap, Clock, Trophy, Keyboard } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AuthContext } from '../context/AuthContext';
import analyticsService from '../services/analyticsService';
import DashboardSkeleton from '../components/skeleton/DashboardSkeleton';

const mockPerformance = {
  wpm: 0,
  bestWpm: 0,
  accuracy: 0,
  typingIq: 0,
  streak: 0,
  testsTaken: 0
};

const StatCard = React.memo(({ title, value, icon: Icon, trend }) => (
  <div className="rounded-xl border border-border-color bg-surface p-6 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <p className="mt-2 text-3xl font-bold text-text-main">{value}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-card text-primary">
        <Icon className="h-6 w-6" />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-sm">
        <span className="text-success">{trend}</span>
        <span className="ml-2 text-text-secondary">vs last week</span>
      </div>
    )}
  </div>
));

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wpmData, setWpmData] = useState([]);
  const [weaknessData, setWeaknessData] = useState([]);


  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch overview stats from backend
        const data = await analyticsService.getOverview();
        const overview = data.overview || {};
        setStats({
          wpm: overview.averageWpm || 0,
          bestWpm: overview.bestWpm || 0,
          accuracy: overview.averageAccuracy || 0,
          typingIq: overview.typingIQ || 0,
          streak: overview.currentStreak || 0,
          testsTaken: overview.totalTests || 0,
        });

        // Fetch progress data for chart
        try {
          const progressResponse = await analyticsService.getProgress();
          if (progressResponse.progress && progressResponse.progress.length > 0) {
            setWpmData(progressResponse.progress.map(p => ({
              name: new Date(p.date).toLocaleDateString() || '',
              wpm: p.wpm || 0,
            })));
          }
        } catch (e) {
          console.warn('Progress data unavailable:', e.message);
        }

        // Fetch weakness data for chart
        try {
          const weaknesses = await analyticsService.getWeaknesses();
          if (weaknesses.weakKeys && weaknesses.weakKeys.length > 0) {
            setWeaknessData(weaknesses.weakKeys.slice(0, 5).map(w => ({
              key: w.key || '',
              'Error Rate %': w.errorRate || 0,
            })));
          }
          // The backend doesn't seem to return a specific `recommendation` string in getWeaknesses,
          // but we will keep this in case it does in the future.
        } catch (e) {
          console.warn('Weakness data unavailable:', e.message);
        }

      } catch (err) {
        console.warn('Dashboard data unavailable, using defaults:', err.message);
        setStats(mockPerformance);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  const displayStats = stats || mockPerformance;
  const greeting = user?.name ? `Good evening, ${user.name} 👋` : 'Good evening 👋';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-main">{greeting}</h1>
      </div>


      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Current WPM" value={displayStats.wpm} icon={Zap} trend={displayStats.testsTaken > 1 ? undefined : undefined} />
        <StatCard title="Accuracy" value={`${displayStats.accuracy}%`} icon={Target} />
        <StatCard title="Typing IQ" value={displayStats.typingIq} icon={Activity} />
        <StatCard title="Best WPM" value={displayStats.bestWpm} icon={Trophy} />
        <StatCard title="Current Streak" value={`${displayStats.streak} days`} icon={Clock} />
        <StatCard title="Total Tests" value={displayStats.testsTaken} icon={Keyboard} />
      </div>

      {/* Charts Row â€” only show if there's data */}
      {(wpmData.length > 0 || weaknessData.length > 0) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* WPM Chart */}
          {wpmData.length > 0 && (
            <div className="rounded-xl border border-border-color bg-surface p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-medium text-text-main">WPM Progress</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={wpmData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" vertical={false} />
                    <XAxis dataKey="name" stroke="#94A3B8" tick={{ fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#172033', border: 'none', borderRadius: '8px', color: '#F8FAFC' }}
                      itemStyle={{ color: '#6366F1' }}
                    />
                    <Line type="monotone" dataKey="wpm" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: '#172033', stroke: '#6366F1', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Weakness Chart */}
          {weaknessData.length > 0 && (
            <div className="rounded-xl border border-border-color bg-surface p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-medium text-text-main">Weakness Overview</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weaknessData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" vertical={false} />
                    <XAxis dataKey="key" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: '#1f1f2e' }}
                      contentStyle={{ backgroundColor: '#172033', border: 'none', borderRadius: '8px', color: '#F8FAFC' }}
                      itemStyle={{ color: '#EF4444' }}
                    />
                    <Bar dataKey="Error Rate %" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state for new users */}
      {displayStats.testsTaken === 0 && (
        <div className="rounded-2xl border border-dashed border-border-color bg-surface/50 p-12 text-center">
          <Keyboard className="mx-auto h-12 w-12 text-text-secondary mb-4" />
          <h3 className="text-lg font-medium text-text-main mb-2">No tests yet</h3>
          <p className="text-text-secondary mb-6">Take your first typing test to see your dashboard come alive.</p>
          <Link
            to="/typing"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-white hover:bg-primary-hover transition-colors"
          >
            Start Typing Test
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

