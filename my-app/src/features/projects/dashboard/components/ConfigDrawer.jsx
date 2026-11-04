import React, { useState, useMemo } from 'react';
import {
  Database,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Shield,
  Layers,
  Code,
  PlusCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  getStatusMeta,
  normalizeStatusCode,
} from '../dashboardUtils';
import { getUserRole } from '../../../../utils/user';

/**
 * Escape single quotes in string values for safe PostgreSQL statement insertion
 */
const escapeSql = (str = '') => String(str).replace(/'/g, "''");

/**
 * Enterprise Dynamic Status Engine & Database Configuration Drawer
 * - Restricted: Visible only to Administrators
 * - Collapsible at the bottom of the dashboard (collapsed by default)
 * - Displays active master-data statuses in sortOrder
 * - Generates idempotent PostgreSQL insert statements for runtime status additions
 */
const ConfigDrawer = ({ masterStatuses = [] }) => {
  const userRole = getUserRole();
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'generator' | 'fullSeed'
  const [copied, setCopied] = useState(false);

  // New Status Generator state (starts completely empty)
  const [newCode, setNewCode] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newSortOrder, setNewSortOrder] = useState('');
  const [newCategory, setNewCategory] = useState('IN_FLIGHT');
  const [newDescription, setNewDescription] = useState('');

  // Validation
  const trimmedCode = newCode.trim().toUpperCase();
  const codeFormatRegex = /^[A-Z0-9_]+$/;

  let codeError = null;
  if (trimmedCode) {
    if (!codeFormatRegex.test(trimmedCode)) {
      codeError = 'Uppercase letters, digits, and underscores only.';
    } else {
      const isClash = masterStatuses.some(
        (s) => normalizeStatusCode(s).toUpperCase() === trimmedCode
      );
      if (isClash) {
        codeError = `Status code "${trimmedCode}" already exists. Please choose a unique code.`;
      }
    }
  }

  const isCodeValid = Boolean(trimmedCode) && !codeError;
  const isDisplayNameValid = Boolean(newDisplayName.trim());
  const isSortOrderValid =
    newSortOrder !== '' && !isNaN(Number(newSortOrder)) && Number(newSortOrder) >= 0;
  const isFormValid = isCodeValid && isDisplayNameValid && isSortOrderValid;

  // Generate single insert SQL (only runnable when form is valid)
  const singleInsertSql = useMemo(() => {
    if (!isFormValid) {
      return '-- Please fill in the status code, display name, and sort order above to generate runnable SQL.';
    }

    const code = escapeSql(trimmedCode);
    const name = escapeSql(newDisplayName.trim());
    const desc = escapeSql(newDescription.trim() || 'Dynamic lifecycle stage');
    const sort = Number(newSortOrder);

    return `-- Idempotent PostgreSQL Master Data Registration
-- Target: PostgreSQL 17 / Task Management Schema
BEGIN;

-- 1. Ensure master_type exists
INSERT INTO master_type (organization_id, code, name, description, active, created_at)
VALUES (1, 'WORK_ITEM_STATUS', 'Work Item Status', 'Dynamic work item lifecycle statuses', true, NOW())
ON CONFLICT (code) DO NOTHING;

-- 2. Register dynamic status value
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, '${code}', '${name}', '${desc}', ${sort}, false, true, NOW()
FROM master_type mt WHERE mt.code = 'WORK_ITEM_STATUS'
ON CONFLICT (master_type_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    sort_order = EXCLUDED.sort_order,
    active = true;

COMMIT;`;
  }, [isFormValid, trimmedCode, newDisplayName, newDescription, newSortOrder]);

  // Generate full batch insert SQL for all configured statuses
  const fullSeedSql = useMemo(() => {
    const valueInserts = masterStatuses
      .map((s) => {
        const code = escapeSql(normalizeStatusCode(s));
        const name = escapeSql(s.displayName || code);
        const sort = s.sortOrder !== undefined ? Number(s.sortOrder) : 99;
        const isDef = s.isDefault ? 'true' : 'false';
        return `SELECT mt.id, '${code}', '${name}', NULL, ${sort}, ${isDef}, true, NOW() FROM master_type mt WHERE mt.code = 'WORK_ITEM_STATUS'`;
      })
      .join('\nUNION ALL\n');

    return `-- Full Master Statuses Idempotent Seed Script
BEGIN;

INSERT INTO master_type (organization_id, code, name, description, active, created_at)
VALUES (1, 'WORK_ITEM_STATUS', 'Work Item Status', 'Dynamic work item lifecycle statuses', true, NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
${valueInserts || "SELECT mt.id, 'OPEN', 'Open', NULL, 1, true, true, NOW() FROM master_type mt WHERE mt.code = 'WORK_ITEM_STATUS'"}
ON CONFLICT (master_type_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    sort_order = EXCLUDED.sort_order,
    active = true;

COMMIT;`;
  }, [masterStatuses]);

  const handleCopySql = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If not admin, do not render drawer at all
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="dash-card dash-col-12 dash-config-drawer" style={{ marginTop: 8 }}>
      {/* Drawer Header (Clickable Collapse / Expand) */}
      <div
        className="dash-card-header"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          paddingBottom: isOpen ? 12 : 0,
          borderBottom: isOpen ? '1px solid var(--dash-border-subtle)' : 'none',
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        aria-expanded={isOpen}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Database size={16} color="var(--dash-primary)" />
          <h3 className="dash-card-title" style={{ margin: 0 }}>
            Dynamic Status Engine & Schema Tools
          </h3>
          <span
            className="dash-badge dash-badge-health-neutral"
            style={{ fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <Shield size={10} /> Administrator
          </span>
          <span style={{ fontSize: 12, color: 'var(--dash-text-muted)' }}>
            ({masterStatuses.length} dynamic stages active)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--dash-text-secondary)' }}>
            {isOpen ? 'Collapse' : 'Expand Config'}
          </span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Drawer Body */}
      {isOpen && (
        <div style={{ marginTop: 14 }}>
          {/* Subtabs Bar */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              borderBottom: '1px solid var(--dash-border)',
              paddingBottom: 8,
              marginBottom: 16,
            }}
          >
            <button
              type="button"
              className={`dash-sort-pill ${activeTab === 'list' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('list')}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              <Layers size={13} /> Active Status Schema ({masterStatuses.length})
            </button>
            <button
              type="button"
              className={`dash-sort-pill ${activeTab === 'generator' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('generator')}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              <PlusCircle size={13} /> Add Status (SQL Generator)
            </button>
            <button
              type="button"
              className={`dash-sort-pill ${activeTab === 'fullSeed' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('fullSeed')}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              <Code size={13} /> Full Database Seed Script
            </button>
          </div>

          {/* TAB 1: Current Master Statuses Table */}
          {activeTab === 'list' && (
            <div>
              <p style={{ margin: '0 0 12px 0', fontSize: 13, color: 'var(--dash-text-secondary)' }}>
                These statuses are dynamically loaded from PostgreSQL master-data (<code>WORK_ITEM_STATUS</code>).
                Their display order in the Pipeline stacked bar, Donut slices, and Table chips strictly matches their <code>sortOrder</code>.
              </p>
              <div className="dash-table-wrap">
                <table className="dash-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--dash-bg)', borderBottom: '1px solid var(--dash-border)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Sort Order</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Status Code</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Display Name</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Assigned Color</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Semantic Category</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Lifecycle State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterStatuses.map((ms) => {
                      const code = normalizeStatusCode(ms);
                      const meta = getStatusMeta(code, ms.displayName);
                      const group = meta.group || 'OTHER';

                      return (
                        <tr key={code} style={{ borderBottom: '1px solid var(--dash-border-subtle)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 700 }}>
                            #{ms.sortOrder !== undefined ? ms.sortOrder : '—'}
                          </td>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600 }}>
                            {code}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            {ms.displayName || meta.label}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: 3,
                                  backgroundColor: meta.color,
                                  border: '1px solid rgba(0,0,0,0.1)',
                                }}
                              />
                              <code>{meta.color}</code>
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span className="dash-kpi-pill dash-kpi-pill-neutral" style={{ fontSize: 11 }}>
                              {group}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', color: 'var(--dash-text-muted)' }}>
                            {meta.isCompleted ? '✓ Completed' : meta.isInFlight ? '⚡ In Flight' : '📋 Intake / Backlog'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Dynamic Status SQL Generator */}
          {activeTab === 'generator' && (
            <div>
              <p style={{ margin: '0 0 14px 0', fontSize: 13, color: 'var(--dash-text-secondary)' }}>
                Configure a new status below. The generator produces a safe, idempotent PostgreSQL migration script
                that matches your database schema. Copy and execute it in your database tool.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                  marginBottom: 16,
                  padding: 14,
                  background: 'var(--dash-bg)',
                  borderRadius: 'var(--dash-radius-sm)',
                  border: '1px solid var(--dash-border)',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    STATUS CODE (UPPERCASE) *
                  </label>
                  <input
                    type="text"
                    className="dash-filter-select"
                    style={{
                      width: '100%',
                      maxWidth: 'none',
                      backgroundImage: 'none',
                      padding: '0 8px',
                      borderColor: codeError ? 'var(--dash-danger)' : undefined,
                    }}
                    placeholder="e.g. READY_FOR_UAT"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  />
                  {codeError && (
                    <div style={{ color: 'var(--dash-danger)', fontSize: 11, marginTop: 4, fontWeight: 500 }}>
                      {codeError}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    DISPLAY NAME *
                  </label>
                  <input
                    type="text"
                    className="dash-filter-select"
                    style={{ width: '100%', maxWidth: 'none', backgroundImage: 'none', padding: '0 8px' }}
                    placeholder="e.g. Ready for UAT"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    SORT ORDER *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="dash-filter-select"
                    style={{ width: '100%', maxWidth: 'none', backgroundImage: 'none', padding: '0 8px' }}
                    placeholder="e.g. 10"
                    value={newSortOrder}
                    onChange={(e) => setNewSortOrder(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    SEMANTIC CATEGORY
                  </label>
                  <select
                    className="dash-filter-select"
                    style={{ width: '100%', maxWidth: 'none' }}
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="BACKLOG">Backlog (Intake)</option>
                    <option value="OPEN">Open (Ready for Work)</option>
                    <option value="IN_FLIGHT">In Flight (Active Progress / Review / Staging)</option>
                    <option value="COMPLETED">Completed (Done / Production)</option>
                    <option value="REOPENED">Risk / Rework</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    DESCRIPTION / NOTES
                  </label>
                  <input
                    type="text"
                    className="dash-filter-select"
                    style={{ width: '100%', maxWidth: 'none', backgroundImage: 'none', padding: '0 8px' }}
                    placeholder="e.g. Dynamic lifecycle stage"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Visible Advisory Note */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'var(--dash-info-light)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  color: 'var(--dash-text-primary)',
                  fontSize: 12,
                  marginBottom: 12,
                }}
              >
                <AlertTriangle size={15} color="var(--dash-warning)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Note:</strong> Run on dev first. New statuses also appear in Work Item dropdowns and the Kanban board.
                </span>
              </div>

              {/* Code Output Box */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--dash-text-secondary)' }}>
                    Generated PostgreSQL Statement:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!isFormValid && (
                      <span style={{ fontSize: 11, color: 'var(--dash-text-muted)', fontStyle: 'italic' }}>
                        Fill in code and label to copy
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={!isFormValid}
                      onClick={() => isFormValid && handleCopySql(singleInsertSql)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        opacity: isFormValid ? 1 : 0.5,
                        cursor: isFormValid ? 'pointer' : 'not-allowed',
                      }}
                      title={isFormValid ? 'Copy SQL Statement' : 'Fill in code and label first'}
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copied ? 'Copied!' : 'Copy SQL Statement'}</span>
                    </button>
                  </div>
                </div>

                <pre
                  style={{
                    background: 'var(--dash-bg)',
                    border: '1px solid var(--dash-border)',
                    borderRadius: 6,
                    padding: 14,
                    fontSize: 12,
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    overflowX: 'auto',
                    margin: 0,
                    color: 'var(--dash-text-primary)',
                    lineHeight: 1.5,
                  }}
                >
                  {singleInsertSql}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: Full Seed Script */}
          {activeTab === 'fullSeed' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--dash-text-secondary)' }}>
                  Complete idempotent script for all {masterStatuses.length} registered statuses:
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopySql(fullSeedSql)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copied!' : 'Copy Full Script'}</span>
                </button>
              </div>

              <pre
                style={{
                  background: 'var(--dash-bg)',
                  border: '1px solid var(--dash-border)',
                  borderRadius: 6,
                  padding: 14,
                  fontSize: 12,
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  maxHeight: 300,
                  overflowY: 'auto',
                  margin: 0,
                  color: 'var(--dash-text-primary)',
                  lineHeight: 1.5,
                }}
              >
                {fullSeedSql}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConfigDrawer;
