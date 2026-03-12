import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Menu } from 'lucide-react';

/**
 * Header — top bar shown across all authenticated pages.
 * Shows search, notification bell, and user info.
 */
const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/work-items?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="app-header">
      <div className="app-header-left">
        <button className="app-header-menu-btn" onClick={onToggleSidebar} title="Toggle sidebar">
          <Menu size={18} />
        </button>
        <form onSubmit={handleSearch} className="app-header-search">
          <Search size={14} className="app-header-search-icon" />
          <input
            type="text"
            placeholder="Search work items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="app-header-search-input"
          />
        </form>
      </div>

      <div className="app-header-right">
        <button className="app-header-icon-btn" onClick={() => navigate('/notifications')} title="Notifications">
          <Bell size={18} />
        </button>
        <div className="app-header-user" onClick={() => navigate('/profile')} title="Profile">
          <div className="app-header-avatar">
            {(user.fullName || 'U')[0]}
          </div>
          <div className="app-header-user-info">
            <span className="app-header-user-name">{user.fullName || 'User'}</span>
            <span className="app-header-user-role">{user.roleName || 'Employee'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
