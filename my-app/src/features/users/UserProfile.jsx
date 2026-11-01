import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, Building } from 'lucide-react';
import api from '../../api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

const UserProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [projects, setProjects] = useState([]);
    const [reportingChain, setReportingChain] = useState({ manager: null, directReports: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [userRes, projRes, chainRes] = await Promise.all([
                    api.get(`/api/users/${id}`),
                    api.get(`/api/users/${id}/projects`).catch(() => ({ data: { data: [] } })),
                    api.get(`/api/users/${id}/reporting-chain`).catch(() => ({ data: { data: { manager: null, directReports: [] } } }))
                ]);
                setProfile(userRes.data?.data);
                setProjects(projRes.data?.data || []);
                setReportingChain(chainRes.data?.data || { manager: null, directReports: [] });
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, [id]);

    if (loading) return <Layout title="Loading..."><div className="empty-state"><p>Loading...</p></div></Layout>;
    if (!profile) return <Layout title="Not Found"><div className="empty-state"><h3>User not found</h3></div></Layout>;

    return (
        <Layout title={profile.fullName}>
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/users')} style={{ marginBottom: 16 }}>
                    <ArrowLeft size={14} /> Back to Users
                </button>

                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-body">
                        <div className="flex items-center gap-4" style={{ marginBottom: 20 }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
                                {(profile.fullName || 'U')[0]}
                            </div>
                            <div>
                                <h1 style={{ fontSize: 20, margin: 0 }}>{profile.fullName}</h1>
                                <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                                    <StatusBadge code={profile.status || 'ACTIVE'} label={profile.status || 'Active'} />
                                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{profile.roleName || profile.role?.displayName || '—'}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '16px 0', borderTop: '1px solid var(--color-border)' }}>
                            <div className="flex items-center gap-2">
                                <Mail size={14} color="var(--color-text-muted)" />
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Email</div>
                                    <div style={{ fontSize: 14 }}>{profile.email}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield size={14} color="var(--color-text-muted)" />
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Role</div>
                                    <div style={{ fontSize: 14 }}>{profile.roleName || '—'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building size={14} color="var(--color-text-muted)" />
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Organization</div>
                                    <div style={{ fontSize: 14 }}>{profile.organizationName || '—'}</div>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Member Since</div>
                                <div style={{ fontSize: 14 }}>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reporting Hierarchy */}
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header">
                        <h3>Reporting Hierarchy</h3>
                    </div>
                    <div className="card-body">
                        {/* Manager Section */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                                Reports To (Manager)
                            </div>
                            {reportingChain.manager ? (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                                    background: 'var(--color-bg-alt)', borderRadius: 8, border: '1px solid var(--color-border)'
                                }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>
                                        {(reportingChain.manager.fullName || 'M')[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-primary)', cursor: 'pointer' }}
                                            onClick={() => navigate(`/users/${reportingChain.manager.id}`)}>
                                            {reportingChain.manager.fullName}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                                            {reportingChain.manager.email} • {reportingChain.manager.roleName || 'Manager'}
                                        </div>
                                    </div>
                                    <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/users/${reportingChain.manager.id}`)}>
                                        View Profile
                                    </button>
                                </div>
                            ) : (
                                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
                                    Top-level leader — Does not report to anyone
                                </p>
                            )}
                        </div>

                        {/* Direct Reports Section */}
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                                Direct Reports ({reportingChain.directReports?.length || 0})
                            </div>
                            {(!reportingChain.directReports || reportingChain.directReports.length === 0) ? (
                                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
                                    No direct reports currently assigned.
                                </p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                                    {reportingChain.directReports.map(rep => (
                                        <div key={rep.id} style={{
                                            display: 'flex', alignItems: 'center', gap: 10, padding: 10,
                                            background: 'var(--color-bg-alt)', borderRadius: 8, border: '1px solid var(--color-border)'
                                        }}>
                                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--color-secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
                                                {(rep.fullName || 'U')[0]}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-secondary)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                    onClick={() => navigate(`/users/${rep.id}`)}>
                                                    {rep.fullName}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {rep.roleName || 'Member'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Projects */}
                <div className="card">
                    <div className="card-header"><h3>Projects ({projects.length})</h3></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {projects.length === 0 ? (
                            <div className="empty-state" style={{ padding: 30 }}><p>Not assigned to any projects</p></div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead><tr><th>Project</th><th>Role</th><th>Manager</th></tr></thead>
                                    <tbody>
                                        {projects.map((p, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 500 }}>{p.projectName || p.project?.name || '—'}</td>
                                                <td style={{ color: 'var(--color-text-secondary)' }}>{p.roleName || '—'}</td>
                                                <td style={{ color: 'var(--color-text-secondary)' }}>{p.reportingManagerName || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: 16 }}>
                    <button className="btn btn-secondary" onClick={() => navigate(`/users/${id}/activity`)}>
                        View Activity Log →
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default UserProfile;
