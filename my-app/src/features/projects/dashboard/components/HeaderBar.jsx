import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  ListTodo,
  Kanban,
  Download,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Clock,
  HelpCircle,
} from 'lucide-react';
import StatusBadge from '../../../../components/StatusBadge';
import { ROUTES } from '../../../../constants/routes';

/**
 * Enterprise Project Header Bar
 * Displays project identity, key, lifecycle status, project health badge,
 * last-updated timestamp with silent refresh indicator, and quick actions.
 */
const HeaderBar = ({
  project,
  health,
  lastUpdated,
  isRefreshing,
  onRefresh,
  onExportCsv,
  onPrintPdf,
}) => {
  const navigate = useNavigate();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showExportMenu]);

  if (!project) return null;

  // Resolve project status accurately (avoid empty "—" pills)
  const projectStatusCode = project.statusCode || (typeof project.status === 'string' ? project.status : '');
  const projectStatusLabel = project.statusName || (projectStatusCode ? projectStatusCode.replace(/_/g, ' ') : '');

  // Render appropriate health badge based on project health status
  const renderHealthBadge = () => {
    if (!health) return null;

    if (health.status === 'NO_ACTIVE_SPRINT') {
      return (
        <span
          className="dash-badge dash-badge-health-neutral"
          title={health.reason || 'No sprint is currently marked ACTIVE for this project.'}
          style={{ cursor: 'help' }}
        >
          <HelpCircle size={13} style={{ flexShrink: 0 }} />
          <span>No active sprint</span>
        </span>
      );
    }

    if (health.status === 'DELAYED') {
      return (
        <span
          className="dash-badge dash-badge-health-delayed"
          title={health.reason || 'Project delivery is delayed'}
          style={{ cursor: 'help' }}
        >
          <AlertCircle size={13} style={{ flexShrink: 0 }} />
          <span>Delayed</span>
        </span>
      );
    }

    if (health.status === 'AT_RISK') {
      return (
        <span
          className="dash-badge dash-badge-health-at-risk"
          title={health.reason || 'Project delivery is at risk'}
          style={{ cursor: 'help' }}
        >
          <AlertTriangle size={13} style={{ flexShrink: 0 }} />
          <span>At Risk</span>
        </span>
      );
    }

    // Default / Healthy
    return (
      <span
        className="dash-badge dash-badge-health-on-track"
        title={health.reason || 'Project is progressing on track'}
        style={{ cursor: 'help' }}
      >
        <ShieldCheck size={13} style={{ flexShrink: 0 }} />
        <span>On Track</span>
      </span>
    );
  };

  return (
    <div className="dash-card" style={{ marginBottom: 16, padding: '16px 20px' }}>
      <div className="dash-header-wrap">
        {/* Left: Project identity & context */}
        <div className="dash-header-info">
          {/* Top row: Back to projects, project code, status, health badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(ROUTES.PROJECTS)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                height: 26,
                padding: '0 8px',
                fontSize: 12,
                cursor: 'pointer',
              }}
              title="Return to projects list"
            >
              <ArrowLeft size={13} style={{ flexShrink: 0 }} />
              <span>Projects</span>
            </button>

            {/* Project Key Badge */}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: 'var(--dash-primary)',
                background: 'var(--dash-primary-light)',
                padding: '3px 8px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
              }}
              title={`Project Key: ${project.code}`}
            >
              {project.code}
            </span>

            {/* Project Status Badge - Render only when status exists */}
            {projectStatusCode && (
              <StatusBadge code={projectStatusCode} label={projectStatusLabel} size="sm" />
            )}

            {/* Project Health Badge */}
            {renderHealthBadge()}

            {/* Last updated timestamp */}
            {lastUpdated && (
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--dash-text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginLeft: 4,
                  whiteSpace: 'nowrap',
                }}
                title="Auto-refreshes every 60s while browser tab is active"
              >
                <Clock size={12} style={{ flexShrink: 0 }} />
                <span>Updated {lastUpdated}</span>
              </span>
            )}
          </div>

          {/* Project Name (with truncation + title tooltip) */}
          <h1
            className="dash-header-title"
            title={project.name}
          >
            {project.name}
          </h1>

          {/* Description (with truncation + title tooltip) */}
          {project.description && (
            <p
              className="dash-header-desc"
              title={project.description}
            >
              {project.description}
            </p>
          )}
        </div>

        {/* Right: Quick actions toolbar */}
        <div className="dash-header-actions">
          {/* Manual Refresh Button with Spinner */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 32,
              padding: '0 12px',
              fontSize: 13,
              cursor: isRefreshing ? 'wait' : 'pointer',
            }}
            title="Refresh dashboard metrics (auto-refreshes every 60s)"
          >
            <RefreshCw
              size={13}
              className={isRefreshing ? 'dash-spin' : ''}
              style={{ flexShrink: 0 }}
            />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Work Items Navigation */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`${ROUTES.WORK_ITEMS}?projectId=${project.id}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 32,
              padding: '0 12px',
              fontSize: 13,
              cursor: 'pointer',
            }}
            title="Open project work items list"
          >
            <ListTodo size={14} style={{ flexShrink: 0 }} />
            <span>Work Items</span>
          </button>

          {/* Kanban Board Navigation */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`${ROUTES.KANBAN}?projectId=${project.id}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 32,
              padding: '0 12px',
              fontSize: 13,
              cursor: 'pointer',
            }}
            title="Open project Kanban board"
          >
            <Kanban size={14} style={{ flexShrink: 0 }} />
            <span>Kanban Board</span>
          </button>

          {/* Export Actions Menu (Step G) */}
          <div ref={exportMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowExportMenu((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 32,
                padding: '0 12px',
                fontSize: 13,
                cursor: 'pointer',
              }}
              title="Export filtered data or print manager summary"
              aria-expanded={showExportMenu}
            >
              <Download size={14} style={{ flexShrink: 0 }} />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 4,
                  background: 'var(--dash-card)',
                  border: '1px solid var(--dash-border)',
                  borderRadius: 'var(--dash-radius-sm)',
                  boxShadow: 'var(--dash-shadow-hover)',
                  zIndex: 50,
                  minWidth: 200,
                  padding: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    if (onExportCsv) onExportCsv();
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: 12,
                    color: 'var(--dash-text-primary)',
                    cursor: 'pointer',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dash-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <FileSpreadsheet size={14} color="var(--dash-success)" />
                  <span>Export CSV (Filtered)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    if (onPrintPdf) onPrintPdf();
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: 12,
                    color: 'var(--dash-text-primary)',
                    cursor: 'pointer',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dash-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Printer size={14} color="var(--dash-primary)" />
                  <span>Print / Save as PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderBar;

