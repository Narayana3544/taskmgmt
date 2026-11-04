import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListTodo,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
} from 'lucide-react';
import {
  getStatusMeta,
  getStatusColor,
  normalizeStatusCode,
  isItemOverdue,
  isItemStale,
} from '../dashboardUtils';
import { ROUTES } from '../../../../constants/routes';

/**
 * Enterprise Work Items Table Component
 * - Collapsible card with debounced search, column sorting, pagination
 * - Dynamic master-data status filter chips with live counts
 * - Seamless cross-widget filtering from KPI strip, pipeline, donut, team workload & attention panel
 * - Smooth auto-scroll when a filter is applied externally
 */
const WorkItemsTable = ({
  projectId,
  items = [],
  totalAllItemsCount = 0,
  masterStatuses = [],
  members = [],
  sprints = [],
  filters = {},
  sharedFilter = null,
  onFilterChange,
  onRemoveFilterKey,
  onClearFilters,
  onSelectStatus,
  pageSize = 25,
  onPageSizeChange,
}) => {
  const navigate = useNavigate();
  const tableContainerRef = useRef(null);

  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Local sorting
  const [sortField, setSortField] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Smooth scroll into view when filters change externally
  const prevFilterHashRef = useRef('');
  useEffect(() => {
    const active = filters || sharedFilter;
    if (active) {
      const hash = JSON.stringify(active);
      if (prevFilterHashRef.current && prevFilterHashRef.current !== hash && tableContainerRef.current) {
        tableContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      prevFilterHashRef.current = hash;
    }
  }, [filters, sharedFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sharedFilter]);

  // Status counts for status filter chips
  const statusCounts = useMemo(() => {
    const counts = new Map();
    (items || []).forEach((item) => {
      const code = normalizeStatusCode(item) || 'BACKLOG';
      counts.set(code, (counts.get(code) || 0) + 1);
    });
    return counts;
  }, [items]);

  // Apply all active filters (AND combination)
  const filteredItems = useMemo(() => {
    let result = [...(items || [])];
    const active = { ...(sharedFilter || {}), ...(filters || {}) };

    // 1. KPI Category filter
    if (active.category) {
      switch (active.category) {
        case 'COMPLETED':
          result = result.filter((i) => getStatusMeta(normalizeStatusCode(i)).isCompleted);
          break;
        case 'IN_FLIGHT':
          result = result.filter((i) => getStatusMeta(normalizeStatusCode(i)).isInFlight);
          break;
        case 'BLOCKERS':
        case 'BLOCKER':
          result = result.filter(
            (i) =>
              isItemOverdue(i) ||
              getStatusMeta(normalizeStatusCode(i)).isRisk ||
              !i.assigneeId
          );
          break;
        case 'OVERDUE':
          result = result.filter(isItemOverdue);
          break;
        case 'REOPENED':
          result = result.filter((i) => getStatusMeta(normalizeStatusCode(i)).isRisk);
          break;
        case 'UNASSIGNED':
          result = result.filter((i) => !i.assigneeId);
          break;
        case 'STALE':
          result = result.filter(isItemStale);
          break;
        case 'ALL':
        default:
          break;
      }
    }

    // 2. Status code filter (from Pipeline, Donut, or Status Chips)
    if (active.statusCode) {
      result = result.filter(
        (i) =>
          normalizeStatusCode(i.statusCode || i.statusName) ===
          normalizeStatusCode(active.statusCode)
      );
    }

    // 3. Assignee ID filter (from Team Workload row click)
    if (active.assigneeId !== undefined && active.assigneeId !== null) {
      result = result.filter(
        (i) => Number(i.assigneeId) === Number(active.assigneeId)
      );
    }

    // 4. Attention Category filter (from Attention Panel tabs)
    if (active.attentionCategory) {
      switch (active.attentionCategory) {
        case 'overdue':
          result = result.filter(isItemOverdue);
          break;
        case 'reopened':
          result = result.filter((i) => getStatusMeta(normalizeStatusCode(i)).isRisk);
          break;
        case 'unassigned':
          result = result.filter((i) => !i.assigneeId);
          break;
        case 'stale':
          result = result.filter(isItemStale);
          break;
        default:
          break;
      }
    }

    // 5. Debounced search filter
    const searchStr = (active.search || debouncedSearch || '').trim().toLowerCase();
    if (searchStr) {
      result = result.filter((i) => {
        const itemKey = i.projectCode ? `${i.projectCode}-${i.id}` : `#${i.id}`;
        return (
          String(i.title || '').toLowerCase().includes(searchStr) ||
          itemKey.toLowerCase().includes(searchStr) ||
          String(i.id || '').includes(searchStr) ||
          String(i.assigneeName || '').toLowerCase().includes(searchStr) ||
          String(i.statusName || '').toLowerCase().includes(searchStr)
        );
      });
    }

    return result;
  }, [items, sharedFilter, filters, debouncedSearch]);

  // Sort items
  const sortedItems = useMemo(() => {
    const list = [...filteredItems];

    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'id') {
        valA = Number(a.id) || 0;
        valB = Number(b.id) || 0;
      } else if (sortField === 'storyPoints') {
        valA = Number(a.storyPoints) || 0;
        valB = Number(b.storyPoints) || 0;
      } else if (sortField === 'title') {
        valA = String(a.title || '').toLowerCase();
        valB = String(b.title || '').toLowerCase();
      } else if (sortField === 'status') {
        valA = String(a.statusName || a.statusCode || '').toLowerCase();
        valB = String(b.statusName || b.statusCode || '').toLowerCase();
      } else if (sortField === 'assignee') {
        valA = String(a.assigneeName || '').toLowerCase();
        valB = String(b.assigneeName || '').toLowerCase();
      } else if (sortField === 'dueDate' || sortField === 'updatedAt') {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [filteredItems, sortField, sortDirection]);

  // Pagination calculation
  const totalItems = sortedItems.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + pageSize);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={12} color="var(--dash-text-muted)" />;
    return sortDirection === 'asc' ? (
      <ArrowUp size={12} color="var(--dash-primary)" />
    ) : (
      <ArrowDown size={12} color="var(--dash-primary)" />
    );
  };

  // Human-readable active filter descriptions with unique keys for removal
  const activeFilterDescriptions = useMemo(() => {
    const list = [];
    const active = { ...(sharedFilter || {}), ...(filters || {}) };

    if (active.sprintId && active.sprintId !== 'ALL') {
      const s = sprints.find((sp) => String(sp.id) === String(active.sprintId));
      list.push({
        key: 'sprintId',
        label: active.sprintId === 'ACTIVE' ? 'Sprint: Active' : `Sprint: ${s ? s.name : active.sprintId}`,
      });
    }

    if (active.globalAssigneeId && active.globalAssigneeId !== 'ALL') {
      if (active.globalAssigneeId === 'UNASSIGNED') {
        list.push({ key: 'globalAssigneeId', label: 'Assignee: Unassigned' });
      } else {
        const m = members.find((mem) => String(mem.userId || mem.id) === String(active.globalAssigneeId));
        list.push({
          key: 'globalAssigneeId',
          label: `Assignee (Global): ${m ? (m.userName || m.fullName) : active.globalAssigneeId}`,
        });
      }
    }

    if (active.dateRange && active.dateRange.preset && active.dateRange.preset !== 'all') {
      let dateText = active.dateRange.preset;
      if (active.dateRange.preset === 'last7') dateText = 'Last 7 days';
      else if (active.dateRange.preset === 'last30') dateText = 'Last 30 days';
      else if (active.dateRange.preset === 'sprint') dateText = 'This sprint';
      else if (active.dateRange.preset === 'custom') {
        dateText = `${active.dateRange.from || 'Start'} to ${active.dateRange.to || 'Now'}`;
      }
      list.push({
        key: 'dateRange',
        label: `Date: ${dateText}`,
      });
    }

    if (active.category) {
      list.push({
        key: 'category',
        label: `KPI: ${String(active.category).replace(/_/g, ' ')}`,
      });
    }

    if (active.statusCode) {
      const ms = masterStatuses.find(
        (s) => normalizeStatusCode(s) === normalizeStatusCode(active.statusCode)
      );
      list.push({
        key: 'statusCode',
        label: `Status: ${ms ? ms.displayName : active.statusCode}`,
      });
    }

    if (active.assigneeId) {
      const m = members.find(
        (mem) => Number(mem.userId || mem.id) === Number(active.assigneeId)
      );
      list.push({
        key: 'assigneeId',
        label: `Member: ${m ? (m.userName || m.fullName) : active.assigneeId}`,
      });
    }

    if (active.attentionCategory) {
      list.push({
        key: 'attentionCategory',
        label: `Attention: ${active.attentionCategory}`,
      });
    }

    if (debouncedSearch.trim()) {
      list.push({
        key: 'search',
        label: `Search: "${debouncedSearch.trim()}"`,
      });
    }

    return list;
  }, [filters, sharedFilter, masterStatuses, members, sprints, debouncedSearch]);

  // Construct query parameters for "Open in Work Items"
  const handleOpenInWorkItems = () => {
    const params = new URLSearchParams();
    const active = { ...(sharedFilter || {}), ...(filters || {}) };
    if (projectId) params.set('projectId', projectId);
    if (active.statusCode) params.set('statusCode', active.statusCode);
    if (active.assigneeId) params.set('assigneeId', active.assigneeId);
    if (active.globalAssigneeId && active.globalAssigneeId !== 'ALL') params.set('assigneeId', active.globalAssigneeId);
    if (active.sprintId && active.sprintId !== 'ALL') params.set('sprintId', active.sprintId);
    if (debouncedSearch) params.set('search', debouncedSearch);

    const queryString = params.toString();
    navigate(queryString ? `${ROUTES.WORK_ITEMS}?${queryString}` : ROUTES.WORK_ITEMS);
  };

  return (
    <div
      ref={tableContainerRef}
      className="dash-card dash-col-12"
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {/* Table Header: Expand/Collapse, Search & Actions */}
      <div className="dash-card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 0,
            }}
            title={isExpanded ? 'Collapse work items table' : 'Expand work items table'}
          >
            <ListTodo size={16} color="var(--dash-primary)" />
            <h3 className="dash-card-title" style={{ margin: 0, cursor: 'pointer' }}>
              Work Items
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--dash-text-muted)', marginLeft: 6 }}>
                Showing {filteredItems.length} of {totalAllItemsCount || items.length}
              </span>
            </h3>
            {isExpanded ? <ChevronUp size={16} color="var(--dash-text-muted)" /> : <ChevronDown size={16} color="var(--dash-text-muted)" />}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Debounced Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search
              size={14}
              color="var(--dash-text-muted)"
              style={{ position: 'absolute', left: 9 }}
            />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                height: 30,
                padding: '0 28px 0 28px',
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid var(--dash-border)',
                background: 'var(--dash-bg)',
                color: 'var(--dash-text-primary)',
                width: 220,
                outline: 'none',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Clear search"
              >
                <X size={12} color="var(--dash-text-muted)" />
              </button>
            )}
          </div>

          {/* Open in Work Items Page Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleOpenInWorkItems}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 30,
              padding: '0 10px',
              fontSize: 12,
            }}
            title="Open filtered list in full Work Items management page"
          >
            <span>Open in Work Items</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Active Filter Chips & Status Tabs Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: '1px solid var(--dash-border-subtle)',
            }}
          >
            {/* Status Quick Filter Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`dash-sort-pill ${!(filters?.statusCode || sharedFilter?.statusCode) ? 'is-active' : ''}`}
                onClick={() => onSelectStatus && onSelectStatus(null)}
                style={{ fontSize: 11, padding: '3px 8px' }}
              >
                All ({items.length})
              </button>

              {masterStatuses.map((ms) => {
                const code = normalizeStatusCode(ms);
                const count = statusCounts.get(code) || 0;
                const activeCode = filters?.statusCode || sharedFilter?.statusCode;
                const isSelected = normalizeStatusCode(activeCode) === code;

                return (
                  <button
                    key={code}
                    type="button"
                    className={`dash-sort-pill ${isSelected ? 'is-active' : ''}`}
                    onClick={() => onSelectStatus && onSelectStatus(isSelected ? null : code)}
                    style={{ fontSize: 11, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(code),
                      }}
                    />
                    <span>{ms.displayName}</span>
                    <strong className="tabular-nums" style={{ opacity: 0.85 }}>({count})</strong>
                  </button>
                );
              })}
            </div>

            {/* Active Cross-Widget Filter Chips with individual remove buttons */}
            {activeFilterDescriptions.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--dash-text-muted)' }}>Filtered by:</span>
                {activeFilterDescriptions.map((f) => (
                  <span
                    key={f.key}
                    className="dash-filter-chip"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>{f.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (f.key === 'search') {
                          setSearchTerm('');
                          setDebouncedSearch('');
                        }
                        if (onRemoveFilterKey) onRemoveFilterKey(f.key);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '0 2px',
                        cursor: 'pointer',
                        color: 'inherit',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                      title={`Remove filter ${f.label}`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSearchTerm('');
                    setDebouncedSearch('');
                    if (onClearFilters) onClearFilters();
                  }}
                  style={{ height: 24, fontSize: 11, padding: '0 6px' }}
                  title="Clear all active cross-widget filters"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Table Container with local horizontal scrolling */}
          <div className="dash-table-wrap">
            {paginatedItems.length === 0 ? (
              <div
                style={{
                  padding: '40px 16px',
                  textAlign: 'center',
                  color: 'var(--dash-text-muted)',
                  fontSize: 13,
                }}
              >
                <div>No work items match the active filters or search criteria.</div>
                {(activeFilterDescriptions.length > 0 || searchTerm) && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      if (onClearFilters) onClearFilters();
                      setSearchTerm('');
                    }}
                    style={{ marginTop: 12 }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <table className="dash-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--dash-border)', background: 'var(--dash-bg)', color: 'var(--dash-text-secondary)' }}>
                    <th
                      style={{ padding: '8px 12px', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      onClick={() => handleSort('id')}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span>Key</span>
                        {getSortIcon('id')}
                      </div>
                    </th>

                    <th
                      style={{ padding: '8px 12px', textAlign: 'left', cursor: 'pointer', minWidth: 200 }}
                      onClick={() => handleSort('title')}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span>Title</span>
                        {getSortIcon('title')}
                      </div>
                    </th>

                    <th className="dash-col-hide-mobile" style={{ padding: '8px 12px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      Type
                    </th>

                    <th
                      style={{ padding: '8px 12px', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      onClick={() => handleSort('status')}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </th>

                    <th className="dash-col-hide-tablet" style={{ padding: '8px 12px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      Priority
                    </th>

                    <th
                      style={{ padding: '8px 12px', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      onClick={() => handleSort('assignee')}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span>Assignee</span>
                        {getSortIcon('assignee')}
                      </div>
                    </th>

                    <th
                      className="dash-col-hide-mobile"
                      style={{ padding: '8px 12px', textAlign: 'right', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      onClick={() => handleSort('storyPoints')}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                        <span>SP</span>
                        {getSortIcon('storyPoints')}
                      </div>
                    </th>

                    <th
                      className="dash-col-hide-tablet"
                      style={{ padding: '8px 12px', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      onClick={() => handleSort('dueDate')}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span>Due Date</span>
                        {getSortIcon('dueDate')}
                      </div>
                    </th>

                    <th
                      className="dash-col-hide-tablet"
                      style={{ padding: '8px 12px', textAlign: 'right', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      onClick={() => handleSort('updatedAt')}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                        <span>Updated</span>
                        {getSortIcon('updatedAt')}
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedItems.map((item) => {
                    const itemKey = item.projectCode ? `${item.projectCode}-${item.id}` : `#${item.id}`;
                    const statusColor = getStatusColor(item.statusCode || item.statusName);
                    const statusLabel = item.statusName || item.statusCode;
                    const overdue = isItemOverdue(item);

                    return (
                      <tr
                        key={item.id}
                        tabIndex={0}
                        role="row"
                        onClick={() => navigate(ROUTES.WORK_ITEM_DETAILS(item.id))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(ROUTES.WORK_ITEM_DETAILS(item.id));
                          }
                        }}
                        style={{
                          borderBottom: '1px solid var(--dash-border-subtle)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        className="dash-table-row"
                      >
                        {/* Key */}
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--dash-primary)',
                              background: 'var(--dash-primary-light)',
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            {itemKey}
                          </span>
                        </td>

                        {/* Title */}
                        <td style={{ padding: '8px 12px', maxWidth: 300 }}>
                          <span
                            style={{
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontWeight: 500,
                              color: 'var(--dash-text-primary)',
                            }}
                            title={item.title}
                          >
                            {item.title}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="dash-col-hide-mobile" style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: 'var(--dash-text-secondary)' }}>
                          {item.typeName || item.typeCode || 'Task'}
                        </td>

                        {/* Status Chip */}
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '2px 7px',
                              borderRadius: 4,
                              color: '#ffffff',
                              backgroundColor: statusColor,
                            }}
                          >
                            {statusLabel}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="dash-col-hide-tablet" style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                          {item.priorityName ? (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color:
                                  String(item.priorityCode).toUpperCase() === 'CRITICAL' ||
                                  String(item.priorityCode).toUpperCase() === 'HIGH'
                                    ? 'var(--dash-danger)'
                                    : 'var(--dash-text-secondary)',
                              }}
                            >
                              {item.priorityName}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Assignee */}
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: item.assigneeName ? 'var(--dash-text-primary)' : 'var(--dash-text-muted)' }}>
                          {item.assigneeName || 'Unassigned'}
                        </td>

                        {/* Story Points */}
                        <td className="dash-col-hide-mobile" style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <strong className="tabular-nums">
                            {item.storyPoints !== null && item.storyPoints !== undefined ? item.storyPoints : '—'}
                          </strong>
                        </td>

                        {/* Due Date */}
                        <td className="dash-col-hide-tablet" style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                          {item.dueDate ? (
                            <span
                              style={{
                                color: overdue ? 'var(--dash-danger)' : 'var(--dash-text-secondary)',
                                fontWeight: overdue ? 600 : 400,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Calendar size={11} />
                              {item.dueDate}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Updated At */}
                        <td className="dash-col-hide-tablet" style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap', color: 'var(--dash-text-muted)', fontSize: 11 }}>
                          {item.updatedAt ? String(item.updatedAt).slice(0, 10) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid var(--dash-border-subtle)',
                fontSize: 12,
                color: 'var(--dash-text-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>
                  Showing <strong className="tabular-nums">{startIndex + 1}</strong> to{' '}
                  <strong className="tabular-nums">{Math.min(startIndex + pageSize, totalItems)}</strong> of{' '}
                  <strong className="tabular-nums">{totalItems}</strong> items
                </span>

                <select
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    if (onPageSizeChange) {
                      onPageSizeChange(newSize);
                    }
                    setCurrentPage(1);
                  }}
                  style={{
                    height: 26,
                    fontSize: 12,
                    borderRadius: 4,
                    border: '1px solid var(--dash-border)',
                    background: 'var(--dash-card)',
                    color: 'var(--dash-text-primary)',
                    padding: '0 4px',
                  }}
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>

              {/* Page Buttons */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  style={{ height: 26, padding: '0 8px', fontSize: 11 }}
                >
                  Prev
                </button>

                <span style={{ padding: '0 6px', fontWeight: 600 }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  style={{ height: 26, padding: '0 8px', fontSize: 11 }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkItemsTable;

