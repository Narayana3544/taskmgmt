import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ChevronRight, GripVertical, Check, User as UserIcon } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

const SimpleAssigneeSelect = ({ item, projectMembers, onAssign }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const currentAssignee = projectMembers?.find(m => (m.userId || m.id) === item.assigneeId);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = async (memberId) => {
        setIsOpen(false);
        try {
            await api.patch(`/api/work-items/${item.id}/assign`, { assigneeId: memberId });
            onAssign(item.id, memberId);
        } catch (err) {
            alert('Failed to assign user');
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button 
                type="button"
                className="btn btn-secondary btn-sm" 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '4px 10px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                    background: currentAssignee ? 'var(--color-bg-alt)' : 'transparent',
                    border: '1px solid var(--color-border)'
                }}
            >
                {currentAssignee ? (
                    <>
                        <div style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: 'var(--color-secondary)', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 600
                        }}>
                            {(currentAssignee.fullName || currentAssignee.userName || 'U')[0]}
                        </div>
                        <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {currentAssignee.fullName || currentAssignee.userName}
                        </span>
                    </>
                ) : (
                    <>
                        <UserIcon size={14} color="var(--color-text-muted)" />
                        <span style={{ color: 'var(--color-text-muted)' }}>Unassigned</span>
                    </>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, zIndex: 50,
                    width: 200, maxHeight: 240, overflowY: 'auto',
                    background: 'var(--color-card)', border: '1px solid var(--color-border)',
                    borderRadius: 6, marginTop: 4, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                        Assign To
                    </div>
                    {/* Unassigned Option */}
                    <div
                        onClick={() => handleSelect(null)}
                        style={{
                            padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: !currentAssignee ? 'var(--color-bg-alt)' : 'transparent'
                        }}
                        onMouseEnter={(e) => !currentAssignee && (e.currentTarget.style.background = 'var(--color-hover)')}
                        onMouseLeave={(e) => !currentAssignee && (e.currentTarget.style.background = 'var(--color-bg-alt)')}
                    >
                        <UserIcon size={16} color="var(--color-text-muted)" />
                        <span style={{ color: 'var(--color-text-muted)' }}>Unassigned</span>
                        {!currentAssignee && <Check size={14} style={{ marginLeft: 'auto' }} color="var(--color-text)" />}
                    </div>

                    {/* Team Members */}
                    {projectMembers.map(m => {
                        const isSelected = currentAssignee && (currentAssignee.userId || currentAssignee.id) === (m.userId || m.id);
                        return (
                            <div
                                key={m.userId || m.id}
                                onClick={() => handleSelect(m.userId || m.id)}
                                style={{
                                    padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: isSelected ? 'var(--color-bg-alt)' : 'transparent'
                                }}
                            >
                                <div style={{
                                    width: 24, height: 24, borderRadius: '50%',
                                    background: 'var(--color-secondary)', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 600
                                }}>
                                    {(m.fullName || m.userName || 'U')[0]}
                                </div>
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {m.fullName || m.userName}
                                </span>
                                {isSelected && <Check size={14} color="var(--color-text)" />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const SprintPlanning = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [sprint, setSprint] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [backlogItems, setBacklogItems] = useState([]);
    const [sprintItems, setSprintItems] = useState([]);
    const [projectMembers, setProjectMembers] = useState([]);

    const [backlogPage, setBacklogPage] = useState(0);
    const [sprintPage, setSprintPage] = useState(0);
    const PAGE_SIZE = 10;

    useEffect(() => {
        const fetchSprintData = async () => {
            try {
                const spRes = await api.get(`/api/sprints/${id}`);
                const sprintData = spRes.data?.data;
                setSprint(sprintData);

                if (sprintData) {
                    const [backlogRes, sprintItemsRes, membersRes] = await Promise.all([
                        api.get('/api/work-items/backlog', { params: { projectId: sprintData.projectId } }),
                        api.get(`/api/sprints/${id}/items`).catch(() => ({ data: { data: [] } })),
                        api.get(`/api/projects/${sprintData.projectId}/members`).catch(() => ({ data: { data: [] } }))
                    ]);
                    setBacklogItems(backlogRes.data?.data || []);
                    setSprintItems(sprintItemsRes.data?.data || []);
                    setProjectMembers(membersRes.data?.data || []);
                }
            } catch (err) {
                console.error(err);
                alert('Error loading sprint details.');
            } finally {
                setLoading(false);
            }
        };
        fetchSprintData();
    }, [id]);

    const addItemToSprint = async (workItemId) => {
        try {
            await api.post(`/api/sprints/${id}/items/${workItemId}`);
            const item = backlogItems.find(i => i.id === workItemId);
            if (item) {
                setBacklogItems(prev => prev.filter(i => i.id !== workItemId));
                setSprintItems(prev => [...prev, item]);
            }
        } catch (err) { alert(err.response?.data?.message || 'Failed to add item'); }
    };

    const removeItemFromSprint = async (workItemId) => {
        try {
            await api.delete(`/api/sprints/${id}/items/${workItemId}`);
            const item = sprintItems.find(i => i.id === workItemId);
            if (item) {
                setSprintItems(prev => prev.filter(i => i.id !== workItemId));
                setBacklogItems(prev => [...prev, item]);
            }
        } catch (err) { alert(err.response?.data?.message || 'Failed to remove item'); }
    };

    const updateItemAssignee = (itemId, assigneeId) => {
        setSprintItems(prev => prev.map(item => item.id === itemId ? { ...item, assigneeId } : item));
        setBacklogItems(prev => prev.map(item => item.id === itemId ? { ...item, assigneeId } : item));
    };

    const backlogTotalPages = Math.max(1, Math.ceil(backlogItems.length / PAGE_SIZE));
    const sprintTotalPages = Math.max(1, Math.ceil(sprintItems.length / PAGE_SIZE));
    const safeBacklogPage = Math.min(backlogPage, backlogTotalPages - 1);
    const safeSprintPage = Math.min(sprintPage, sprintTotalPages - 1);

    const paginatedBacklog = backlogItems.slice(safeBacklogPage * PAGE_SIZE, (safeBacklogPage + 1) * PAGE_SIZE);
    const paginatedSprint = sprintItems.slice(safeSprintPage * PAGE_SIZE, (safeSprintPage + 1) * PAGE_SIZE);

    if (loading) return <Layout title="Loading..."><div className="empty-state"><p>Loading planning data...</p></div></Layout>;
    if (!sprint) return <Layout title="Not Found"><div className="empty-state"><h3>Sprint not found</h3></div></Layout>;

    return (
        <Layout title={`Plan: ${sprint.name}`}>
            <div style={{ maxWidth: 1200, margin: '0 auto', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: 16 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/sprints')}>
                        <ArrowLeft size={14} /> Back to Sprints
                    </button>
                </div>

                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="card-body" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div className="flex items-center gap-3">
                                <GripVertical size={20} color="var(--color-secondary)" />
                                <h1 style={{ fontSize: 20, margin: 0 }}>Planning: {sprint.name}</h1>
                                <StatusBadge code={sprint.statusCode} label={sprint.statusName} />
                            </div>
                            <p style={{ color: 'var(--color-text-secondary)', margin: '4px 0 0 32px', fontSize: 13 }}>
                                Goal: {sprint.goal}
                            </p>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'right' }}>
                            <div>{sprint.startDate || 'No start date'} → {sprint.endDate || 'No end date'}</div>
                            <div style={{ marginTop: 4 }}><strong>{sprintItems.length}</strong> items in Sprint</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, flex: 1, minHeight: 0 }}>
                    {/* Backlog Column */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="card-header" style={{ borderBottom: '1px solid var(--color-border)', padding: '16px 20px' }}>
                            <h3 style={{ margin: 0 }}>Backlog ({backlogItems.length})</h3>
                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>Unplanned work items</p>
                        </div>
                        <div className="card-body" style={{ flex: 1, overflowY: 'auto', padding: 20, background: 'var(--color-bg-alt)' }}>
                            {backlogItems.length === 0 ? (
                                <div className="empty-state" style={{ padding: '40px 0' }}>
                                    <p>Backlog is empty!</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {paginatedBacklog.map(item => (
                                        <div key={item.id} className="card hover-shadow" style={{ padding: 16 }}>
                                            <div className="flex justify-between items-start" style={{ marginBottom: 12 }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                                                    <div className="flex items-center gap-2">
                                                        <StatusBadge code={item.typeCode} label={item.typeName} />
                                                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>• SP: {item.storyPoints || '—'}</span>
                                                    </div>
                                                </div>
                                                <button className="btn btn-sm btn-primary" onClick={() => addItemToSprint(item.id)} style={{ padding: '6px 12px' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center' }}>Add <ChevronRight size={14} style={{ marginLeft: 4 }} /></span>
                                                </button>
                                            </div>
                                            <SimpleAssigneeSelect item={item} projectMembers={projectMembers} onAssign={updateItemAssignee} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Pagination footer */}
                        {backlogTotalPages > 1 && (
                            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-card)', borderBottomLeftRadius: 'inherit', borderBottomRightRadius: 'inherit' }}>
                                <button className="btn btn-sm btn-secondary" disabled={safeBacklogPage === 0} onClick={() => setBacklogPage(p => p - 1)}>Prev</button>
                                <span style={{ fontSize: 12, fontWeight: 500 }}>Page {safeBacklogPage + 1} of {backlogTotalPages}</span>
                                <button className="btn btn-sm btn-secondary" disabled={safeBacklogPage >= backlogTotalPages - 1} onClick={() => setBacklogPage(p => p + 1)}>Next</button>
                            </div>
                        )}
                    </div>

                    {/* Sprint Column */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--color-secondary)' }}>
                        <div className="card-header" style={{ borderBottom: '1px solid var(--color-border)', padding: '16px 20px', background: 'var(--color-secondary)', color: 'white', borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}>
                            <h3 style={{ margin: 0, color: 'white' }}>Current Sprint ({sprintItems.length})</h3>
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: 0 }}>Planned work items</p>
                        </div>
                        <div className="card-body" style={{ flex: 1, overflowY: 'auto', padding: 20, background: 'var(--color-bg-alt)' }}>
                            {sprintItems.length === 0 ? (
                                <div className="empty-state" style={{ padding: '40px 0' }}>
                                    <p>Sprint is empty.<br/>Add items from the backlog.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {paginatedSprint.map(item => (
                                        <div key={item.id} className="card hover-shadow" style={{ padding: 16 }}>
                                            <div className="flex justify-between items-start" style={{ marginBottom: 12 }}>
                                                <button className="btn btn-sm btn-danger btn-outline" onClick={() => removeItemFromSprint(item.id)} style={{ padding: '6px 10px', height: '32px' }}>
                                                    <ArrowLeft size={14} /> 
                                                </button>
                                                <div style={{ flex: 1, marginLeft: 12 }}>
                                                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                                                    <div className="flex items-center gap-2">
                                                        <StatusBadge code={item.typeCode} label={item.typeName} />
                                                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>• SP: {item.storyPoints || '—'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ paddingLeft: 42 }}>
                                                <SimpleAssigneeSelect item={item} projectMembers={projectMembers} onAssign={updateItemAssignee} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Pagination footer */}
                        {sprintTotalPages > 1 && (
                            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-card)', borderBottomLeftRadius: 'inherit', borderBottomRightRadius: 'inherit' }}>
                                <button className="btn btn-sm btn-secondary" disabled={safeSprintPage === 0} onClick={() => setSprintPage(p => p - 1)}>Prev</button>
                                <span style={{ fontSize: 12, fontWeight: 500 }}>Page {safeSprintPage + 1} of {sprintTotalPages}</span>
                                <button className="btn btn-sm btn-secondary" disabled={safeSprintPage >= sprintTotalPages - 1} onClick={() => setSprintPage(p => p + 1)}>Next</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SprintPlanning;
