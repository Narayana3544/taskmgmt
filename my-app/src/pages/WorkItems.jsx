import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Plus, Edit2, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Filter, X, Upload, FileText, UserX, Clock, AlertCircle, RefreshCw
} from 'lucide-react';
import api from '../api';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { showToast } from '../utils/toast';
import { getUser, isAdminOrManager as checkAdminOrManager } from '../utils/user';

const FILTER_STORAGE_KEY = 'workitems_filters_v2';

const loadSavedFilters = () => {
    try {
        const saved = sessionStorage.getItem(FILTER_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return {};
};

const WorkItems = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // URL Param Initializers
    const urlProjectId = searchParams.get('projectId') || '';
    const urlStatusId = searchParams.get('statusId') || '';
    const urlStatusCode = searchParams.get('statusCode') || '';
    const urlAllocated = searchParams.get('allocated'); // 'true' | 'false' | null
    const urlSprintId = searchParams.get('sprintId') || '';
    const urlPriorityId = searchParams.get('priorityId') || '';
    const urlTypeId = searchParams.get('typeId') || '';
    const urlMyWork = searchParams.get('my') === 'true';

    const user = getUser();
    const isAdminOrManager = checkAdminOrManager();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({
        title: '', description: '', projectId: urlProjectId || '',
        typeId: '', priorityId: '', ownerId: '', assigneeId: '',
        storyPoints: '', dueDate: ''
    });
    const [saving, setSaving] = useState(false);
    const [projects, setProjects] = useState([]);
    const [masterData, setMasterData] = useState({ types: [], statuses: [], priorities: [] });
    const [projectMembers, setProjectMembers] = useState([]);
    const [formSprints, setFormSprints] = useState([]);

    // Attachment for new work item
    const [createFile, setCreateFile] = useState(null);
    const [createFilePreview, setCreateFilePreview] = useState(null);

    // Pagination
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Filters
    const saved = loadSavedFilters();
    const [projectFilter, setProjectFilter] = useState(urlProjectId || saved.projectFilter || '');
    const [sprintFilter, setSprintFilter] = useState(urlSprintId || saved.sprintFilter || '');
    const [statusFilter, setStatusFilter] = useState(urlStatusId || saved.statusFilter || '');
    const [statusCodeFilter, setStatusCodeFilter] = useState(urlStatusCode || saved.statusCodeFilter || '');
    const [priorityFilter, setPriorityFilter] = useState(urlPriorityId || saved.priorityFilter || '');
    const [typeFilter, setTypeFilter] = useState(urlTypeId || saved.typeFilter || '');
    const [allocatedFilter, setAllocatedFilter] = useState(
        urlAllocated === 'false' ? 'non_allocated' : (urlAllocated === 'true' ? 'allocated' : (saved.allocatedFilter || ''))
    );
    const [myWorkOnly, setMyWorkOnly] = useState(urlMyWork || saved.myWorkOnly || false);
    const [showFilters, setShowFilters] = useState(true);
    const [sprints, setSprints] = useState([]);

    // Save filters to sessionStorage whenever they change
    useEffect(() => {
        sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
            projectFilter,
            sprintFilter,
            statusFilter,
            statusCodeFilter,
            priorityFilter,
            typeFilter,
            allocatedFilter,
            myWorkOnly
        }));
    }, [projectFilter, sprintFilter, statusFilter, statusCodeFilter, priorityFilter, typeFilter, allocatedFilter, myWorkOnly]);

    // Fetch sprints whenever project changes
    useEffect(() => {
        const projId = projectFilter;
        if (!projId) {
            setSprints([]);
            return;
        }
        const fetchSprints = async () => {
            try {
                const res = await api.get('/api/sprints', { params: { projectId: projId, page: 0, size: 100 } });
                setSprints(res.data?.data?.content || []);
            } catch (err) {
                setSprints([]);
            }
        };
        fetchSprints();
    }, [projectFilter]);

    // Search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(0);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch Work Items with ALL filters and pagination
    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                size: pageSize
            };

            if (debouncedSearch) params.search = debouncedSearch;
            if (projectFilter) params.projectId = projectFilter;
            if (sprintFilter) params.sprintId = sprintFilter;
            if (statusFilter) params.statusId = statusFilter;
            if (statusCodeFilter) params.statusCode = statusCodeFilter;
            if (priorityFilter) params.priorityId = priorityFilter;
            if (typeFilter) params.typeId = typeFilter;

            if (allocatedFilter === 'non_allocated') {
                params.allocated = false;
            } else if (allocatedFilter === 'allocated') {
                params.allocated = true;
            }

            if (myWorkOnly) {
                params.myItems = true;
            }

            const res = await api.get('/api/work-items', { params });
            const pageData = res.data?.data;
            const content = pageData?.content || [];

            setItems(content);
            setTotalPages(pageData?.totalPages || 1);
            setTotalElements(pageData?.totalElements !== undefined ? pageData.totalElements : content.length);
        } catch (err) {
            console.error('Failed to fetch work items', err);
            setItems([]);
            setTotalPages(1);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, debouncedSearch, projectFilter, sprintFilter, statusFilter, statusCodeFilter, priorityFilter, typeFilter, allocatedFilter, myWorkOnly]);

    const fetchMasterData = useCallback(async () => {
        try {
            const [typesRes, statusRes, prioRes, projRes] = await Promise.all([
                api.get('/api/master-data/values/by-code', { params: { typeCode: 'WORK_ITEM_TYPE' } }),
                api.get('/api/master-data/values/by-code', { params: { typeCode: 'WORK_ITEM_STATUS' } }),
                api.get('/api/master-data/values/by-code', { params: { typeCode: 'PRIORITY' } }),
                api.get('/api/projects', { params: { orgId: user.organizationId, page: 0, size: 200 } })
            ]);
            setMasterData({
                types: typesRes.data?.data || [],
                statuses: statusRes.data?.data || [],
                priorities: prioRes.data?.data || []
            });
            setProjects(projRes.data?.data?.content || []);
        } catch (err) {
            console.error('Failed to fetch master data', err);
        }
    }, [user.organizationId]);

    useEffect(() => {
        fetchMasterData();
    }, [fetchMasterData]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (projectFilter) count++;
        if (sprintFilter) count++;
        if (statusFilter || statusCodeFilter) count++;
        if (priorityFilter) count++;
        if (typeFilter) count++;
        if (allocatedFilter) count++;
        if (myWorkOnly) count++;
        return count;
    }, [projectFilter, sprintFilter, statusFilter, statusCodeFilter, priorityFilter, typeFilter, allocatedFilter, myWorkOnly]);

    const clearFilters = () => {
        setProjectFilter('');
        setSprintFilter('');
        setStatusFilter('');
        setStatusCodeFilter('');
        setPriorityFilter('');
        setTypeFilter('');
        setAllocatedFilter('');
        setMyWorkOnly(false);
        setSearchTerm('');
        setDebouncedSearch('');
        setPage(0);
        // Clear URL search params
        setSearchParams({});
    };

    const openCreate = () => {
        setEditItem(null);
        setForm({
            title: '', description: '', projectId: projectFilter || urlProjectId || '',
            sprintId: sprintFilter || '', typeId: '', priorityId: '', ownerId: '',
            assigneeId: '', storyPoints: '', dueDate: ''
        });
        setCreateFile(null);
        if (createFilePreview) URL.revokeObjectURL(createFilePreview);
        setCreateFilePreview(null);
        setShowModal(true);
        if (projectFilter || urlProjectId) fetchProjectMembers(projectFilter || urlProjectId);
    };

    const openEdit = (item) => {
        setEditItem(item);
        setForm({
            title: item.title,
            description: item.description || '',
            projectId: item.projectId,
            sprintId: item.sprintId || '',
            typeId: item.typeId || '',
            priorityId: item.priorityId || '',
            ownerId: item.ownerId || '',
            assigneeId: item.assigneeId || '',
            storyPoints: item.storyPoints || '',
            dueDate: item.dueDate || '',
            statusId: item.statusId || ''
        });
        setShowModal(true);
        if (item.projectId) fetchProjectMembers(item.projectId);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                projectId: parseInt(form.projectId),
                typeId: form.typeId ? parseInt(form.typeId) : null,
                priorityId: form.priorityId ? parseInt(form.priorityId) : null,
                statusId: form.statusId ? parseInt(form.statusId) : null,
                sprintId: form.sprintId ? parseInt(form.sprintId) : null,
                ownerId: form.ownerId ? parseInt(form.ownerId) : null,
                assigneeId: form.assigneeId ? parseInt(form.assigneeId) : null,
                storyPoints: form.storyPoints ? parseInt(form.storyPoints) : null
            };
            if (!payload.dueDate) delete payload.dueDate;
            delete payload.organizationId;

            if (editItem) {
                await api.put(`/api/work-items/${editItem.id}`, payload);
                showToast.success('Work item updated');
            } else {
                const createRes = await api.post('/api/work-items', payload);
                const newItemId = createRes.data?.data?.id;

                if (createFile && newItemId) {
                    try {
                        const formData = new FormData();
                        formData.append('file', createFile);
                        formData.append('folder', `workitems/${newItemId}`);
                        const uploadRes = await api.post('/api/files/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        const fileUrl = uploadRes.data.data.url;
                        await api.put(`/api/work-items/${newItemId}`, { ...payload, attachments: [fileUrl] });
                    } catch (uploadErr) {
                        console.error('Attachment upload failed:', uploadErr);
                        showToast.error('Work item created but attachment upload failed');
                    }
                }
                showToast.success('Work item created');
            }
            setCreateFile(null);
            if (createFilePreview) URL.revokeObjectURL(createFilePreview);
            setCreateFilePreview(null);
            setShowModal(false);
            fetchItems();
        } catch (err) {
            showToast.error(err.response?.data?.message || 'Operation failed');
        } finally {
            setSaving(false);
        }
    };

    const fetchProjectMembers = async (projId) => {
        if (!projId) {
            setProjectMembers([]);
            setFormSprints([]);
            return;
        }
        try {
            const [membersRes, sprintsRes] = await Promise.all([
                api.get(`/api/projects/${projId}/members`),
                api.get('/api/sprints', { params: { projectId: projId, page: 0, size: 100 } })
            ]);
            setProjectMembers(membersRes.data?.data || []);
            setFormSprints(sprintsRes.data?.data?.content || []);
        } catch (err) {
            console.error('Failed to fetch project details', err);
            setProjectMembers([]);
            setFormSprints([]);
        }
    };

    // Calculate pagination range
    const startItem = totalElements === 0 ? 0 : page * pageSize + 1;
    const endItem = Math.min((page + 1) * pageSize, totalElements);

    return (
        <Layout title="Work Items">
            {/* Page Header */}
            <div className="page-header" style={{ marginBottom: 16 }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        Work Items
                        {totalElements > 0 && (
                            <span style={{
                                fontSize: 13,
                                fontWeight: 500,
                                background: 'var(--color-bg-alt)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-secondary)',
                                padding: '2px 8px',
                                borderRadius: 12
                            }}>
                                {totalElements}
                            </span>
                        )}
                    </h1>
                    <p className="page-header-subtitle">
                        {projectFilter ? (
                            <span>
                                Filtered by project: <strong>{projects.find(p => String(p.id) === String(projectFilter))?.name || `Project #${projectFilter}`}</strong>
                                {' · '}
                                <button
                                    onClick={() => navigate(`/projects/${projectFilter}/dashboard`)}
                                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                                >
                                    Open Project Dashboard →
                                </button>
                            </span>
                        ) : myWorkOnly ? 'Showing work items assigned to or owned by you' : 'Viewing all accessible work items across projects'}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="search-bar" style={{ position: 'relative', width: 240 }}>
                        <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search title, desc..."
                            style={{ paddingLeft: 32, height: 36, fontSize: 13 }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                style={{ position: 'absolute', right: 8, top: 9, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <button
                        className={`btn ${myWorkOnly ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => { setMyWorkOnly(!myWorkOnly); setPage(0); }}
                        title="Toggle: Tasks assigned to or owned by you"
                        style={{ height: 36 }}
                    >
                        My Work
                    </button>

                    <button
                        className={`btn ${allocatedFilter === 'non_allocated' ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => {
                            setAllocatedFilter(allocatedFilter === 'non_allocated' ? '' : 'non_allocated');
                            setPage(0);
                        }}
                        title="Toggle tasks that have no assignee"
                        style={{ height: 36, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <UserX size={15} /> Non Allocated
                    </button>

                    <button
                        className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ position: 'relative', height: 36, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <Filter size={15} /> Filters
                        {activeFilterCount > 0 && (
                            <span style={{
                                position: 'absolute', top: -6, right: -6,
                                background: 'var(--color-danger)', color: 'white',
                                width: 18, height: 18, borderRadius: '50%',
                                fontSize: 11, fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>{activeFilterCount}</span>
                        )}
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={fetchItems}
                        title="Refresh list"
                        style={{ height: 36, padding: '0 10px' }}
                    >
                        <RefreshCw size={14} />
                    </button>

                    {isAdminOrManager && (
                        <button className="btn btn-primary" onClick={openCreate} style={{ height: 36 }}>
                            <Plus size={16} /> New Item
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            {showFilters && (
                <div className="card" style={{ marginBottom: 16, padding: '14px 16px', background: 'var(--color-card)' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Filter size={14} /> Filters:
                        </span>

                        {/* Project Filter */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' }}>PROJECT</label>
                            <select
                                className="form-select"
                                style={{ width: 180, height: 34, fontSize: 13 }}
                                value={projectFilter}
                                onChange={e => {
                                    setProjectFilter(e.target.value);
                                    setSprintFilter('');
                                    setPage(0);
                                }}
                            >
                                <option value="">All Projects</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sprint Filter */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' }}>SPRINT</label>
                            <select
                                className="form-select"
                                style={{ width: 170, height: 34, fontSize: 13 }}
                                value={sprintFilter}
                                onChange={e => { setSprintFilter(e.target.value); setPage(0); }}
                                disabled={!projectFilter}
                            >
                                <option value="">All Sprints</option>
                                <option value="0">Backlog (No Sprint)</option>
                                {sprints.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.statusCode})</option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' }}>STATUS</label>
                            <select
                                className="form-select"
                                style={{ width: 160, height: 34, fontSize: 13 }}
                                value={statusFilter}
                                onChange={e => {
                                    setStatusFilter(e.target.value);
                                    setStatusCodeFilter('');
                                    setPage(0);
                                }}
                            >
                                <option value="">All Statuses</option>
                                {masterData.statuses.map(s => (
                                    <option key={s.id} value={s.id}>{s.displayName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' }}>PRIORITY</label>
                            <select
                                className="form-select"
                                style={{ width: 140, height: 34, fontSize: 13 }}
                                value={priorityFilter}
                                onChange={e => { setPriorityFilter(e.target.value); setPage(0); }}
                            >
                                <option value="">All Priorities</option>
                                {masterData.priorities.map(p => (
                                    <option key={p.id} value={p.id}>{p.displayName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Type Filter */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' }}>TYPE</label>
                            <select
                                className="form-select"
                                style={{ width: 140, height: 34, fontSize: 13 }}
                                value={typeFilter}
                                onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
                            >
                                <option value="">All Types</option>
                                {masterData.types.map(t => (
                                    <option key={t.id} value={t.id}>{t.displayName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Allocation Filter */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' }}>ALLOCATION</label>
                            <select
                                className="form-select"
                                style={{ width: 160, height: 34, fontSize: 13 }}
                                value={allocatedFilter}
                                onChange={e => { setAllocatedFilter(e.target.value); setPage(0); }}
                            >
                                <option value="">All Allocations</option>
                                <option value="non_allocated">⚠️ Non Allocated (Unassigned)</option>
                                <option value="allocated">Allocated Only</option>
                            </select>
                        </div>

                        {/* Clear All Button */}
                        {activeFilterCount > 0 && (
                            <div style={{ alignSelf: 'flex-end' }}>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={clearFilters}
                                    style={{ height: 34, display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                    <X size={14} /> Clear ({activeFilterCount})
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Quick Filter Badges Bar */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Quick Views:</span>
                <button
                    className={`btn btn-sm ${!allocatedFilter && !statusFilter && !statusCodeFilter && !myWorkOnly ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: 12, padding: '4px 10px', height: 28 }}
                    onClick={() => {
                        setAllocatedFilter('');
                        setStatusFilter('');
                        setStatusCodeFilter('');
                        setMyWorkOnly(false);
                        setPage(0);
                    }}
                >
                    All Items
                </button>

                <button
                    className={`btn btn-sm ${allocatedFilter === 'non_allocated' ? 'btn-danger' : 'btn-secondary'}`}
                    style={{ fontSize: 12, padding: '4px 10px', height: 28, display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => {
                        setAllocatedFilter(allocatedFilter === 'non_allocated' ? '' : 'non_allocated');
                        setPage(0);
                    }}
                >
                    <UserX size={12} /> Non Allocated
                </button>

                {masterData.statuses.map(s => {
                    const isSelected = String(statusFilter) === String(s.id) || statusCodeFilter.toUpperCase() === s.code.toUpperCase();
                    return (
                        <button
                            key={s.id}
                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ fontSize: 12, padding: '4px 10px', height: 28, whiteSpace: 'nowrap' }}
                            onClick={() => {
                                if (isSelected) {
                                    setStatusFilter('');
                                    setStatusCodeFilter('');
                                } else {
                                    setStatusFilter(s.id);
                                    setStatusCodeFilter('');
                                }
                                setPage(0);
                            }}
                        >
                            {s.displayName}
                        </button>
                    );
                })}
            </div>

            {/* Work Items Table */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="empty-state" style={{ padding: 40 }}>
                            <p>Loading work items...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="empty-state" style={{ padding: 40 }}>
                            <AlertCircle size={36} color="var(--color-text-muted)" style={{ marginBottom: 12 }} />
                            <h3>No work items match the selected criteria</h3>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginTop: 4 }}>
                                Try clearing some filters or searching with a different term.
                            </p>
                            {activeFilterCount > 0 && (
                                <button className="btn btn-secondary" style={{ marginTop: 14 }} onClick={clearFilters}>
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '30%' }}>Title & Sprint</th>
                                        <th>Project</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Priority</th>
                                        <th>Assignee</th>
                                        <th>Owner</th>
                                        <th style={{ textAlign: 'center' }}>SP</th>
                                        <th>Due Date</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => {
                                        const isUnassigned = !item.assigneeId;
                                        return (
                                            <tr key={item.id} style={{ background: isUnassigned && allocatedFilter === 'non_allocated' ? 'rgba(239, 68, 68, 0.04)' : undefined }}>
                                                <td style={{ fontWeight: 500 }}>
                                                    <div
                                                        className="truncate"
                                                        style={{ cursor: 'pointer', color: 'var(--color-text)', maxWidth: 320 }}
                                                        onClick={() => navigate(`/work-items/${item.id}`)}
                                                        title={item.title}
                                                    >
                                                        {item.title}
                                                    </div>
                                                    {item.sprintName ? (
                                                        <div style={{ fontSize: 11, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                            <Clock size={11} /> {item.sprintName}
                                                        </div>
                                                    ) : (
                                                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                                            Backlog
                                                        </div>
                                                    )}
                                                </td>

                                                <td>
                                                    <span
                                                        onClick={() => {
                                                            setProjectFilter(item.projectId);
                                                            setPage(0);
                                                        }}
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                            color: 'var(--color-primary)',
                                                            background: 'var(--color-info-light)',
                                                            padding: '2px 8px',
                                                            borderRadius: 4,
                                                            cursor: 'pointer',
                                                            display: 'inline-block'
                                                        }}
                                                        title="Filter by this project"
                                                    >
                                                        {item.projectCode ? `${item.projectCode} · ` : ''}{item.projectName || '—'}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                                                        {item.typeName || '—'}
                                                    </span>
                                                </td>

                                                <td>
                                                    <StatusBadge code={item.statusCode || item.statusName} label={item.statusName} />
                                                </td>

                                                <td>
                                                    <StatusBadge code={item.priorityCode || item.priorityName} label={item.priorityName} />
                                                </td>

                                                <td>
                                                    {isUnassigned ? (
                                                        <span
                                                            className="badge badge-danger"
                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                                                            title="This work item has no assignee allocated"
                                                        >
                                                            <UserX size={11} /> Unallocated
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                                                            {item.assigneeName}
                                                        </span>
                                                    )}
                                                </td>

                                                <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                                                    {item.ownerName || '—'}
                                                </td>

                                                <td style={{ textAlign: 'center', fontWeight: 600, fontSize: 12 }}>
                                                    {item.storyPoints !== null && item.storyPoints !== undefined ? item.storyPoints : '—'}
                                                </td>

                                                <td style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', fontSize: 12 }}>
                                                    {item.dueDate || '—'}
                                                </td>

                                                <td style={{ textAlign: 'right' }}>
                                                    {isAdminOrManager && (
                                                        <button
                                                            className="btn btn-sm btn-secondary"
                                                            onClick={() => openEdit(item)}
                                                            title="Edit item"
                                                        >
                                                            <Edit2 size={13} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination Controls */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
                marginTop: 18,
                marginBottom: 28,
                padding: '12px 16px',
                background: 'var(--color-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalElements}</strong> work items
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Per page:</span>
                        <select
                            className="form-select"
                            style={{ height: 30, width: 70, fontSize: 12, padding: '2px 8px' }}
                            value={pageSize}
                            onChange={e => {
                                setPageSize(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                        >
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                        className="btn btn-secondary btn-sm"
                        disabled={page === 0}
                        onClick={() => setPage(0)}
                        title="First Page"
                        style={{ height: 32, padding: '0 8px' }}
                    >
                        <ChevronsLeft size={15} />
                    </button>
                    <button
                        className="btn btn-secondary btn-sm"
                        disabled={page === 0}
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        title="Previous Page"
                        style={{ height: 32, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        <ChevronLeft size={15} /> Prev
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i)
                        .filter(i => {
                            if (totalPages <= 7) return true;
                            if (i === 0 || i === totalPages - 1) return true;
                            return Math.abs(i - page) <= 1;
                        })
                        .map((i, idx, arr) => {
                            const prev = arr[idx - 1];
                            const showEllipsis = prev !== undefined && i - prev > 1;
                            return (
                                <React.Fragment key={i}>
                                    {showEllipsis && (
                                        <span style={{ color: 'var(--color-text-muted)', padding: '0 4px', fontSize: 12 }}>...</span>
                                    )}
                                    <button
                                        className={`btn btn-sm ${page === i ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ height: 32, minWidth: 32, padding: '0 8px', fontSize: 13, fontWeight: page === i ? 600 : 400 }}
                                        onClick={() => setPage(i)}
                                    >
                                        {i + 1}
                                    </button>
                                </React.Fragment>
                            );
                        })}

                    <button
                        className="btn btn-secondary btn-sm"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        title="Next Page"
                        style={{ height: 32, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        Next <ChevronRight size={15} />
                    </button>
                    <button
                        className="btn btn-secondary btn-sm"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(totalPages - 1)}
                        title="Last Page"
                        style={{ height: 32, padding: '0 8px' }}
                    >
                        <ChevronsRight size={15} />
                    </button>
                </div>
            </div>

            {/* Create/Edit Work Item Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editItem ? 'Edit Work Item' : 'Create Work Item'}</h2>
                            <button className="navbar-icon-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                {!editItem && (
                                    <div className="form-group">
                                        <label className="form-label">Project *</label>
                                        <select
                                            className="form-select"
                                            value={form.projectId}
                                            onChange={(e) => {
                                                setForm({ ...form, projectId: e.target.value, sprintId: '' });
                                                fetchProjectMembers(e.target.value);
                                            }}
                                            required
                                        >
                                            <option value="">Select project</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {form.projectId && (
                                    <div className="form-group">
                                        <label className="form-label">Sprint</label>
                                        <select
                                            className="form-select"
                                            value={form.sprintId}
                                            onChange={(e) => setForm({ ...form, sprintId: e.target.value })}
                                        >
                                            <option value="">No Sprint (Backlog)</option>
                                            {formSprints.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.statusCode})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label className="form-label">Title *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter work item title"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Describe the requirements or issue..."
                                        rows={4}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select
                                            className="form-select"
                                            value={form.typeId}
                                            onChange={(e) => setForm({ ...form, typeId: e.target.value })}
                                        >
                                            <option value="">Select type</option>
                                            {masterData.types.map(t => (
                                                <option key={t.id} value={t.id}>{t.displayName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Priority</label>
                                        <select
                                            className="form-select"
                                            value={form.priorityId}
                                            onChange={(e) => setForm({ ...form, priorityId: e.target.value })}
                                        >
                                            <option value="">Select priority</option>
                                            {masterData.priorities.map(p => (
                                                <option key={p.id} value={p.id}>{p.displayName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {editItem && (
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            value={form.statusId}
                                            onChange={(e) => setForm({ ...form, statusId: e.target.value })}
                                        >
                                            <option value="">Select status</option>
                                            {masterData.statuses.map(s => (
                                                <option key={s.id} value={s.id}>{s.displayName}</option>
                                            ))}
                                        </select>
                                        {editItem.ownerName && (
                                            <div className="form-error" style={{ color: 'var(--color-warning)' }}>
                                                Note: Only the owner ({editItem.ownerName}) or Admin can mark as DONE
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">
                                            Owner {editItem?.ownerName && <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>(immutable)</span>}
                                        </label>
                                        <select
                                            className="form-select"
                                            value={form.ownerId}
                                            onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
                                            disabled={!!editItem?.ownerId}
                                        >
                                            <option value="">Select owner</option>
                                            {projectMembers.map(m => (
                                                <option key={m.userId || m.id} value={m.userId || m.id}>
                                                    {m.fullName || m.userName || `User #${m.userId || m.id}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Assignee (Allocation)</label>
                                        <select
                                            className="form-select"
                                            value={form.assigneeId}
                                            onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                                            disabled={editItem && !checkAdminOrManager() && Number(editItem.ownerId) !== Number(user.userId || user.id) && Number(editItem.assigneeId) !== Number(user.userId || user.id)}
                                        >
                                            <option value="">— Unallocated / No Assignee —</option>
                                            {projectMembers.map(m => (
                                                <option key={m.userId || m.id} value={m.userId || m.id}>
                                                    {m.fullName || m.userName || `User #${m.userId || m.id}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Story Points</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0"
                                            value={form.storyPoints}
                                            onChange={(e) => setForm({ ...form, storyPoints: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Due Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={form.dueDate}
                                            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {!editItem && (
                                    <div className="form-group">
                                        <label className="form-label">Attachment <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>(optional)</span></label>
                                        {createFile ? (
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, border: '1px dashed var(--color-secondary)', borderRadius: 8, background: 'var(--color-info-light)' }}>
                                                {createFilePreview ? (
                                                    <img src={createFilePreview} alt="Preview" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--color-border)' }} />
                                                ) : (
                                                    <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-card)', borderRadius: 6, border: '1px solid var(--color-border)' }}>
                                                        <FileText size={24} color="var(--color-text-muted)" />
                                                    </div>
                                                )}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 500, fontSize: 13, wordBreak: 'break-all' }}>{createFile.name}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{(createFile.size / 1024).toFixed(1)} KB</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => {
                                                        setCreateFile(null);
                                                        if (createFilePreview) URL.revokeObjectURL(createFilePreview);
                                                        setCreateFilePreview(null);
                                                    }}
                                                >
                                                    <X size={14} /> Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: '1px dashed var(--color-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                                                <Upload size={16} /> Click to attach file (max 2MB)
                                                <input
                                                    type="file"
                                                    style={{ display: 'none' }}
                                                    accept="image/jpeg,image/png,application/pdf,.doc,.docx"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        if (file.size > 2 * 1024 * 1024) {
                                                            alert('File must be under 2MB');
                                                            e.target.value = '';
                                                            return;
                                                        }
                                                        setCreateFile(file);
                                                        if (file.type.startsWith('image/')) {
                                                            setCreateFilePreview(URL.createObjectURL(file));
                                                        } else {
                                                            setCreateFilePreview(null);
                                                        }
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default WorkItems;
