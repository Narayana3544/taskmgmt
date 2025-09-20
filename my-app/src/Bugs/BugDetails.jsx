import React, { useEffect, useState } from "react";
import { useParams,useNavigate } from "react-router-dom";
import api from "../api";
import "./BugDetails.css";

export default function BugDetails() {
  const { id } = useParams(); // bugId
  const [bug, setBug] = useState(null);
  const navigate=useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`view-bug/${id}`, { withCredentials: true });
        setBug(res.data);
        console.log(res.data);
      } catch (err) {
        console.error("Error loading bug:", err);
      }
    };
    fetchData();
  }, [id]);

  if (!bug) return <p>Loading...</p>;

  const handleDownload = (attachmentId) => {
    window.location.href = `/bugs/${id}/attachments/${attachmentId}/download`;
  };

return (
  <div className="bug-details">
     <button className="back-btn" onClick={() => navigate(-1)}>⬅ Back</button>
    <div className="bug-card">
      <div className="bug-header">
        <h2>Bug #{bug.id} - {bug.title}</h2>
        <span className={`status-badge ${bug.status.toLowerCase().replace(" ", "-")}`}>
          {bug.status}
        </span>
      </div>

      <div className="bug-info-grid">
        <div>
            <strong>Priority:</strong>{" "}
            <span className={`priority-badge ${bug.priority?.toLowerCase()}`}>
                {bug.priority || "-"}
            </span>
            </div>
        <div><strong>Assigned To:</strong> {bug.assignee || "-"}</div>
        <div><strong>Reported By:</strong> {bug.reporter || "-"}</div>
      </div>

      <div className="bug-section">
        <h3>Description</h3>
        <p>{bug.description}</p>
      </div>

      <div className="bug-section">
        <h3>Attachments</h3>
        {bug.attachments.length > 0 ? (
          <ul>
            {bug.attachments.map(att => (
              <li key={att.id}>
                {att.fileName} ({new Date(att.uploadedAt).toLocaleString()})
                <button
                  className="download-btn"
                  onClick={() => handleDownload(att.id)}
                >
                  Download
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No attachments</p>
        )}
      </div>
    </div>
  </div>
);
}
