import React, { useState, useEffect, useContext } from 'react';
import { Trophy, Medal, Award, Flame } from 'lucide-react';
import leaderboardService from '../services/leaderboardService';
import { AuthContext } from '../context/AuthContext';

const Leaderboard = () => {
  const { user } = useContext(AuthContext);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Weekly');
  const tabs = ['Weekly', 'Monthly', 'All Time'];

  const periodMap = { 'Weekly': 'weekly', 'Monthly': 'monthly', 'All Time': 'allTime' };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await leaderboardService.getLeaderboard({ period: periodMap[activeTab] });
        const entries = (data.leaderboard || data.data || data || []).map((entry, index) => ({
          rank: entry.rank || index + 1,
          user: entry.name || entry.user || 'Anonymous',
          wpm: entry.bestWpm || entry.wpm || entry.averageWpm || 0,
          accuracy: entry.accuracy || entry.averageAccuracy || 0,
          typingIq: entry.typingIq || entry.typingIQ || 0,
          isCurrentUser: entry.isCurrentUser || (user && entry.userId === user._id),
        }));
        setLeaderboardData(entries);
      } catch (err) {
        console.warn('Leaderboard unavailable:', err.message);
        setLeaderboardData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [activeTab, user]);

  const renderRankIcon = (rank) => {
    switch(rank) {
      case 1: return <Trophy className="h-6 w-6 text-warning" />;
      case 2: return <Medal className="h-6 w-6 text-gray-300" />;
      case 3: return <Award className="h-6 w-6 text-amber-700" />;
      default: return <span className="font-mono text-text-secondary px-2">{rank}</span>;
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      
      {/* Header */}
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <h1 className="text-3xl font-bold text-text-main">Global Leaderboard</h1>
        <p className="text-text-secondary max-w-lg">See how your typing speed and accuracy compare to the TypeMind AI community.</p>
        
        {/* Tabs */}
        <div className="mt-4 flex rounded-lg bg-card p-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-6 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-main'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : leaderboardData.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-color bg-surface/50 p-12 text-center">
          <Trophy className="mx-auto h-12 w-12 text-text-secondary mb-4" />
          <h3 className="text-lg font-medium text-text-main mb-2">No rankings yet</h3>
          <p className="text-text-secondary">Complete typing tests to appear on the leaderboard.</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podiums */}
          {leaderboardData.length >= 3 && (
            <div className="flex items-end justify-center gap-4 py-8">
              {/* Rank 2 */}
              <div className="flex flex-col items-center">
                <div className="mb-2 text-center">
                  <p className="font-medium text-text-main">{leaderboardData[1].user}</p>
                  <p className="text-sm text-text-secondary">{leaderboardData[1].wpm} WPM</p>
                </div>
                <div className="flex h-32 w-24 items-center justify-center rounded-t-lg bg-card border-t-4 border-gray-300 shadow-lg">
                  <Medal className="h-8 w-8 text-gray-300" />
                </div>
              </div>
              
              {/* Rank 1 */}
              <div className="flex flex-col items-center">
                <div className="mb-2 text-center">
                  <Trophy className="mx-auto mb-1 h-6 w-6 text-warning" />
                  <p className="font-bold text-text-main">{leaderboardData[0].user}</p>
                  <p className="text-sm text-warning font-medium">{leaderboardData[0].wpm} WPM</p>
                </div>
                <div className="flex h-40 w-28 items-center justify-center rounded-t-lg bg-surface border-t-4 border-warning shadow-xl shadow-warning/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-warning/5"></div>
                  <Trophy className="h-10 w-10 text-warning" />
                </div>
              </div>
              
              {/* Rank 3 */}
              <div className="flex flex-col items-center">
                <div className="mb-2 text-center">
                  <p className="font-medium text-text-main">{leaderboardData[2].user}</p>
                  <p className="text-sm text-text-secondary">{leaderboardData[2].wpm} WPM</p>
                </div>
                <div className="flex h-24 w-24 items-center justify-center rounded-t-lg bg-card border-t-4 border-amber-700 shadow-lg">
                  <Award className="h-8 w-8 text-amber-700" />
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="overflow-hidden rounded-2xl border border-border-color bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-card/50 text-text-secondary">
                  <tr>
                    <th className="px-6 py-4 font-medium">Rank</th>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium text-right">WPM</th>
                    <th className="px-6 py-4 font-medium text-right">Accuracy</th>
                    <th className="px-6 py-4 font-medium text-right">Typing IQ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-card">
                  {leaderboardData.map((entry) => (
                    <tr 
                      key={entry.user} 
                      className={`transition-colors hover:bg-card/30 ${entry.isCurrentUser ? 'bg-primary/10 hover:bg-primary/20' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {renderRankIcon(entry.rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${entry.isCurrentUser ? 'text-primary' : 'text-text-main'}`}>
                            {entry.user}
                          </span>
                          {entry.isCurrentUser && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">You</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-text-main">{entry.wpm}</td>
                      <td className="px-6 py-4 text-right font-mono text-text-secondary">{entry.accuracy}%</td>
                      <td className="px-6 py-4 text-right font-mono text-text-secondary">{entry.typingIq}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;

