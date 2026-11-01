import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, Trash2, Edit2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

import api from '../api';
import projectsApi from '../api/projectsApi';
import workItemsApi from '../api/workItemsApi';
import Layout from '../components/Layout';
import { getUser } from '../utils/user';
import { showToast } from '../utils/toast';

const getCategoryColor = (category) => {
    switch (category) {
        case 'DONE': return '#059669';
        case 'IN_PROGRESS': return '#D97706';
        case 'TODO': default: return '#3B82F6';
    }
};

const KanbanBoard = () => {
    const navigate = useNavigate();
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draggedItem, setDraggedItem] = useState(null);

    const currentUser = getUser();
    const currentUserId = Number(currentUser.userId || currentUser.id);
    const userRole = (currentUser.roleCode || currentUser.role || '').toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(() => {
        const saved = localStorage.getItem('selectedProjectId');
        return saved ? Number(saved) : null;
    });
    const [columns, setColumns] = useState([]);
    const [columnsLoading, setColumnsLoading] = useState(false);
    const [activeSprint, setActiveSprint] = useState(null);
    const [sprintLoading, setSprintLoading] = useState(false);
    const [myWorkOnly, setMyWorkOnly] = useState(false);

    // Column Modal State
    const [showColModal, setShowColModal] = useState(false);
    const [editingCol, setEditingCol] = useState(null);
    const [colForm, setColForm] = useState({ name: '', statusCategory: 'TODO', wipLimit: '', isDefault: false });
    const [savingCol, setSavingCol] = useState(false);

    // Delete Column Migration Modal State
    const [deleteModalCol, setDeleteModalCol] = useState(null);
    const [targetMigrateId, setTargetMigrateId] = useState('');
    const [deletingCol, setDeletingCol] = useState(false);

    // Reopen Modal State
    const [reopenModal, setReopenModal] = useState({ open: false, item: null, targetCol: null, reason: '' });

    // Load available projects
    const fetchProjects = useCallback(async () => {
        try {
            const res = await projectsApi.getMyProjects();
            const list = res.data?.data || [];
            setProjects(list);
            if (list.length > 0) {
                if (!selectedProjectId || !list.some(p => p.id === selectedProjectId)) {
                    setSelectedProjectId(list[0].id);
                    localStorage.setItem('selectedProjectId', list[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to load projects:', err);
        }
    }, [selectedProjectId]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Handle project selection change
    const handleProjectChange = (projId) => {
        setSelectedProjectId(projId);
        localStorage.setItem('selectedProjectId', projId);
    };

    // Load dynamic columns for selected project
    const fetchColumns = useCallback(async (projId) => {
        if (!projId) return;
        setColumnsLoading(true);
        try {
            const res = await projectsApi.getColumns(projId);
            setColumns(res.data?.data || []);
        } catch (err) {
            console.error('Failed to fetch columns:', err);
        } finally {
            setColumnsLoading(false);
        }
    }, []);

    // Load active sprint for selected project
    const fetchActiveSprint = useCallback(async (projId) => {
        if (!projId) return null;
        setSprintLoading(true);
        try {
            const res = await api.get('/api/sprints', { params: { projectId: projId, page: 0, size: 50 } });
            const sprints = res.data?.data?.content || [];
            const active = sprints.find(s => s.statusCode === 'ACTIVE');
            setActiveSprint(active || null);
            return active || null;
        } catch (err) {
            console.error('Failed to fetch sprints:', err);
            setActiveSprint(null);
            return null;
        } finally {
            setSprintLoading(false);
        }
    }, []);

    // Load work items for selected project and active sprint
    const fetchItems = useCallback(async (projId, activeSp) => {
        if (!projId) return;
        setLoading(true);
        try {
            if (activeSp && activeSp.id) {
                // Fetch directly from sprint items for guaranteed active sprint work items
                const res = await api.get(`/api/sprints/${activeSp.id}/items`);
                setAllItems(res.data?.data || []);
            } else {
                const res = await api.get('/api/work-items', { params: { projectId: projId, page: 0, size: 500 } });
                setAllItems(res.data?.data?.content || []);
            }
        } catch (err) {
            console.error('Failed to fetch work items:', err);
            try {
                const res = await api.get('/api/work-items', { params: { projectId: projId, page: 0, size: 500 } });
                setAllItems(res.data?.data?.content || []);
            } catch (e) {
                setAllItems([]);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            fetchColumns(selectedProjectId);
            fetchActiveSprint(selectedProjectId).then(active => {
                fetchItems(selectedProjectId, active);
            });
        }
    }, [selectedProjectId, fetchColumns, fetchActiveSprint, fetchItems]);

    // Only ACTIVE sprint items appear on the board (closed sprints never remain)
    const filteredItems = allItems.filter(item => {
        if (!activeSprint || item.sprintId !== activeSprint.id) return false;
        if (myWorkOnly) {
            return item.assigneeId === currentUser.id || item.ownerId === currentUser.id;
        }
        return true;
    });

    const getItemsForColumn = (col) => {
        return filteredItems.filter(item => {
            if (item.boardColumnId) {
                return item.boardColumnId === col.id;
            }
            // Fallback matching if column ID not yet set
            if (col.isDefault && (!item.boardColumnCategory || item.boardColumnCategory === 'TODO')) {
                return item.statusCode === 'OPEN' || item.statusCode === 'BACKLOG';
            }
            if (col.statusCategory === 'DONE') return item.statusCode === 'DONE';
            if (col.statusCategory === 'IN_PROGRESS') return item.statusCode === 'IN_PROGRESS' || item.statusCode === 'IN_REVIEW';
            return item.statusCode === 'OPEN' || item.statusCode === 'BACKLOG';
        });
    };

    // Drag-and-Drop handlers
    const handleDragStart = (e, item) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, targetCol) => {
        e.preventDefault();
        if (!draggedItem) return;
        if (draggedItem.boardColumnId === targetCol.id) {
            setDraggedItem(null);
            return;
        }

        // Check WIP limit
        if (targetCol.wipLimit && targetCol.wipLimit > 0) {
            const currentCount = getItemsForColumn(targetCol).length;
            if (currentCount >= targetCol.wipLimit) {
                showToast.error(`WIP limit of ${targetCol.wipLimit} reached for '${targetCol.name}'`);
                setDraggedItem(null);
                return;
            }
        }

        const sourceCol = columns.find(c => c.id === draggedItem.boardColumnId);
        if (draggedItem.sprintStatusCode === 'CLOSED') {
            showToast.error('Cannot move tasks belonging to a CLOSED sprint');
            setDraggedItem(null);
            return;
        }
        const sourceCategory = sourceCol ? sourceCol.statusCategory : draggedItem.boardColumnCategory;
        const targetCategory = targetCol.statusCategory;

        const isOwner = Number(draggedItem.ownerId) === currentUserId;
        const isAssignee = Number(draggedItem.assigneeId) === currentUserId;

        // RULE: Authorization checks - only current assignee can move forward/backward, owner closes to DONE
        if (!isAdmin) {
            if (targetCategory === 'DONE') {
                if (!isOwner) {
                    showToast.error('Only the Owner can mark a work item as DONE');
                    setDraggedItem(null);
                    return;
                }
            } else if (sourceCategory === 'DONE' && targetCategory !== 'DONE') {
                if (!isAssignee && !isOwner) {
                    showToast.error('Only the current assignee or owner can reopen this task');
                    setDraggedItem(null);
                    return;
                }
            } else {
                if (!isAssignee) {
                    if (!draggedItem.assigneeId) {
                        showToast.error('This task is unassigned. Only the assigned user can move it.');
                    } else {
                        showToast.error(`Only the current assignee (${draggedItem.assigneeName || 'assigned user'}) can move this task forward or backward`);
                    }
                    setDraggedItem(null);
                    return;
                }
            }
        }

        // RULE: Cannot jump directly from TODO to DONE
        if (sourceCategory === 'TODO' && targetCategory === 'DONE') {
            showToast.error('Tasks cannot move directly from Todo to Done. Please move to In Progress first.');
            setDraggedItem(null);
            return;
        }

        // RULE: Moving out of DONE requires a mandatory Reopen Reason
        if (sourceCategory === 'DONE' && targetCategory !== 'DONE') {
            setReopenModal({ open: true, item: draggedItem, targetCol, reason: '' });
            setDraggedItem(null);
            return;
        }

        // Optimistic UI update
        const updatedTargetCategory = targetCol.statusCategory;
        const mappedStatusCode = updatedTargetCategory === 'DONE' ? 'DONE' : (updatedTargetCategory === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'OPEN');

        setAllItems(prev => prev.map(item =>
            item.id === draggedItem.id
                ? { ...item, boardColumnId: targetCol.id, boardColumnName: targetCol.name, boardColumnCategory: updatedTargetCategory, statusCode: mappedStatusCode }
                : item
        ));

        try {
            await workItemsApi.updateColumn(draggedItem.id, targetCol.id);
            showToast.success(`Moved to ${targetCol.name}`);
            fetchItems(selectedProjectId, activeSprint);
            fetchColumns(selectedProjectId);
        } catch (err) {
            showToast.error(err.response?.data?.message || 'Failed to update column');
            fetchItems(selectedProjectId, activeSprint);
        } finally {
            setDraggedItem(null);
        }
    };

    const handleConfirmReopen = async (e) => {
        e.preventDefault();
        if (!reopenModal.reason || !reopenModal.reason.trim()) {
            showToast.error('Please provide a reason for reopening this task');
            return;
        }
        const { item, targetCol, reason } = reopenModal;
        try {
            await workItemsApi.updateColumn(item.id, targetCol.id, reason.trim());
            showToast.success(`Reopened and moved to ${targetCol.name}`);
            setReopenModal({ open: false, item: null, targetCol: null, reason: '' });
            fetchItems(selectedProjectId, activeSprint);
            fetchColumns(selectedProjectId);
        } catch (err) {
            showToast.error(err.response?.data?.message || 'Failed to reopen task');
        }
    };

    // Column Management Handlers
    const openCreateColumn = () => {
        setEditingCol(null);
        setColForm({ name: '', statusCategory: 'TODO', wipLimit: '', isDefault: false });
        setShowColModal(true);
    };

    const openEditColumn = (col) => {
        setEditingCol(col);
        setColForm({
            name: col.name,
            statusCategory: col.statusCategory,
            wipLimit: col.wipLimit ? String(col.wipLimit) : '',
            isDefault: Boolean(col.isDefault),
        });
        setShowColModal(true);
    };

    const handleSaveColumn = async (e) => {
        e.preventDefault();
        if (!selectedProjectId) return;
        setSavingCol(true);
        try {
            const payload = {
                name: colForm.name.trim(),
                statusCategory: colForm.statusCategory,
                wipLimit: colForm.wipLimit ? Number(colForm.wipLimit) : null,
                isDefault: colForm.isDefault,
            };

            if (editingCol) {
                await projectsApi.updateColumn(selectedProjectId, editingCol.id, payload);
                showToast.success('Column updated');
            } else {
                await projectsApi.createColumn(selectedProjectId, payload);
                showToast.success('Column created');
            }
            setShowColModal(false);
            fetchColumns(selectedProjectId);
            fetchItems(selectedProjectId);
        } catch (err) {
            showToast.error(err.response?.data?.message || 'Failed to save column');
        } finally {
            setSavingCol(false);
        }
    };

    const confirmDeleteColumn = (col) => {
        setDeleteModalCol(col);
        const otherCols = columns.filter(c => c.id !== col.id);
        setTargetMigrateId(otherCols.length > 0 ? String(otherCols[0].id) : '');
    };

    const handleDeleteColumn = async () => {
        if (!selectedProjectId || !deleteModalCol) return;
        setDeletingCol(true);
        try {
            await projectsApi.deleteColumn(selectedProjectId, deleteModalCol.id, targetMigrateId ? Number(targetMigrateId) : null);
            showToast.success('Column deleted');
            setDeleteModalCol(null);
            fetchColumns(selectedProjectId);
            fetchItems(selectedProjectId);
        } catch (err) {
            showToast.error(err.response?.data?.message || 'Failed to delete column');
        } finally {
            setDeletingCol(false);
        }
    };

    const getPriorityColor = (code) => {
        switch (code) {
            case 'CRITICAL': return '#DC2626';
            case 'HIGH': return '#D97706';
            case 'MEDIUM': return '#3B82F6';
            case 'LOW': return '#059669';
            default: return '#9CA3AF';
        }
    };

    const totalItems = filteredItems.length;
    const doneItems = filteredItems.filter(item => (item.boardColumnCategory || item.statusCode) === 'DONE').length;
    const progressPercent = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100);

    return (
        <Layout title="Kanban Board">
            {/* Top Bar: Project Switcher & Controls */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflowX: 'auto', maxWidth: '75%' }}>
                    {projects.map(p => {
                        const isSelected = selectedProjectId === p.id;
                        const openCount = isSelected
                            ? filteredItems.filter(i => (i.boardColumnCategory || i.statusCode) !== 'DONE').length
                            : (p.openWorkItemCount != null ? p.openWorkItemCount : 0);
                        return (
                            <button
                                key={p.id}
                                onClick={() => handleProjectChange(p.id)}
                                className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <span>{p.name}</span>
                                <span
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        background: isSelected ? 'rgba(255, 255, 255, 0.28)' : 'var(--color-bg-alt, #e2e8f0)',
                                        color: isSelected ? '#ffffff' : 'var(--color-text-muted, #475569)'
                                    }}
                                    title={`${openCount} open items in this project`}
                                >
                                    {openCount} open
                                </span>
                            </button>
                        );
                    })}
                    {projects.length === 0 && !loading && (
                        <div style={{ color: 'var(--color-text-muted)' }}>No projects available.</div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                        className={`btn btn-sm ${myWorkOnly ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setMyWorkOnly(!myWorkOnly)}
                        title="Show only tasks assigned to or owned by me"
                    >
                        {myWorkOnly ? '✓ My Work' : 'All Work'}
                    </button>
                    <button
                        className="btn btn-sm btn-secondary"
                        onClick={openCreateColumn}
                        title="Add custom workflow column"
                    >
                        <Plus size={14} /> Add Column
                    </button>
                </div>
            </div>

            {/* Active Sprint Banner */}
            {selectedProjectId && (
                <div style={{ marginBottom: '16px', background: 'var(--color-card)', padding: '14px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                                    {activeSprint ? `Active Sprint: ${activeSprint.name}` : 'No Active Sprint'}
                                </h3>
                                {activeSprint && (
                                    <span className="badge badge-success" style={{ fontSize: '11px' }}>ACTIVE</span>
                                )}
                            </div>
                            {activeSprint && (
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                    {activeSprint.startDate} to {activeSprint.endDate} · Goal: {activeSprint.goal || 'None'}
                                </p>
                            )}
                        </div>
                        {activeSprint && totalItems > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '14px' }}>
                                        {totalItems - doneItems}
                                    </span> Active Items
                                </div>
                                <div style={{ textAlign: 'right', borderLeft: '1px solid var(--color-border)', paddingLeft: '16px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                                        Progress ({doneItems}/{totalItems})
                                    </span>
                                    <div style={{ fontSize: '12px', color: progressPercent === 100 ? 'var(--color-success)' : 'var(--color-primary)' }}>
                                        {progressPercent}% Completed
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Kanban Columns Swimlanes */}
            {!activeSprint && !sprintLoading && selectedProjectId ? (
                <div style={{ padding: '50px 20px', textAlign: 'center', background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
                    <AlertCircle size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ color: 'var(--color-text)', margin: 0 }}>No Active Sprint</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '8px' }}>
                        Only items from the ACTIVE sprint appear on the Kanban board. Start a planned sprint or check the Sprints tab.
                    </p>
                    <button className="btn btn-primary" style={{ marginTop: '14px' }} onClick={() => navigate('/sprints')}>
                        Go to Sprints
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 250px)', overflowX: 'auto', paddingBottom: '10px' }}>
                    {columns.map((col) => {
                        const colItems = getItemsForColumn(col);
                        const isWipExceeded = col.wipLimit && col.wipLimit > 0 && colItems.length > col.wipLimit;
                        const categoryColor = getCategoryColor(col.statusCategory);

                        return (
                            <div
                                key={col.id}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, col)}
                                style={{
                                    flex: '0 0 280px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    background: 'var(--color-bg-alt)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: isWipExceeded ? '2px solid var(--color-danger)' : '1px solid var(--color-border)',
                                }}
                            >
                                {/* Column Header */}
                                <div style={{
                                    padding: '12px 14px',
                                    borderBottom: `2px solid ${categoryColor}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: categoryColor, flexShrink: 0 }} />
                                        <span style={{ fontWeight: 600, fontSize: '13px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={col.name}>
                                            {col.name}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: isWipExceeded ? 'var(--color-danger)' : 'var(--color-text-muted)',
                                            background: 'var(--color-card)',
                                            padding: '2px 6px',
                                            borderRadius: '8px',
                                            border: isWipExceeded ? '1px solid var(--color-danger)' : 'none',
                                        }}>
                                            {colItems.length}{col.wipLimit ? ` / ${col.wipLimit}` : ''}
                                        </span>
                                        <button
                                            onClick={() => openEditColumn(col)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-text-muted)' }}
                                            title="Edit column"
                                        >
                                            <Edit2 size={13} />
                                        </button>
                                        <button
                                            onClick={() => confirmDeleteColumn(col)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-danger)' }}
                                            title="Delete column"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* Column Cards Container */}
                                <div style={{ flex: 1, padding: '8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {loading || sprintLoading ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                                            Loading...
                                        </div>
                                    ) : colItems.length === 0 ? (
                                        <div style={{
                                            padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)',
                                            fontSize: '12px', border: '2px dashed var(--color-border)', borderRadius: '8px',
                                            marginTop: '4px',
                                        }}>
                                            No items
                                        </div>
                                    ) : (
                                        colItems.map((item) => {
                                            const isItemAssignee = Number(item.assigneeId) === currentUserId;
                                            const isItemOwner = Number(item.ownerId) === currentUserId;
                                            const canDrag = isAdmin || isItemAssignee || isItemOwner;
                                            const cannotMoveReason = !item.assigneeId
                                                ? 'This task is unassigned. Only the assigned user can move it.'
                                                : `Only the current assignee (${item.assigneeName}) can move this task forward or backward`;

                                            return (
                                            <div
                                                key={item.id}
                                                draggable={canDrag}
                                                onDragStart={(e) => {
                                                    if (!canDrag) {
                                                        e.preventDefault();
                                                        showToast.error(cannotMoveReason);
                                                        return;
                                                    }
                                                    handleDragStart(e, item);
                                                }}
                                                onClick={() => navigate(`/work-items/${item.id}`)}
                                                title={!canDrag ? cannotMoveReason : undefined}
                                                style={{
                                                    background: 'var(--color-card)',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius-md)',
                                                    padding: '12px',
                                                    cursor: canDrag ? 'grab' : 'default',
                                                    boxShadow: 'var(--shadow-sm)',
                                                    borderLeft: `3px solid ${getPriorityColor(item.priorityCode)}`,
                                                    opacity: draggedItem?.id === item.id ? 0.5 : col.statusCategory === 'DONE' ? 0.85 : 1,
                                                    transition: 'box-shadow 0.15s ease',
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                                        {item.projectCode} · #{item.id}
                                                    </span>
                                                    <span className={`badge badge-${item.priorityCode === 'CRITICAL' || item.priorityCode === 'HIGH' ? 'danger' : 'default'}`}
                                                        style={{ fontSize: '10px', padding: '1px 6px' }}>
                                                        {item.priorityName || 'Medium'}
                                                    </span>
                                                </div>

                                                <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '8px', lineHeight: 1.4 }}>
                                                    {item.title}
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {item.assigneeName ? (
                                                            <>
                                                                <div style={{
                                                                    width: 20, height: 20, borderRadius: '50%',
                                                                    background: 'var(--color-secondary)', color: 'white',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: '10px', fontWeight: 600,
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
                                                            borderRadius: '4px', fontWeight: 600, fontSize: '10px',
                                                        }}>
                                                            {item.storyPoints} SP
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add / Edit Column Modal */}
            {showColModal && (
                <div className="modal-backdrop">
                    <div className="modal" style={{ maxWidth: '440px' }}>
                        <div className="modal-header">
                            <h3>{editingCol ? 'Edit Column' : 'Add Column'}</h3>
                            <button className="btn-close" onClick={() => setShowColModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSaveColumn}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Column Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Code Review"
                                        value={colForm.name}
                                        onChange={(e) => setColForm({ ...colForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status Category *</label>
                                    <select
                                        className="form-input"
                                        value={colForm.statusCategory}
                                        onChange={(e) => setColForm({ ...colForm, statusCategory: e.target.value })}
                                    >
                                        <option value="TODO">To Do (Initial / Pending)</option>
                                        <option value="IN_PROGRESS">In Progress (Active Work)</option>
                                        <option value="DONE">Done (Completed)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">WIP Limit (optional)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="form-input"
                                        placeholder="Leave empty for unlimited"
                                        value={colForm.wipLimit}
                                        onChange={(e) => setColForm({ ...colForm, wipLimit: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="checkbox"
                                        id="isDefaultCol"
                                        checked={colForm.isDefault}
                                        onChange={(e) => setColForm({ ...colForm, isDefault: e.target.checked })}
                                    />
                                    <label htmlFor="isDefaultCol" style={{ fontSize: '13px', cursor: 'pointer' }}>
                                        Default column for newly created work items
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowColModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={savingCol}>
                                    {savingCol ? 'Saving...' : 'Save Column'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reopen Task Modal */}
            {reopenModal.open && (
                <div className="modal-backdrop" onClick={() => setReopenModal({ open: false, item: null, targetCol: null, reason: '' })}>
                    <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0 }}>Reopen Work Item</h3>
                            <button className="btn-close" onClick={() => setReopenModal({ open: false, item: null, targetCol: null, reason: '' })}>✕</button>
                        </div>
                        <form onSubmit={handleConfirmReopen}>
                            <div className="modal-body">
                                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                                    You are reopening <strong>#{reopenModal.item?.id} {reopenModal.item?.title}</strong> and moving it to <strong>{reopenModal.targetCol?.name}</strong>.
                                </p>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 600 }}>
                                        Reopen Reason <span style={{ color: 'var(--color-danger)' }}>*</span>
                                    </label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Explain why this task is being reopened (e.g. QA bug found, requirements changed)..."
                                        rows={3}
                                        value={reopenModal.reason}
                                        onChange={e => setReopenModal({ ...reopenModal, reason: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setReopenModal({ open: false, item: null, targetCol: null, reason: '' })}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Confirm Reopen
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Column with Item Migration Modal */}
            {deleteModalCol && (
                <div className="modal-backdrop">
                    <div className="modal" style={{ maxWidth: '440px' }}>
                        <div className="modal-header">
                            <h3 style={{ color: 'var(--color-danger)' }}>Delete Column</h3>
                            <button className="btn-close" onClick={() => setDeleteModalCol(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: '14px', marginBottom: '14px' }}>
                                Are you sure you want to delete column <strong>{deleteModalCol.name}</strong>?
                            </p>
                            {deleteModalCol.itemCount > 0 ? (
                                <div style={{ background: 'var(--color-bg-alt)', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid var(--color-border)' }}>
                                    <div style={{ color: 'var(--color-danger)', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
                                        ⚠️ This column contains {deleteModalCol.itemCount} items.
                                    </div>
                                    <label className="form-label" style={{ fontSize: '12px' }}>Select target column to migrate items to *</label>
                                    <select
                                        className="form-input"
                                        value={targetMigrateId}
                                        onChange={(e) => setTargetMigrateId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Select Target Column --</option>
                                        {columns.filter(c => c.id !== deleteModalCol.id).map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.statusCategory})</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                    This column is currently empty.
                                </p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setDeleteModalCol(null)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                disabled={deletingCol || (deleteModalCol.itemCount > 0 && !targetMigrateId)}
                                onClick={handleDeleteColumn}
                            >
                                {deletingCol ? 'Deleting...' : 'Delete Column'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default KanbanBoard;
