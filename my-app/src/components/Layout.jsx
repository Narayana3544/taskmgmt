import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Bell } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const Layout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-gradient-dark">
            {/* Background Mesh Gradients */}
            <div className="fixed inset-0 z-0 bg-gradient-mesh opacity-60 pointer-events-none" />

            {/* Sidebar */}
            <Sidebar collapsed={collapsed} />

            {/* Main Content */}
            <div
                className={twMerge(
                    "relative z-10 flex-1 flex flex-col transition-all duration-300 min-h-screen",
                    collapsed ? "ml-20" : "ml-64"
                )}
            >
                {/* Topbar */}
                <div className="h-16 flex items-center justify-between px-6 sticky top-0 z-40 backdrop-blur-md bg-glass-bg-dark/30 border-b border-glass-border-medium/50">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/80 transition-colors"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 rounded-full hover:bg-white/10 text-white/80 transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-black" />
                        </button>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
