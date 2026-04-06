import React, { useState, useEffect } from 'react';
import { Building, Globe, Clock, Image as ImageIcon } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';

const OrganizationSettings = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const orgId = user.organizationId;
    
    const [org, setOrg] = useState({
        name: '',
        code: '',
        timezone: '',
        workingDays: '',
        logoUrl: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    useEffect(() => {
        if (!orgId) return;
        const fetchOrg = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/api/organizations/${orgId}`);
                setOrg(res.data.data);
            } catch (err) {
                console.error(err);
                alert('Failed to load organization details');
            } finally {
                setLoading(false);
            }
        };
        fetchOrg();
    }, [orgId]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/api/organizations/${orgId}`, org);
            alert('Organization details updated successfully!');
            // Also update local user object so sidebar picks it up
            const updatedUser = { ...user, organizationName: org.name, organizationLogo: org.logoUrl };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.dispatchEvent(new Event('storage')); // optionally force redraw
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to update organization');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('File size must be less than 2MB');
            return;
        }

        setUploadingLogo(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'logos');

        try {
            const uploadRes = await api.post('/api/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const fileUrl = uploadRes.data.data.url;
            setOrg({ ...org, logoUrl: fileUrl });
        } catch (err) {
            console.error('Upload error', err);
            alert(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploadingLogo(false);
        }
    };

    if (loading) {
        return <Layout title="Organization Settings"><div style={{ padding: 40 }}>Loading...</div></Layout>;
    }

    return (
        <Layout title="Organization Settings">
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <div className="page-header">
                    <h1>Organization Settings</h1>
                </div>

                <div className="card">
                    <form onSubmit={handleSave} className="card-body">
                        
                        <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 24, marginBottom: 24 }}>
                            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Organization Logo</h3>
                            <div className="flex gap-4 items-center">
                                <div style={{ 
                                    width: 80, height: 80, borderRadius: 'var(--radius-md)', 
                                    border: '1px dashed var(--color-border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'var(--color-bg-alt)', overflow: 'hidden'
                                }}>
                                    {org.logoUrl ? (
                                        <img src={org.logoUrl} alt="Organization Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <Building size={32} color="var(--color-text-muted)" />
                                    )}
                                </div>
                                <div>
                                    <label className="btn btn-secondary">
                                        <ImageIcon size={16} />
                                        {uploadingLogo ? 'Uploading...' : 'Upload New Logo'}
                                        <input type="file" hidden accept="image/jpeg,image/png" onChange={handleLogoUpload} disabled={uploadingLogo} />
                                    </label>
                                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8 }}>
                                        Recommended size: 256x256px. Max size: 2MB.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div className="form-group">
                                <label className="form-label">
                                    <Building size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                                    Organization Name
                                </label>
                                <input type="text" className="form-input" 
                                    value={org.name} onChange={(e) => setOrg({...org, name: e.target.value})} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Key/Code</label>
                                <input type="text" className="form-input" 
                                    value={org.code} onChange={(e) => setOrg({...org, code: e.target.value})} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <Globe size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                                    Timezone
                                </label>
                                <select className="form-select" value={org.timezone} onChange={(e) => setOrg({...org, timezone: e.target.value})}>
                                    <option value="UTC">UTC</option>
                                    <option value="EST">EST</option>
                                    <option value="CST">CST</option>
                                    <option value="PST">PST</option>
                                    <option value="IST">IST (Indian Standard Time)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <Clock size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                                    Working Days
                                </label>
                                <input type="text" className="form-input" placeholder="MON-FRI"
                                    value={org.workingDays} onChange={(e) => setOrg({...org, workingDays: e.target.value})} />
                            </div>
                        </div>
                        
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default OrganizationSettings;
