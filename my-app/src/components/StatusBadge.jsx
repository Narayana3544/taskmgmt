import React from 'react';

const STATUS_MAP = {
    ACTIVE: 'badge-success',
    APPROVED: 'badge-success',
    DONE: 'badge-success',
    COMPLETED: 'badge-success',
    IN_PROGRESS: 'badge-warning',
    OPEN: 'badge-warning',
    PENDING: 'badge-warning',
    SUBMITTED: 'badge-warning',
    DRAFT: 'badge-info',
    PLANNED: 'badge-info',
    BACKLOG: 'badge-default',
    CLOSED: 'badge-default',
    INACTIVE: 'badge-default',
    REJECTED: 'badge-danger',
    CANCELLED: 'badge-danger',
    CRITICAL: 'badge-danger',
    HIGH: 'badge-danger',
    ON_HOLD: 'badge-warning',
    APPLIED: 'badge-info',
    MEDIUM: 'badge-info',
    LOW: 'badge-success',
};

const StatusBadge = ({ code, label, className = '' }) => {
    const badgeClass = STATUS_MAP[code] || 'badge-default';
    return (
        <span className={`badge ${badgeClass} ${className}`}>
            {label || code || '—'}
        </span>
    );
};

export default StatusBadge;
