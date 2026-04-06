import React, { useState, useEffect } from 'react';
import api from '../../api';

const SprintOverview = ({ sprintId }) => {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const res = await api.get(`/api/sprints/${sprintId}/overview`);
                setOverview(res.data?.data);
            } catch (err) {
                console.error('Failed to fetch sprint overview:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOverview();
    }, [sprintId]);

    if (loading) return <div className="stat-card" style={{ padding: 16 }}>Loading advanced metrics...</div>;
    if (!overview) return null;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginTop: 16 }}>
            <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-card-value" style={{ fontSize: 22 }}>{overview.totalItems}</div>
                <div className="stat-card-label">Total Items</div>
            </div>
            <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--color-success)' }}>{overview.completedItems}</div>
                <div className="stat-card-label">Completed</div>
            </div>
            <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--color-info)' }}>{overview.pendingItems}</div>
                <div className="stat-card-label">Pending</div>
            </div>
            <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--color-danger)' }}>{overview.blockedItems}</div>
                <div className="stat-card-label">Blocked</div>
            </div>
            <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--color-warning)' }}>{overview.spilloverItems}</div>
                <div className="stat-card-label">Spillover</div>
            </div>
        </div>
    );
};

export default SprintOverview;
