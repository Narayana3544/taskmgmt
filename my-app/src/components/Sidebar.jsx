import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Folder,
  Layers,
  CheckSquare,
  Bug,
  Clock,
  Calendar,
  Settings,
  LogOut,
  User,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

const Sidebar = ({ collapsed }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.role === 'ADMIN' || user?.roles?.some(r => r.name === 'ADMIN');

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Layers, label: 'Kanban Board', path: '/home' },
    { icon: Folder, label: 'Projects', path: '/project' },
    { icon: Layers, label: 'Sprints', path: '/manage-sprints' },
    { icon: CheckSquare, label: 'My Tasks', path: '/my-stories' },
    { icon: Bug, label: 'Bugs', path: '/task' }, // Temporary link to tasks for bugs
    { icon: Clock, label: 'Timesheets', path: '/time-sheets' },
  ];

  if (isAdmin) {
    navItems.push({ icon: ShieldAlert, label: 'Roles & Perms', path: '/admin/roles' });
    navItems.push({ icon: User, label: 'Users', path: '/admin/users' });
  }

  const handleLogout = () => {
    navigate('/logout');
  };

  return (
    <motion.div
      className={twMerge(
        "fixed left-0 top-0 h-screen bg-glass-bg-dark backdrop-blur-heavy border-r border-glass-border-medium z-50 flex flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center border-b border-glass-border-medium">
        <div className="flex items-center gap-2 font-bold text-xl text-white">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white">TM</span>
          </div>
          {!collapsed && <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">TaskFlow</span>}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => twMerge(
              "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
              isActive
                ? "bg-glass-accent-primary/20 text-white shadow-lg shadow-indigo-500/10 border border-glass-accent-primary/30"
                : "text-glass-text-secondary hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon size={20} className={twMerge("min-w-[20px] transition-colors", collapsed ? "mx-auto" : "")} />
            {!collapsed && <span className="font-medium">{item.label}</span>}

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </NavLink>
        ))}
      </nav>

      {/* User Profile / Logout */}
      <div className="p-4 border-t border-glass-border-medium bg-black/20">
        <div className={twMerge("flex items-center gap-3", collapsed ? "justify-center" : "")}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg">
            {user?.first_name?.[0] || 'U'}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-glass-text-muted truncate">{user?.email}</p>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-white/10 text-glass-text-muted hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;