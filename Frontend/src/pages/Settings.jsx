import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import userService from '../services/userService';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, fetchUser } = useContext(AuthContext);

  const [name, setName] = useState(user?.name || '');
  const [leaderboardVisible, setLeaderboardVisible] = useState(
    user?.preferences?.leaderboardVisible ?? true
  );
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if user data loads later
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setLeaderboardVisible(user.preferences?.leaderboardVisible ?? true);
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) {
      return toast.error('Name cannot be empty');
    }
    
    setIsSaving(true);
    try {
      await userService.updateProfile({
        name,
        preferences: {
          ...user?.preferences,
          leaderboardVisible,
        },
      });
      await fetchUser();
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-main">Settings</h1>
        <p className="mt-2 text-text-secondary">Manage your account and preferences.</p>
      </div>

      <div className="space-y-6">
        



        {/* Account */}
        <section className="rounded-2xl border border-border-color bg-surface p-6">
          <h2 className="text-lg font-bold text-text-main mb-4">Account</h2>
          <div className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border-color bg-bg px-4 py-2 text-text-main focus:border-primary focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
              <input 
                type="email" 
                defaultValue={user?.email || ''} 
                disabled
                className="w-full rounded-lg border border-border-color bg-bg/50 px-4 py-2 text-text-secondary cursor-not-allowed"
              />
            </div>

          </div>
        </section>
        
        {/* Privacy */}
        <section className="rounded-2xl border border-border-color bg-surface p-6">
          <h2 className="text-lg font-bold text-text-main mb-4">Privacy</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-main">Leaderboard Visibility</p>
                <p className="text-sm text-text-secondary">Show your profile on the global leaderboard.</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input 
                  type="checkbox" 
                  className="peer sr-only" 
                  checked={leaderboardVisible}
                  onChange={(e) => setLeaderboardVisible(e.target.checked)}
                />
                <div className="peer h-6 w-11 rounded-full bg-card after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50"></div>
              </label>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl bg-primary px-6 py-2.5 font-medium text-white hover:bg-primaryHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;

