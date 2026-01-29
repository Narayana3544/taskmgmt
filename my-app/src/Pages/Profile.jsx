import React, { useEffect, useState } from 'react';
import api from '../api';
import GlassCard from '../components/glass/GlassCard';
import { User, Mail, Shield, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/user/profile', { withCredentials: true })
      .then(response => {
        setUser(response.data);
      })
      .catch(error => {
        console.error('Error fetching user profile:', error);
        setError('Failed to load profile');
      });
  }, []);

  if (error) return <div className="text-red-400 p-6">{error}</div>;
  if (!user) return <div className="text-white p-6">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <User size={24} className="text-indigo-400" />
        </div>
        User Profile
      </h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <GlassCard hoverable={false}>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar Section */}
            <div className="flex-shrink-0 flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white/10 shadow-xl">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20">
                Active Status
              </span>
            </div>

            {/* Details Section */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-glass-text-secondary uppercase tracking-wider">Full Name</label>
                <div className="flex items-center gap-3 text-white text-lg font-medium p-3 rounded-xl bg-white/5 border border-white/5">
                  <User size={18} className="text-glass-accent-primary" />
                  {user.first_name} {user.last_name}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-glass-text-secondary uppercase tracking-wider">Preferred Name</label>
                <div className="flex items-center gap-3 text-white text-lg font-medium p-3 rounded-xl bg-white/5 border border-white/5">
                  <UserCheck size={18} className="text-glass-accent-secondary" />
                  {user.preffered_name || '-'}
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-glass-text-secondary uppercase tracking-wider">Email Address</label>
                <div className="flex items-center gap-3 text-white text-lg font-medium p-3 rounded-xl bg-white/5 border border-white/5">
                  <Mail size={18} className="text-blue-400" />
                  {user.email}
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-glass-text-secondary uppercase tracking-wider">Role & Permissions</label>
                <div className="flex items-center gap-3 text-white text-lg font-medium p-3 rounded-xl bg-white/5 border border-white/5">
                  <Shield size={18} className="text-amber-400" />
                  {user.role?.description || 'User'}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Profile;
