import React from 'react';
import './StatusSummary.css';

const StatusSummary = ({ data, statusExtractor, showBuckets }) => {
  const buckets = {
    'To Do': 0,
    'In Progress': 0,
    'Done': 0,
    'Completed': 0,
    'Backlog': 0,
    'Active': 0,
    'Inactive': 0
  };

  if (data && data.length > 0) {
    data.forEach(item => {
      const statusStr = statusExtractor(item);
      const status = (statusStr || '').trim().toLowerCase();

      // Check if item has a user assigned
      const hasUser = 
        (item.user && Object.keys(item.user).length > 0) || 
        (item.assignedUser && item.assignedUser.trim() !== "" && item.assignedUser !== "-") ||
        item.assignee || 
        item.assignedTo;

      const isUnassigned = !hasUser;

      if (isUnassigned || status.includes('backlog')) {
        buckets['Backlog']++;
      } else if (status === 'active') {
        buckets['Active']++;
        buckets['In Progress']++; // Maintain fallback behavior for existing screens
      } else if (status === 'inactive') {
        buckets['Inactive']++;
      } else if (
        status.includes('done') || 
        status.includes('completed') || 
        status.includes('closed') || 
        status.includes('resolved')
      ) {
        buckets['Done']++;
        buckets['Completed']++; // Keep both updated just in case the prop specifically requests 'Completed'
      } else if (
        status.includes('progress') || 
        status.includes('working')
      ) {
        buckets['In Progress']++;
      } else if (
        status.includes('todo') || 
        status.includes('to do') || 
        status.includes('open') || 
        status.includes('new') ||
        status.includes('assigned')
      ) {
        buckets['To Do']++;
      } else {
        // Fallback for everything else (unknown) goes to Backlog
        buckets['Backlog']++;
      }
    });
  }

  // Define which buckets to render
  const renderBuckets = showBuckets || ['To Do', 'In Progress', 'Done', 'Backlog'];

  return (
    <div className="status-summary-badges">
      {renderBuckets.includes('Active') && <span className="summary-badge bg-green">Active: {buckets['Active']}</span>}
      {renderBuckets.includes('Inactive') && <span className="summary-badge bg-grey">Inactive: {buckets['Inactive']}</span>}
      {renderBuckets.includes('To Do') && <span className="summary-badge bg-grey">To Do: {buckets['To Do']}</span>}
      {renderBuckets.includes('In Progress') && <span className="summary-badge bg-blue">In Progress: {buckets['In Progress']}</span>}
      {(renderBuckets.includes('Done') || renderBuckets.includes('Completed')) && <span className="summary-badge bg-green">{renderBuckets.includes('Completed') ? 'Completed' : 'Done'}: {buckets['Done']}</span>}
      {renderBuckets.includes('Backlog') && <span className="summary-badge bg-red">Backlog: {buckets['Backlog']}</span>}
    </div>
  );
};

export default StatusSummary;
