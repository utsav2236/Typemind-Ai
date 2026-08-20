import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, Target, Brain } from 'lucide-react';
import analyticsService from '../services/analyticsService';
import AnalyticsSkeleton from '../components/skeleton/AnalyticsSkeleton';

const StatCard = ({ title, value, subtitle, icon: Icon }) => (
  <div className="rounded-xl border border-border-color bg-surface p-6 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <p className="text-2xl font-bold text-text-main">{value}</p>
      </div>
    </div>
    {subtitle && <p className="mt-4 text-sm text-text-secondary">{subtitle}</p>}
  </div>
);

const Analytics = () => {
  const [timeFilter, setTimeFilter] = useState('30D');
  const filters = ['7D', '30D', '90D', 'All'];

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [weakKeys, setWeakKeys] = useState([]);
  const [weakFingers, setWeakFingers] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // Fetch overview
        const overviewRes = await analyticsService.getOverview();
        if (overviewRes.overview) {
          setOverview(overviewRes.overview);
        } else if (overviewRes.averageWpm !== undefined) {
           setOverview(overviewRes); // Fallback if shape is different
        }

        // Fetch progress
        const limitMap = { '7D': 7, '30D': 30, '90D': 90, 'All': 1000 };
        const progressRes = await analyticsService.getProgress({ limit: limitMap[timeFilter] });
        if (progressRes.progress) {
          const formattedProgress = progressRes.progress.map((p, index) => {
             const date = new Date(p.date);
             return {
               date: `${date.getMonth() + 1}/${date.getDate()}`,
               wpm: p.rollingAvgWpm || p.wpm,
               accuracy: p.rollingAvgAcc || p.accuracy
             };
          });
          setProgressData(formattedProgress);
        }

        // Fetch weaknesses
        const weaknessRes = await analyticsService.getWeaknesses();
        if (weaknessRes.weakKeys) {
          setWeakKeys(weaknessRes.weakKeys.slice(0, 5));
        }
        if (weaknessRes.weakFingers) {
          setWeakFingers(weaknessRes.weakFingers.slice(0, 5));
        }
      } catch (err) {
        console.warn('Analytics data unavailable:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeFilter]);

  if (loading && !overview) {
    return <AnalyticsSkeleton />;
  }

  const defaultStats = { averageWpm: 0, bestWpm: 0, averageAccuracy: 0, typingIQ: 0 };
  const displayStats = overview || defaultStats;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main">Your Progress</h1>
          <p className="mt-2 text-text-secondary flex items-center gap-2">
            {displayStats.totalTests > 0 ? (
              <>
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-text-main font-medium">{displayStats.totalTests} tests taken</span> so far.
              </>
            ) : (
              'Complete your first typing test to see your progress.'
            )}
          </p>
        </div>
        
        {/* Time Filters */}
        <div className="flex rounded-lg bg-card p-1">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                timeFilter === filter
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-main'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Average WPM" value={displayStats.averageWpm} icon={Activity} />
        <StatCard title="Best WPM" value={displayStats.bestWpm} icon={TrendingUp} />
        <StatCard title="Accuracy" value={`${displayStats.averageAccuracy}%`} icon={Target} />
        <StatCard title="Typing IQ" value={displayStats.typingIQ || 'N/A'} icon={Brain} />
      </div>

      {/* WPM Trend Chart */}
      {progressData.length > 0 ? (
        <div className="rounded-2xl border border-border-color bg-surface p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-medium text-text-main">Performance History</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" vertical={false} />
                <XAxis dataKey="date" stroke="#94A3B8" tick={{ fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#172033', border: 'none', borderRadius: '8px', color: '#F8FAFC' }}
                  itemStyle={{ color: '#6366F1' }}
                />
                <Area type="monotone" dataKey="wpm" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorWpm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border-color bg-surface/50 p-12 text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-text-secondary mb-4" />
          <h3 className="text-lg font-medium text-text-main mb-2">No progress data yet</h3>
          <p className="text-text-secondary">Take a few more typing tests to start seeing your performance trends.</p>
        </div>
      )}

      {/* Weakness Analytics */}
      {(weakKeys.length > 0 || weakFingers.length > 0) && (
        <div>
          <h2 className="text-2xl font-bold text-text-main mb-6">Your Weaknesses</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            
            {/* Character Weaknesses */}
            {weakKeys.length > 0 && (
              <div className="rounded-2xl border border-border-color bg-surface p-6 shadow-sm">
                <h3 className="mb-6 text-lg font-medium text-text-main">Characters</h3>
                <div className="space-y-4">
                  {weakKeys.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-mono text-text-main bg-card px-2 rounded uppercase">{item.key || item.char}</span>
                        <span className="text-text-secondary">{Math.round(item.accuracy)}%</span>
                      </div>
                      <div className="w-full bg-card rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full ${item.accuracy < 70 ? 'bg-error' : item.accuracy < 85 ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: `${Math.max(10, item.accuracy)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Finger Weaknesses */}
            {weakFingers.length > 0 && (
              <div className="rounded-2xl border border-border-color bg-surface p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="mb-6 text-lg font-medium text-text-main">Fingers</h3>
                  <div className="space-y-4">
                    {weakFingers.map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-text-main font-medium capitalize">{item.finger}</span>
                          <span className="text-text-secondary">{Math.round(item.accuracy)}%</span>
                        </div>
                        <div className="w-full bg-card rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full ${item.accuracy < 70 ? 'bg-error' : item.accuracy < 85 ? 'bg-warning' : 'bg-success'}`}
                            style={{ width: `${Math.max(10, item.accuracy)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-8">
                  <Link to="/practice" className="block text-center w-full rounded-xl bg-primary/10 text-primary py-3 font-medium hover:bg-primary/20 transition-colors">
                    Practice Weaknesses
                  </Link>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Analytics;

