import React, { useEffect, useState } from 'react';
import GlassCard from '../components/glass/GlassCard';
import GlassButton from '../components/glass/GlassButton';
import api from '../api';
import { User, Search, Filter, MoreVertical, Shield } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users', { withCredentials: true });
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="text-white p-6">Loading users...</div>;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                    <p className="text-glass-text-secondary">Manage platform users and access levels</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-3 text-glass-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="glass-input pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <GlassButton variant="default" icon={Filter}>Filter</GlassButton>
                </div>
            </div>

            <GlassCard padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-glass-border-medium bg-white/5">
                                <th className="p-4 text-glass-text-muted font-semibold text-xs uppercase tracking-wider">User</th>
                                <th className="p-4 text-glass-text-muted font-semibold text-xs uppercase tracking-wider">Role</th>
                                <th className="p-4 text-glass-text-muted font-semibold text-xs uppercase tracking-wider">Department</th>
                                <th className="p-4 text-glass-text-muted font-semibold text-xs uppercase tracking-wider">Status</th>
                                <th className="p-4 text-glass-text-muted font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="border-b border-glass-border-medium hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                {user.first_name?.[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{user.first_name} {user.last_name}</div>
                                                <div className="text-xs text-glass-text-muted">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                            <Shield size={12} />
                                            {user.role?.name || 'USER'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-glass-text-secondary text-sm">
                                        {user.department || '-'}
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            Active
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="p-2 rounded-lg hover:bg-white/10 text-glass-text-muted hover:text-white transition-colors">
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <GlassCard.Footer className="bg-white/5 border-t-0 mt-0">
                    <span className="text-xs text-glass-text-muted">Showing {filteredUsers.length} users</span>
                </GlassCard.Footer>
            </GlassCard>
        </div>
    );
};

export default AdminUsers;
