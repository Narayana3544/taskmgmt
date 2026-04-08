import { useState, useEffect } from 'react';
import api from '../api';

/**
 * Hook to check if the current user has permission for a specific feature and action.
 * Returns { hasPermission, loading }
 * 
 * Usage:
 * const { hasPermission } = usePermissions('WORK_ITEM', 'CREATE');
 * {hasPermission && <button>New Work Item</button>}
 */
export const usePermissions = (feature, action) => {
    const [hasPermission, setHasPermission] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkPermission = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                    setHasPermission(false);
                    return;
                }
                const user = JSON.parse(userStr);
                
                // Admins typically have all permissions, but backend enforces it.
                // We fetch the permissions for the user's role.
                const storedPermsStr = localStorage.getItem('userPermissions');
                let perms = [];
                
                if (storedPermsStr) {
                    perms = JSON.parse(storedPermsStr);
                } else {
                    const res = await api.get('/api/permissions', { params: { roleCode: user.roleCode || user.roleId }});
                    perms = res.data?.data || [];
                    localStorage.setItem('userPermissions', JSON.stringify(perms));
                }
                
                const permission = perms.find(p => p.feature === feature && p.action === action);
                setHasPermission(permission ? permission.allowed : false);
            } catch (err) {
                console.error("Error checking permissions", err);
                setHasPermission(false);
            } finally {
                setLoading(false);
            }
        };
        
        checkPermission();
    }, [feature, action]);

    return { hasPermission, loading };
};

export default usePermissions;
