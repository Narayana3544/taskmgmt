import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Building } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

const Profile = () => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const [profile, setProfile] = useState(stored);
    const [uploading, setUploading] = useState(false);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('File size must be less than 2MB');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'profiles');

        try {
            const uploadRes = await api.post('/api/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const fileUrl = uploadRes.data.data.url;

            const updateRes = await api.patch('/api/users/me/avatar', { profileImageUrl: fileUrl });
            const updatedProfile = updateRes.data.data;
            setProfile(updatedProfile);
            localStorage.setItem('user', JSON.stringify({ ...stored, ...updatedProfile }));
        } catch (err) {
            console.error('Upload error', err);
            alert(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/api/users/me');
                setProfile(res.data?.data || stored);
            } catch (err) { console.error(err); setProfile(stored); }
        };
        fetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Layout title="My Profile">
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <div className="page-header">
                    <h1>My Profile</h1>
                </div>

                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center gap-4" style={{ marginBottom: 24 }}>
                            <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                                {profile.profileImageUrl ? (
                                    <img src={profile.profileImageUrl} alt="Avatar" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 26 }}>
                                        {(profile.fullName || profile.name || 'U')[0]}
                                    </div>
                                )}
                                <label style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--color-primary)', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title="Change Picture">
                                    <User size={12} />
                                    <input type="file" hidden accept="image/jpeg,image/png" onChange={handleAvatarUpload} disabled={uploading} />
                                </label>
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 20 }}>{profile.fullName || profile.name || '—'}</h2>
                                <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                                    <StatusBadge code={profile.status || 'ACTIVE'} label={profile.status || 'Active'} />
                                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                                        {profile.roleName || profile.role || '—'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
                            <div className="flex items-center gap-3">
                                <Mail size={16} color="var(--color-text-muted)" />
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Email</div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{profile.email || '—'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Shield size={16} color="var(--color-text-muted)" />
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Role</div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{profile.roleName || profile.role || '—'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Building size={16} color="var(--color-text-muted)" />
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Organization</div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{profile.organizationName || '—'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <User size={16} color="var(--color-text-muted)" />
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>User ID</div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{profile.userId || profile.id || '—'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
