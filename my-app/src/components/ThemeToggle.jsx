import React from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ collapsed }) => {
    const [isDark, setIsDark] = React.useState(
        () => localStorage.getItem('theme') === 'dark'
    );

    React.useEffect(() => {
        const theme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [isDark]);

    // Initialize on mount
    React.useEffect(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    return (
        <button
            className="sidebar-nav-item theme-toggle-btn"
            onClick={() => setIsDark(!isDark)}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
    );
};

export default ThemeToggle;
