import React, { useEffect, useState } from 'react';
import GlassCard from '../components/glass/GlassCard';
import GlassButton from '../components/glass/GlassButton';
import api from '../api';
import { Shield, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminRoles = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles', { withCredentials: true });
            setRoles(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load roles");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRole = () => {
        toast.info("Create Role modal would open here");
    };

    if (loading) return <div className="text-white p-6">Loading roles...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Role Management</h1>
                    <p className="text-glass-text-secondary">Manage system roles and permissions</p>
                </div>
                <GlassButton variant="primary" icon={Plus} onClick={handleCreateRole}>
                    Create Role
                </GlassButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map((role) => (
                    <GlassCard key={role.id} hoverable>
                        <GlassCard.Header
                            title={role.name}
                            icon={Shield}
                            className="border-b-0 pb-0"
                            actions={
                                <div className="flex gap-2">
                                    {!role.systemRole && (
                                        <>
                                            <button className="text-glass-text-muted hover:text-white transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="text-glass-text-muted hover:text-red-400 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            }
                        />

                        <GlassCard.Body className="mt-2">
                            <p className="text-sm mb-4 h-10 line-clamp-2">{role.description || 'No description provided'}</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {role.systemRole ? (
                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">System Role</span>
                                ) : (
                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Custom Role</span>
                                )}
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/70 border border-white/10">
                                    Active
                                </span>
                            </div>

                            <div className="text-xs text-glass-text-muted">
                                Permissions: {role.permissions?.length || 0}
                            </div>
                        </GlassCard.Body>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
};

export default AdminRoles;
