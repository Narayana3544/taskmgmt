import React, { useState, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  DASHBOARD_CONFIG,
  normalizeStatusCode,
  getStatusMeta,
  getStatusColor,
} from '../dashboardUtils';

/**
 * Deterministic avatar background generator based on member name
 */
const AVATAR_COLORS = [
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#7C3AED', // Purple
  '#0891B2', // Cyan
  '#DB2777', // Pink
  '#4B5563', // Gray
];

const getAvatarColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitials = (name = '') => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Enterprise Team Workload & Capacity Component
 * - Displays all project members joined with work items
 * - Capacity overload detection on OPEN items/SP (>8 items or >20 SP)
 * - Stacked progress breakdown (done / in flight / other open)
 * - Sortable by open items, story points, or member name
 * - Interactive: Clicking sets { assigneeId } cross-widget filter
 */
const TeamWorkload = ({
  members = [],
  items = [],
  selectedAssigneeId = null,
  onSelectAssignee,
}) => {
  const [sortBy, setSortBy] = useState('openItems'); // 'openItems' | 'storyPoints' | 'name'

  // Precompute workload stats for each member
  const memberWorkloads = useMemo(() => {
    // Map items by assigneeId
    const itemsByAssignee = new Map();
    (items || []).forEach((item) => {
      if (item.assigneeId) {
        const id = Number(item.assigneeId);
        if (!itemsByAssignee.has(id)) {
          itemsByAssignee.set(id, []);
        }
        itemsByAssignee.get(id).push(item);
      }
    });

    return (members || []).map((m) => {
      const uId = Number(m.userId || m.id);
      const assigned = itemsByAssignee.get(uId) || [];

      let doneCount = 0;
      let inFlightCount = 0;
      let otherOpenCount = 0;
      let openCount = 0;

      let doneSP = 0;
      let openSP = 0;
      let totalSP = 0;

      assigned.forEach((item) => {
        const sp = Number(item.storyPoints) || 0;
        totalSP += sp;

        const meta = getStatusMeta(normalizeStatusCode(item));
        if (meta.isCompleted) {
          doneCount++;
          doneSP += sp;
        } else {
          openCount++;
          openSP += sp;
          if (meta.isInFlight) {
            inFlightCount++;
          } else {
            otherOpenCount++;
          }
        }
      });

      // Overload check applies ONLY to OPEN work (exclude finished items)
      const isOverloaded =
        openCount > DASHBOARD_CONFIG.MEMBER_OVERLOAD_MAX_ITEMS ||
        openSP > DASHBOARD_CONFIG.MEMBER_OVERLOAD_MAX_SP;

      return {
        id: uId,
        name: m.userName || m.fullName || m.name || 'Team Member',
        email: m.userEmail || m.email || '',
        role:
          m.roleName ||
          m.responsibilityName ||
          m.projectRoleName ||
          m.projectRole ||
          m.role ||
          'Member',
        totalItems: assigned.length,
        openCount,
        doneCount,
        inFlightCount,
        otherOpenCount,
        openSP,
        doneSP,
        totalSP,
        isOverloaded,
        items: assigned,
      };
    });
  }, [members, items]);

  // Sort workload
  const sortedMembers = useMemo(() => {
    const list = [...memberWorkloads];
    if (sortBy === 'openItems') {
      return list.sort((a, b) => b.openCount - a.openCount || b.openSP - a.openSP);
    }
    if (sortBy === 'storyPoints') {
      return list.sort((a, b) => b.openSP - a.openSP || b.openCount - a.openCount);
    }
    if (sortBy === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [memberWorkloads, sortBy]);

  const selectedMember =
    selectedAssigneeId !== null
      ? memberWorkloads.find((m) => Number(m.id) === Number(selectedAssigneeId))
      : null;

  const handleRowClick = (assigneeId) => {
    if (typeof onSelectAssignee === 'function') {
      const nextId =
        Number(selectedAssigneeId) === Number(assigneeId) ? null : assigneeId;
      onSelectAssignee(nextId);
    }
  };

  const handleKeyDown = (e, assigneeId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRowClick(assigneeId);
    }
  };

  const overloadedCount = memberWorkloads.filter((m) => m.isOverloaded).length;

  return (
    <div className="dash-card dash-col-6" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header: Title, Sort controls & Active filter chip */}
      <div className="dash-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h3 className="dash-card-title">
            <Users size={16} color="var(--dash-primary)" />
            Team Workload & Capacity
          </h3>
          <span style={{ fontSize: 12, color: 'var(--dash-text-muted)', marginLeft: 2 }}>
            {members.length} members
          </span>
          {overloadedCount > 0 && (
            <span
              className="dash-workload-overload-badge"
              style={{ fontSize: 10 }}
              title={`${overloadedCount} member(s) exceed open workload threshold`}
            >
              <AlertTriangle size={11} />
              {overloadedCount} overloaded
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {selectedAssigneeId && selectedMember && (
            <button
              type="button"
              className="dash-filter-chip"
              onClick={() => handleRowClick(selectedAssigneeId)}
              title="Click to clear member filter"
            >
              <span>{selectedMember.name}</span>
              <X size={12} />
            </button>
          )}

          {/* Sort controls */}
          <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--dash-text-muted)' }}>Sort:</span>
            <button
              type="button"
              className={`dash-sort-pill ${sortBy === 'openItems' ? 'is-active' : ''}`}
              onClick={() => setSortBy('openItems')}
              title="Sort by open items"
            >
              Open Items
            </button>
            <button
              type="button"
              className={`dash-sort-pill ${sortBy === 'storyPoints' ? 'is-active' : ''}`}
              onClick={() => setSortBy('storyPoints')}
              title="Sort by open story points"
            >
              SP
            </button>
            <button
              type="button"
              className={`dash-sort-pill ${sortBy === 'name' ? 'is-active' : ''}`}
              onClick={() => setSortBy('name')}
              title="Sort alphabetically"
            >
              Name
            </button>
          </div>
        </div>
      </div>

      {/* Member rows list */}
      <div
        className="dash-workload-list"
        role="region"
        aria-label={`Team workload list with ${sortedMembers.length} members`}
      >
        {sortedMembers.length === 0 ? (
          <div
            style={{
              padding: '30px 16px',
              textAlign: 'center',
              color: 'var(--dash-text-muted)',
              fontSize: 13,
            }}
          >
            No team members assigned to this project yet.
          </div>
        ) : (
          sortedMembers.map((member) => {
            const isSelected = Number(selectedAssigneeId) === Number(member.id);
            const total = member.totalItems;

            // Micro-bar widths
            const donePercent = total > 0 ? (member.doneCount / total) * 100 : 0;
            const inFlightPercent = total > 0 ? (member.inFlightCount / total) * 100 : 0;
            const openPercent = total > 0 ? (member.otherOpenCount / total) * 100 : 0;

            return (
              <div
                key={member.id}
                tabIndex={0}
                role="button"
                aria-label={`${member.name}, ${member.role}: ${member.openCount} open items, ${member.openSP} open story points. ${member.isOverloaded ? 'Capacity overloaded.' : ''} Click to filter.`}
                className={`dash-workload-row ${isSelected ? 'is-selected' : ''}`}
                onClick={() => handleRowClick(member.id)}
                onKeyDown={(e) => handleKeyDown(e, member.id)}
                title={`${member.name} (${member.role})${member.email ? ` · ${member.email}` : ''}\nOpen: ${member.openCount} items (${member.openSP} SP)\nCompleted: ${member.doneCount} items\nTotal: ${member.totalItems} items (${member.totalSP} SP)${member.isOverloaded ? '\n⚠ Overloaded: exceeds capacity threshold' : ''}`}
              >
                {/* Avatar with Initials */}
                <div
                  className="dash-workload-avatar"
                  style={{ backgroundColor: getAvatarColor(member.name) }}
                >
                  {getInitials(member.name)}
                </div>

                {/* Member Identity & Role */}
                <div className="dash-workload-info">
                  <span className="dash-workload-name" title={member.name}>
                    {member.name}
                  </span>
                  <span className="dash-workload-role" title={`${member.role}${member.email ? ` · ${member.email}` : ''}`}>
                    {member.role}
                  </span>
                </div>

                {/* Stacked Progress Bar (Done / In Progress / Open) */}
                <div className="dash-workload-bars">
                  <div
                    className="dash-workload-bar-track"
                    title={`Done: ${member.doneCount} · In Progress: ${member.inFlightCount} · Open: ${member.otherOpenCount}`}
                  >
                    {donePercent > 0 && (
                      <div
                        style={{
                          width: `${donePercent}%`,
                          backgroundColor: getStatusColor('DONE'),
                          transition: 'width 0.3s ease',
                        }}
                      />
                    )}
                    {inFlightPercent > 0 && (
                      <div
                        style={{
                          width: `${inFlightPercent}%`,
                          backgroundColor: getStatusColor('IN_PROGRESS'),
                          transition: 'width 0.3s ease',
                        }}
                      />
                    )}
                    {openPercent > 0 && (
                      <div
                        style={{
                          width: `${openPercent}%`,
                          backgroundColor: getStatusColor('OPEN'),
                          transition: 'width 0.3s ease',
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Counts & Story Points */}
                <div className="dash-workload-stats">
                  <div>
                    <strong className="tabular-nums" style={{ color: 'var(--dash-text-primary)' }}>
                      {member.openCount}
                    </strong>
                    <span style={{ fontSize: 11, color: 'var(--dash-text-muted)', marginLeft: 3 }}>
                      open
                    </span>
                  </div>

                  <span style={{ color: 'var(--dash-border)' }}>|</span>

                  <div style={{ minWidth: 42, textAlign: 'right' }}>
                    <strong className="tabular-nums" style={{ color: 'var(--dash-text-primary)' }}>
                      {member.openSP}
                    </strong>
                    <span style={{ fontSize: 11, color: 'var(--dash-text-muted)', marginLeft: 2 }}>
                      SP
                    </span>
                  </div>

                  {/* Overload Warning Badge */}
                  {member.isOverloaded ? (
                    <span
                      className="dash-workload-overload-badge"
                      title={`Capacity warning: ${member.openCount} open items (> ${DASHBOARD_CONFIG.MEMBER_OVERLOAD_MAX_ITEMS}) or ${member.openSP} open SP (> ${DASHBOARD_CONFIG.MEMBER_OVERLOAD_MAX_SP})`}
                    >
                      <AlertTriangle size={11} />
                      Overload
                    </span>
                  ) : (
                    <span style={{ width: 62 }} /> // Spacer for column alignment
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer capacity info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--dash-text-muted)', paddingTop: 10, marginTop: 10, borderTop: '1px solid var(--dash-border-subtle)' }}>
        <span>Threshold: &gt; {DASHBOARD_CONFIG.MEMBER_OVERLOAD_MAX_ITEMS} open items or &gt; {DASHBOARD_CONFIG.MEMBER_OVERLOAD_MAX_SP} open SP</span>
        <span>Click member to filter work items</span>
      </div>
    </div>
  );
};

export default TeamWorkload;
