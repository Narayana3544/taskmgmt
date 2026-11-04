import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../../../api';
import {
  DASHBOARD_CONFIG,
  calculateProjectHealth,
  calculateSprintVelocity,
  computeKpiMetrics,
} from './dashboardUtils';

/**
 * Custom hook for Project Dashboard data lifecycle.
 * Features:
 * - Uses /api/work-items/stats for aggregate metrics and status counts
 * - Fetches size=1000 list for Attention Panel and Team Workload
 *   TODO: Switch work items table to server-side pagination with dynamic filters
 * - 60-second background auto-refresh that pauses when document is hidden
 * - Zero skeleton flicker on background refresh
 */
export const useProjectDashboard = (projectId) => {
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [masterStatuses, setMasterStatuses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const isMountedRef = useRef(true);
  const isInitialLoadRef = useRef(true);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (!projectId) return;

    if (isInitialLoadRef.current) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const [
        projRes,
        membRes,
        sprintsRes,
        statusRes,
        statsRes,
        itemsRes,
      ] = await Promise.all([
        api.get(`/api/projects/${projectId}`).catch(() => ({ data: { data: null } })),
        api.get(`/api/projects/${projectId}/members`).catch(() => ({ data: { data: [] } })),
        api.get('/api/sprints', { params: { projectId, page: 0, size: 20 } }).catch(() => ({ data: { data: { content: [] } } })),
        api.get('/api/master-data/values/by-code', { params: { typeCode: 'WORK_ITEM_STATUS' } }).catch(() => ({ data: { data: [] } })),
        api.get('/api/work-items/stats', { params: { projectId } }).catch(() => ({ data: { data: null } })),
        // TODO: Switch work items table to server-side pagination with dynamic filters
        api.get('/api/work-items', { params: { projectId, page: 0, size: 1000 } }).catch(() => ({ data: { data: { content: [] } } })),
      ]);

      if (!isMountedRef.current) return;

      const projectData = projRes.data?.data || null;
      const membersData = membRes.data?.data || [];
      const sprintsData = sprintsRes.data?.data?.content || [];
      const statusesData = (statusRes.data?.data || []).sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
      );
      const serverStats = statsRes.data?.data || null;
      const itemsData = itemsRes.data?.data?.content || [];

      // Find active sprint
      const currentActiveSprint = sprintsData.find(
        (s) => String(s.statusCode || '').toUpperCase() === 'ACTIVE'
      ) || null;

      setProject(projectData);
      setMembers(membersData);
      setSprints(sprintsData);
      setActiveSprint(currentActiveSprint);
      setMasterStatuses(statusesData);
      setStats(serverStats);
      setItems(itemsData);

      const now = new Date();
      setLastUpdated(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
      setError(null);
    } catch (err) {
      console.error('Project dashboard fetch error:', err);
      if (isMountedRef.current) {
        setError(err.response?.data?.message || 'Failed to load project dashboard data');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsRefreshing(false);
        isInitialLoadRef.current = false;
        setIsInitialLoad(false);
      }
    }
  }, [projectId]);

  // Initial load
  useEffect(() => {
    isMountedRef.current = true;
    isInitialLoadRef.current = true;
    fetchDashboardData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDashboardData]);

  // Auto-refresh timer (60s) with visibilitychange pause
  useEffect(() => {
    let intervalId = null;

    const startTimer = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (!document.hidden && isMountedRef.current) {
          fetchDashboardData(false);
        }
      }, DASHBOARD_CONFIG.AUTO_REFRESH_INTERVAL_MS);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalId) clearInterval(intervalId);
      } else {
        // Tab became visible again: refresh silently and restart timer
        fetchDashboardData(false);
        startTimer();
      }
    };

    startTimer();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchDashboardData]);

  // Computed Health, Velocity and 5 KPI Metrics
  const health = useMemo(() => calculateProjectHealth(activeSprint, items), [activeSprint, items]);
  const velocity = useMemo(() => calculateSprintVelocity(sprints), [sprints]);
  const kpiMetrics = useMemo(() => computeKpiMetrics(stats, items, activeSprint), [stats, items, activeSprint]);

  return {
    project,
    members,
    sprints,
    activeSprint,
    stats,
    items,
    masterStatuses,
    health,
    velocity,
    kpiMetrics,
    lastUpdated,
    loading,
    isRefreshing,
    isInitialLoad,
    error,
    refetch: () => fetchDashboardData(true),
  };
};

export default useProjectDashboard;
