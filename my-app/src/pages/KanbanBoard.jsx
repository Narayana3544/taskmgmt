import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api';
import Layout from '../components/Layout';

const KANBAN_COLUMNS = [
    { code: 'BACKLOG', label: 'Backlog', color: '#9CA3AF' },
    { code: 'OPEN', label: 'Open', color: '#3B82F6' },
    { code: 'IN_PROGRESS', label: 'In Progress', color: '#D97706' },
    { code: 'DONE', label: 'Done', color: '#059669' },
];

const KanbanBoard = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draggedItem, setDraggedItem] = useState(null);

    const fetchItems = useCallback(async () => {
        try {
            const res = await api.get('/api/work-items/my', { params: { page: 0, size: 200 } });
            setItems(res.data?.data?.content || []);
        } catch (err) {
            console.error('Failed to fetch kanban items:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const getItemsByStatus = (statusCode) => {
        return items.filter(item => (item.statusCode || 'BACKLOG') === statusCode);
    };

    const handleDragStart = (e, item) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, targetStatusCode) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.statusCode === targetStatusCode) return;

        // Optimistic update
        setItems(prev => prev.map(item =>
            item.id === draggedItem.id ? { ...item, statusCode: targetStatusCode } : item
        ));

        try {
            await api.patch(`/api/work-items/${draggedItem.id}/status`, { statusCode: targetStatusCode });
            fetchItems(); // Reload from server to get accurate state
        } catch (err) {
            alert(err.response?.data?.message || 'Cannot update status');
            fetchItems(); // Revert on failure
        }

        setDraggedItem(null);
    };

    const getPriorityColor = (code) => {
        if (!code) return '#9CA3AF';
        switch (code) {
            case 'CRITICAL': return '#DC2626';
            case 'HIGH': return '#D97706';
            case 'MEDIUM': return '#3B82F6';
            case 'LOW': return '#059669';
            default: return '#9CA3AF';
        }
    };

    const getTypeEmoji = (code) => {
        switch (code) {
            case 'BUG': return '🐛';
            case 'TEST_CASE': return '🧪';
            default: return '✅';
        }
    };

    const totalItems = items.length;
    const doneItems = items.filter(item => (item.statusCode || 'BACKLOG') === 'DONE').length;
    const progressPercent = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100);

    return (
        <Layout title="Kanban Board">
            {totalItems > 0 && (
                <div style={{ marginBottom: '20px', background: 'var(--color-card)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                        <span style={{ color: 'var(--color-text)' }}>Active Items Progress ({doneItems}/{totalItems})</span>
                        <span style={{ color: progressPercent === 100 ? 'var(--color-success)' : 'var(--color-primary)' }}>{progressPercent}% Completed</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--color-bg-alt)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                            width: `${progressPercent}%`, 
                            height: '100%', 
                            background: progressPercent === 100 ? 'var(--color-success)' : 'var(--color-primary)', 
                            transition: 'width 0.5s ease-in-out',
                            borderRadius: '4px'
                        }} />
                    </div>
                </div>
            )}
            <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 180px)', overflow: 'auto' }}>
                {KANBAN_COLUMNS.map((col) => {
                    const colItems = getItemsByStatus(col.code);
                    return (
                        <div
                            key={col.code}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.code)}
                            style={{
                                flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column',
                                background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)'
                            }}
                        >
                            {/* Column Header */}
                            <div style={{
                                padding: '12px 16px', borderBottom: '2px solid ' + col.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{col.label}</span>
                                </div>
                                <span style={{
                                    fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)',
                                    background: 'var(--color-card)', padding: '2px 8px', borderRadius: '10px'
                                }}>
                                    {colItems.length}
                                </span>
                            </div>

                            {/* Column Body */}
                            <div style={{
                                flex: 1, padding: '8px', overflow: 'auto',
                                display: 'flex', flexDirection: 'column', gap: '8px'
                            }}>
                                {loading ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                                        Loading...
                                    </div>
                                ) : colItems.length === 0 ? (
                                    <div style={{
                                        padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)',
                                        fontSize: '13px', border: '2px dashed var(--color-border)', borderRadius: '8px',
                                        marginTop: '4px'
                                    }}>
                                        No items
                                    </div>
                                ) : (
                                    colItems.map((item) => (
                                        <div
                                            key={item.id}
                                            draggable={col.code !== 'DONE'}
                                            onDragStart={(e) => handleDragStart(e, item)}
                                            onClick={() => navigate(`/work-items/${item.id}`)}
                                            style={{
                                                background: 'var(--color-card)', border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-md)', padding: '12px', cursor: 'pointer',
                                                boxShadow: 'var(--shadow-sm)',
                                                borderLeft: `3px solid ${getPriorityColor(item.priorityCode)}`,
                                                opacity: draggedItem?.id === item.id ? 0.5 : 1,
                                                transition: 'box-shadow 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                                        >
                                            {/* Type + Project */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                                    {getTypeEmoji(item.typeCode)} {item.projectCode}
                                                </span>
                                                <span className={`badge badge-${item.priorityCode === 'CRITICAL' || item.priorityCode === 'HIGH' ? 'danger' : 'default'}`}
                                                    style={{ fontSize: '10px', padding: '1px 6px' }}>
                                                    {item.priorityName || 'Medium'}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '8px', lineHeight: 1.4 }}>
                                                {item.title}
                                            </div>

                                            {/* Footer */}
                                            <div style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                fontSize: '11px', color: 'var(--color-text-muted)'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {item.assigneeName ? (
                                                        <>
                                                            <div style={{
                                                                width: 20, height: 20, borderRadius: '50%',
                                                                background: 'var(--color-secondary)', color: 'white',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: '10px', fontWeight: 600
                                                            }}>
                                                                {item.assigneeName[0]}
                                                            </div>
                                                            <span>{item.assigneeName.split(' ')[0]}</span>
                                                        </>
                                                    ) : (
                                                        <span style={{ fontStyle: 'italic' }}>Unassigned</span>
                                                    )}
                                                </div>
                                                {item.storyPoints && (
                                                    <span style={{
                                                        background: 'var(--color-bg-alt)', padding: '1px 6px',
                                                        borderRadius: '4px', fontWeight: 600, fontSize: '10px'
                                                    }}>
                                                        {item.storyPoints} SP
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Layout>
    );
};

export default KanbanBoard;
