import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Folder, Layers, FileText, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { GlassCard, StatWidget } from '../components/glass';
import { AnimatedPage, AnimatedList, AnimatedItem, staggerContainer, fadeUpItem } from '../utils/animations';
import '../styles/glass.css';
import './GlassDashboard.css';

/**
 * GlassDashboard - Premium glassmorphism dashboard with animated widgets
 */
const GlassDashboard = () => {
    const [counts, setCounts] = useState({ projects: 0, features: 0, stories: 0 });
    const [statusData, setStatusData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [projRes, featRes, storyRes] = await Promise.all([
                api.get('/projects', { withCredentials: true }),
                api.get('/features', { withCredentials: true }),
                api.get('/view-tasks', { withCredentials: true })
            ]);

            setCounts({
                projects: projRes.data.length,
                features: featRes.data.length,
                stories: storyRes.data.length
            });

            const statusMap = {};
            storyRes.data.forEach(s => {
                const status = s.status || 'Unknown';
                statusMap[status] = (statusMap[status] || 0) + 1;
            });

            const statusArray = Object.keys(statusMap).map(key => ({
                name: key,
                value: statusMap[key]
            }));

            setStatusData(statusArray);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = [
        '#6366f1', // Indigo
        '#22c55e', // Green  
        '#f59e0b', // Amber
        '#ef4444', // Red
        '#06b6d4', // Cyan
        '#8b5cf6', // Violet
    ];

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-tooltip">
                    <p className="tooltip-label">{label || payload[0].name}</p>
                    <p className="tooltip-value">{payload[0].value}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <AnimatedPage>
            <div className="glass-dashboard">
                {/* Header */}
                <motion.header
                    className="dashboard-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div>
                        <h1 className="dashboard-title">Dashboard</h1>
                        <p className="dashboard-subtitle">Welcome back! Here's your project overview.</p>
                    </div>
                </motion.header>

                {/* Stats Row */}
                <motion.div
                    className="stats-grid"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                >
                    <motion.div variants={fadeUpItem}>
                        <StatWidget
                            title="Projects"
                            value={counts.projects}
                            icon={Folder}
                            variant="primary"
                            trend="up"
                            trendValue="+12%"
                        />
                    </motion.div>
                    <motion.div variants={fadeUpItem}>
                        <StatWidget
                            title="Features"
                            value={counts.features}
                            icon={Layers}
                            variant="success"
                            trend="up"
                            trendValue="+8%"
                        />
                    </motion.div>
                    <motion.div variants={fadeUpItem}>
                        <StatWidget
                            title="Stories"
                            value={counts.stories}
                            icon={FileText}
                            variant="warning"
                        />
                    </motion.div>
                    <motion.div variants={fadeUpItem}>
                        <StatWidget
                            title="Completion"
                            value={`${Math.round((statusData.find(s => s.name === 'COMPLETED')?.value || 0) / (counts.stories || 1) * 100)}%`}
                            icon={CheckCircle}
                            variant="info"
                        />
                    </motion.div>
                </motion.div>

                {/* Charts Row */}
                <div className="charts-grid">
                    {/* Pie Chart */}
                    <GlassCard className="chart-card" hoverable={false}>
                        <GlassCard.Header
                            title="Story Status"
                            icon={TrendingUp}
                        />
                        <GlassCard.Body>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        innerRadius={50}
                                        paddingAngle={4}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        labelLine={false}
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Legend */}
                            <div className="chart-legend">
                                {statusData.map((entry, index) => (
                                    <div key={entry.name} className="legend-item">
                                        <span
                                            className="legend-dot"
                                            style={{ background: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="legend-label">{entry.name}</span>
                                        <span className="legend-value">{entry.value}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard.Body>
                    </GlassCard>

                    {/* Bar Chart */}
                    <GlassCard className="chart-card" hoverable={false}>
                        <GlassCard.Header
                            title="Entities Overview"
                            icon={Layers}
                        />
                        <GlassCard.Body>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart
                                    data={[{ name: 'Overview', ...counts }]}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                    barGap={8}
                                >
                                    <defs>
                                        <linearGradient id="projectsGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                                        </linearGradient>
                                        <linearGradient id="featuresGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.6} />
                                        </linearGradient>
                                        <linearGradient id="storiesGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)' }} hide />
                                    <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }}
                                        formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.7)' }}>{value}</span>}
                                    />
                                    <Bar dataKey="projects" fill="url(#projectsGrad)" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="features" fill="url(#featuresGrad)" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="stories" fill="url(#storiesGrad)" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </GlassCard.Body>
                    </GlassCard>
                </div>
            </div>
        </AnimatedPage>
    );
};

export default GlassDashboard;
