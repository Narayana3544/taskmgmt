import React from 'react';

const STATUS_MAP = {
    ACTIVE: 'badge-success',
    APPROVED: 'badge-success',
    DONE: 'badge-success',
    COMPLETED: 'badge-success',
    MOVED_TO_PRODUCTION: 'badge-success',
    PROD_DEPLOYMENT: 'badge-success',
    FIXED: 'badge-success',
    IN_PROGRESS: 'badge-warning',
    OPEN: 'badge-info',
    PENDING: 'badge-warning',
    SUBMITTED: 'badge-warning',
    DRAFT: 'badge-info',
    PLANNED: 'badge-info',
    BACKLOG: 'badge-default',
    CLOSED: 'badge-default',
    INACTIVE: 'badge-default',
    REJECTED: 'badge-danger',
    CANCELLED: 'badge-danger',
    REOPEN: 'badge-danger',
    REOPENED: 'badge-danger',
    CRITICAL: 'badge-danger',
    HIGH: 'badge-danger',
    ON_HOLD: 'badge-warning',
    APPLIED: 'badge-info',
    MEDIUM: 'badge-info',
    LOW: 'badge-success',
    MOVED_TO_TEST_DEPLOYMENT: 'badge-warning',
    TEST_DEPLOYMENT: 'badge-warning',
    IN_TESTING: 'badge-warning',
    QA: 'badge-warning',
    NON_ALLOCATED: 'badge-danger',
    UNASSIGNED: 'badge-danger',
};

const resolveBadgeClass = (code) => {
    if (!code) return 'badge-default';
    const c = String(code).toUpperCase().trim();
    if (STATUS_MAP[c]) return STATUS_MAP[c];
    if (c.includes('DONE') || c.includes('PROD') || c.includes('FIX')) return 'badge-success';
    if (c.includes('REOPEN') || c.includes('FAIL') || c.includes('REJECT')) return 'badge-danger';
    if (c.includes('TEST') || c.includes('PROGRESS') || c.includes('REVIEW')) return 'badge-warning';
    if (c.includes('OPEN') || c.includes('NEW') || c.includes('BACKLOG')) return 'badge-info';
    return 'badge-default';
};

const StatusBadge = ({ code, label, className = '' }) => {
    const badgeClass = resolveBadgeClass(code);
    return (
        <span className={`badge ${badgeClass} ${className}`}>
            {label || code || '—'}
        </span>
    );
};

export default StatusBadge;
