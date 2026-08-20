import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Trophy, Zap, Target, Flame, Calendar, Award, Star, StarHalf, Brain } from 'lucide-react';
import achievementService from '../services/achievementService';
import Skeleton from '../components/skeleton/Skeleton';

const iconMap = {
  'SPEED': Zap,
  'ACCURACY': Target,
  'STREAK': Flame,
  'IQ': Brain,
  'DEFAULT': Trophy,
};

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const data = await achievementService.getAchievements();
        if (data.achievements) {
          setAchievements(data.achievements);
        }
      } catch (err) {
        console.warn('Achievements not available:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  const stats = user?.stats || {
    averageWpm: 0,
    bestWpm: 0,
    averageAccuracy: 0,
    typingIQ: 0,
    totalTests: 0,
    currentStreak: 0,
  };
  
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Unknown';

  const getAchievementIcon = (key) => {
    if (!key) return Trophy;
    const k = key.toUpperCase();
    if (k.includes('SPEED') || k.includes('WPM')) return Zap;
    if (k.includes('ACCURACY') || k.includes('PERFECT')) return Target;
    if (k.includes('STREAK') || k.includes('DAY')) return Flame;
    if (k.includes('IQ') || k.includes('BRAIN')) return Award;
    return Trophy;
  };

  const getAchievementColor = (index) => {
    const colors = [
      { color: 'text-warning', bg: 'bg-warning/10' },
      { color: 'text-primary', bg: 'bg-primary/10' },
      { color: 'text-error', bg: 'bg-error/10' },
      { color: 'text-success', bg: 'bg-success/10' },
      { color: 'text-purple-400', bg: 'bg-purple-400/10' },
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col items-center justify-center space-y-4 rounded-3xl bg-surface p-10 text-center shadow-sm border border-border-color">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 text-3xl font-bold text-primary uppercase">
          {user?.name?.[0] || 'U'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-main capitalize">{user?.name || 'User'}</h1>
          <p className="text-text-secondary">{user?.email || 'user@example.com'}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-sm font-medium text-text-main border border-border-color">
          <Award className="h-4 w-4 text-primary" />
          {stats.typingIQ >= 130 ? 'Master Typist' : stats.typingIQ >= 100 ? 'Advanced Typist' : 'Typing Enthusiast'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border-color bg-surface p-6 text-center">
          <p className="text-sm font-medium text-text-secondary mb-2">Typing IQ</p>
          <p className="text-3xl font-bold text-primary">{stats.typingIQ || 'N/A'}</p>
        </div>
        <div className="rounded-2xl border border-border-color bg-surface p-6 text-center">
          <p className="text-sm font-medium text-text-secondary mb-2">Best WPM</p>
          <p className="text-3xl font-bold text-text-main">{stats.bestWpm}</p>
        </div>
        <div className="rounded-2xl border border-border-color bg-surface p-6 text-center">
          <p className="text-sm font-medium text-text-secondary mb-2">Accuracy</p>
          <p className="text-3xl font-bold text-text-main">{Math.round(stats.averageAccuracy * 100) / 100}%</p>
        </div>
        <div className="rounded-2xl border border-border-color bg-surface p-6 text-center">
          <p className="text-sm font-medium text-text-secondary mb-2">Tests Taken</p>
          <p className="text-3xl font-bold text-text-main">{stats.totalTests}</p>
        </div>
        <div className="rounded-2xl border border-border-color bg-surface p-6 text-center">
          <p className="text-sm font-medium text-text-secondary mb-2">Current Streak</p>
          <p className="text-3xl font-bold flex items-center justify-center gap-1 text-text-main">
            {stats.currentStreak} <Flame className="h-5 w-5 text-error" />
          </p>
        </div>
        <div className="rounded-2xl border border-border-color bg-surface p-6 text-center">
          <p className="text-sm font-medium text-text-secondary mb-2">Joined</p>
          <p className="text-xl font-bold flex flex-col items-center justify-center text-text-main mt-2">
             {joinDate}
          </p>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-text-main">Achievements</h2>
        {loading ? (
           <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
             {[...Array(4)].map((_, idx) => (
               <div key={idx} className="flex flex-col items-center justify-center rounded-2xl border border-border-color bg-surface p-6 text-center">
                 <Skeleton className="mb-3 h-14 w-14" rounded="rounded-full" />
                 <Skeleton className="h-4 w-20" rounded="rounded-md" />
               </div>
             ))}
           </div>
        ) : achievements.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {achievements.map((ach, idx) => {
              const IconComp = getAchievementIcon(ach.key);
              const theme = getAchievementColor(idx);
              return (
                <div key={ach._id || idx} className="flex flex-col items-center justify-center rounded-2xl border border-border-color bg-surface p-6 text-center transition-all hover:bg-card/50">
                  <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full ${theme.bg} ${theme.color}`}>
                    <IconComp className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-medium text-text-main">{ach.label}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border-color bg-surface/50 p-12 text-center">
            <Trophy className="mx-auto h-12 w-12 text-text-secondary mb-4" />
            <h3 className="text-lg font-medium text-text-main mb-2">No achievements yet</h3>
            <p className="text-text-secondary">Keep practicing to unlock your first achievement.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Profile;

