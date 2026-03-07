import React, { useState, useEffect } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, Eye } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

const MasterData = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [types, setTypes] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [values, setValues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingValues, setLoadingValues] = useState(false);

    // Modal state
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [editType, setEditType] = useState(null);
    const [typeForm, setTypeForm] = useState({ code: '', name: '', description: '' });
    const [showValueModal, setShowValueModal] = useState(false);
    const [editValue, setEditValue] = useState(null);
    const [valueForm, setValueForm] = useState({ code: '', displayName: '', description: '', sortOrder: '', isDefault: false });
    const [saving, setSaving] = useState(false);

    // Usage view
    const [showUsage, setShowUsage] = useState(null);
    const [usageData, setUsageData] = useState([]);

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/master-data/types', { params: { orgId: user.organizationId } });
            setTypes(res.data?.data || []);
        } catch (err) { console.error(err); setTypes([]); }
        finally { setLoading(false); }
    };

    const fetchValues = async (typeId) => {
        setLoadingValues(true);
        try {
            const res = await api.get('/api/master-data/values', { params: { typeId } });
            setValues(res.data?.data || []);
        } catch (err) { console.error(err); setValues([]); }
        finally { setLoadingValues(false); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchTypes(); }, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (selectedType) fetchValues(selectedType.id); }, [selectedType]);

    // Type modal
    const openCreateType = () => { setEditType(null); setTypeForm({ code: '', name: '', description: '' }); setShowTypeModal(true); };
    const openEditType = (t) => { setEditType(t); setTypeForm({ code: t.code, name: t.name, description: t.description || '' }); setShowTypeModal(true); };
    const handleSaveType = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            if (editType) {
                await api.put(`/api/master-data/types/${editType.id}`, typeForm);
            } else {
                await api.post('/api/master-data/types', typeForm, { params: { orgId: user.organizationId } });
            }
            setShowTypeModal(false); fetchTypes();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    // Value modal
    const openCreateValue = () => { setEditValue(null); setValueForm({ code: '', displayName: '', description: '', sortOrder: '', isDefault: false }); setShowValueModal(true); };
    const openEditValue = (v) => { setEditValue(v); setValueForm({ code: v.code, displayName: v.displayName, description: v.description || '', sortOrder: v.sortOrder || '', isDefault: v.isDefault || false }); setShowValueModal(true); };
    const handleSaveValue = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const payload = { ...valueForm, typeId: selectedType.id, sortOrder: valueForm.sortOrder ? Number(valueForm.sortOrder) : null };
            if (editValue) {
                await api.put(`/api/master-data/values/${editValue.id}`, payload);
            } else {
                await api.post('/api/master-data/values', payload);
            }
            setShowValueModal(false); fetchValues(selectedType.id);
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const toggleValueActive = async (v) => {
        try {
            await api.put(`/api/master-data/values/${v.id}`, { ...v, active: !v.active, typeId: selectedType.id });
            fetchValues(selectedType.id);
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    // Usage view
    const openUsage = async (v) => {
        setShowUsage(v);
        try {
            const res = await api.get(`/api/master-data/values/${v.id}/usage`);
            setUsageData(res.data?.data || []);
        } catch (err) { setUsageData([]); }
    };

    return (
        <Layout title="Master Data">
            <div className="page-header">
                <div>
                    <h1>Master Data</h1>
                    <p className="page-header-subtitle">Manage system configuration values</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateType}><Plus size={16} /> Add Type</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, minHeight: 500 }}>
                {/* Types Panel */}
                <div className="card">
                    <div className="card-header"><h3>Master Types</h3></div>
                    <div style={{ padding: 0 }}>
                        {loading ? (
                            <div className="empty-state" style={{ padding: 20 }}><p>Loading...</p></div>
                        ) : types.length === 0 ? (
                            <div className="empty-state" style={{ padding: 20 }}><p>No types</p></div>
                        ) : (
                            types.map(t => (
                                <div key={t.id}
                                    onClick={() => setSelectedType(t)}
                                    style={{
                                        padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--color-border-light)',
                                        background: selectedType?.id === t.id ? 'var(--color-info-light)' : 'transparent',
                                        transition: 'background 0.15s'
                                    }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div style={{ fontWeight: 500, fontSize: 13 }}>{t.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{t.code}</div>
                                        </div>
                                        <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); openEditType(t); }}>
                                            <Edit2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Values Panel */}
                <div className="card">
                    <div className="card-header">
                        <h3>{selectedType ? `${selectedType.name} Values` : 'Select a Type'}</h3>
                        {selectedType && (
                            <button className="btn btn-sm btn-primary" onClick={openCreateValue}><Plus size={14} /> Add Value</button>
                        )}
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {!selectedType ? (
                            <div className="empty-state" style={{ padding: 40 }}><h3>Select a master type</h3><p>Choose a type from the left panel.</p></div>
                        ) : loadingValues ? (
                            <div className="empty-state" style={{ padding: 40 }}><p>Loading...</p></div>
                        ) : values.length === 0 ? (
                            <div className="empty-state" style={{ padding: 40 }}>
                                <h3>No values</h3>
                                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreateValue}><Plus size={16} /> Add Value</button>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr><th>Code</th><th>Display Name</th><th>Order</th><th>Default</th><th>Status</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        {values.map(v => (
                                            <tr key={v.id} style={{ opacity: v.active === false ? 0.5 : 1 }}>
                                                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{v.code}</td>
                                                <td style={{ fontWeight: 500 }}>{v.displayName}</td>
                                                <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{v.sortOrder ?? '—'}</td>
                                                <td style={{ textAlign: 'center' }}>{v.isDefault ? '✓' : ''}</td>
                                                <td><StatusBadge code={v.active !== false ? 'ACTIVE' : 'INACTIVE'} label={v.active !== false ? 'Active' : 'Disabled'} /></td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button className="btn btn-sm btn-secondary" onClick={() => openEditValue(v)} title="Edit"><Edit2 size={12} /></button>
                                                        <button className="btn btn-sm btn-secondary" onClick={() => openUsage(v)} title="Usage"><Eye size={12} /></button>
                                                        <button className="btn btn-sm btn-secondary" onClick={() => toggleValueActive(v)} title={v.active !== false ? 'Disable' : 'Enable'}>
                                                            {v.active !== false ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Type Modal */}
            {showTypeModal && (
                <div className="modal-overlay" onClick={() => setShowTypeModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editType ? 'Edit Type' : 'Add Master Type'}</h2>
                            <button className="navbar-icon-btn" onClick={() => setShowTypeModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSaveType}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Code * <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>(immutable once used)</span></label>
                                    <input type="text" className="form-input" placeholder="e.g. WORK_ITEM_STATUS" value={typeForm.code}
                                        onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })} required disabled={!!editType} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input type="text" className="form-input" placeholder="e.g. Work Item Status" value={typeForm.name}
                                        onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" placeholder="Optional description..." value={typeForm.description}
                                        onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowTypeModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editType ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Value Modal */}
            {showValueModal && (
                <div className="modal-overlay" onClick={() => setShowValueModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editValue ? 'Edit Value' : 'Add Master Value'}</h2>
                            <button className="navbar-icon-btn" onClick={() => setShowValueModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSaveValue}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Code * <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>(immutable once used)</span></label>
                                    <input type="text" className="form-input" placeholder="e.g. OPEN" value={valueForm.code}
                                        onChange={(e) => setValueForm({ ...valueForm, code: e.target.value })} required disabled={!!editValue} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Display Name *</label>
                                    <input type="text" className="form-input" placeholder="e.g. Open" value={valueForm.displayName}
                                        onChange={(e) => setValueForm({ ...valueForm, displayName: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" placeholder="Optional..." value={valueForm.description}
                                        onChange={(e) => setValueForm({ ...valueForm, description: e.target.value })} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Sort Order</label>
                                        <input type="number" className="form-input" placeholder="0" value={valueForm.sortOrder}
                                            onChange={(e) => setValueForm({ ...valueForm, sortOrder: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Default</label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={valueForm.isDefault}
                                                onChange={(e) => setValueForm({ ...valueForm, isDefault: e.target.checked })} />
                                            <span style={{ fontSize: 13 }}>Set as default value</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowValueModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editValue ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Usage Modal */}
            {showUsage && (
                <div className="modal-overlay" onClick={() => setShowUsage(null)}>
                    <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Usage — {showUsage.displayName}</h2>
                            <button className="navbar-icon-btn" onClick={() => setShowUsage(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                                <strong>{showUsage.code}</strong> is used in the following entities:
                            </p>
                            {usageData.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 20, fontSize: 13 }}>
                                    Not used anywhere yet, or usage data unavailable.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {usageData.map((u, i) => (
                                        <div key={i} style={{ padding: '8px 12px', background: 'var(--color-bg-alt)', borderRadius: 6, fontSize: 13 }}>
                                            <span style={{ fontWeight: 500 }}>{u.entityType}</span>
                                            <span style={{ color: 'var(--color-text-muted)', marginLeft: 8 }}>· {u.count} records</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default MasterData;
