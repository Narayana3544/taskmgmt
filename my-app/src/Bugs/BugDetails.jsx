import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "../Task/TaskForm.css";

export default function BugDetails() {
  const { id } = useParams();
  const [bug, setBug] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`view-bug/${id}`, { withCredentials: true });
        setBug(res.data);
      } catch (err) {
        console.error("Error loading bug:", err);
      }
    };
    fetchData();
  }, [id]);

  const handleDownload = (attachmentId) => {
    window.location.href = `${api.defaults.baseURL}/attachments/${attachmentId}/download`;
  };

  if (!bug) return <p>Loading...</p>;

  return (
    <div className="task-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '15px' }}>

      {/* Row 1: Title · Status · Priority · Assigned To */}
      <div className="form-group" style={{ gridColumn: 'span 6', marginBottom: 0 }}>
        <label>Bug Title</label>
        <input type="text" readOnly value={`#${bug.id} - ${bug.title}`} style={{ fontWeight: 600 }} />
      </div>
      <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
        <label>Status</label>
        <input type="text" readOnly value={bug.status || "-"} style={{ fontWeight: 600, color: '#1a71e2' }} />
      </div>
      <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
        <label>Priority</label>
        <input type="text" readOnly value={bug.priority || "-"} />
      </div>
      <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
        <label>Assigned To</label>
        <input type="text" readOnly value={bug.assignee || bug.assignedUser || "-"} />
      </div>

      {/* Row 2: Reporter */}
      <div className="form-group" style={{ gridColumn: 'span 12', marginBottom: 0 }}>
        <label>Reporter</label>
        <input type="text" readOnly value={bug.reporter || "-"} />
      </div>

      {/* Row 3: Description */}
      <div className="form-group" style={{ gridColumn: 'span 12', marginBottom: 0 }}>
        <label>Description</label>
        <textarea readOnly rows={3} style={{ padding: '8px', resize: 'none' }} value={bug.description || "-"} />
      </div>

      {/* Row 4: Attachments */}
      <div className="form-group" style={{ gridColumn: 'span 12', marginBottom: 0 }}>
        <label>Attachments</label>
        {bug.attachments && bug.attachments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {bug.attachments.map(att => (
              <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px' }}>📎 {att.fileName} ({new Date(att.uploadedAt).toLocaleString()})</span>
                <button className="btn-global btn-primary" onClick={() => handleDownload(att.id)} style={{ padding: '3px 10px', fontSize: '12px' }}>
                  Download
                </button>
              </div>
            ))}
          </div>
        ) : (
          <input type="text" readOnly value="No attachments" />
        )}
      </div>

      {/* Buttons */}
      <div style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '5px' }}>
        <button type="button" className="btn-global btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  );
}