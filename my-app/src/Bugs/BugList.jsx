import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import api from "../api";
import { ToastContainer, toast } from "react-toastify";
import { sortLatestFirst } from "../utils/sortUtils";
import "react-toastify/dist/ReactToastify.css";
import "./BugList.css";

export default function BugList() {
  const navigate = useNavigate();
  const [bugs, setBugs] = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    const fetchBugs = async () => {
      try {
        const res = await api.get(`/view-bugs`, { withCredentials: true });
        setBugs(sortLatestFirst(res.data));
      } catch (err) {
        console.error("Error fetching bugs:", err);
      }
    };

    const fetchStatuses = async () => {
      try {
        const res = await api.get("/getstatusForTask", { withCredentials: true });
        setStatuses(res.data || []);
      } catch (err) {
        console.error("Error fetching statuses:", err);
      }
    };

    fetchBugs();
    fetchStatuses();
  }, []);

  // Handle status change
  const handleStatusChange = async (bugId, newStatusId) => {
    try {
      await api.put(`/bugs/${bugId}/status/${newStatusId}`, null, { withCredentials: true });

      // Update local state
      setBugs((prevBugs) =>
        prevBugs.map((b) =>
          b.id === bugId ? { ...b, status: statuses.find(s => s.id === parseInt(newStatusId)) } : b
        )
      );

      // Show success toast
      toast.success("Status updated successfully!");
    } catch (err) {
      console.error("Error updating bug status:", err);
      toast.error("Failed to update status.");
    }
  };

  return (
    <div className="features-list-page">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <div className="task-table-container">
        <div className="table-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>All Bugs</h2>
          </div>
          <table className="bug-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Reported By</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bugs.map((bug) => (
                <tr key={bug.id}>
                  <td>{bug.id}</td>
                  <td>{bug.title}</td>
                  <td>{bug.priority?.description || bug.priority?.name}</td>
                  <td>
                    <select
                      value={bug.status?.id || ""}
                      onChange={(e) => handleStatusChange(bug.id, e.target.value)}
                      style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      {statuses.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.decription || s.description || s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{bug.assignedUser?.first_name || bug.assignedUser?.name}</td>
                  <td>{bug.reportedUser?.first_name || bug.reportedUser?.name}</td>
                  <td>{new Date(bug.createdAt).toLocaleString()}</td>
                  <td>
                    <div className="action-buttons">
                      <div className="tooltip">
                        <button className="icon-btn" onClick={() => navigate(`/bug/${bug.id}`)}>
                          <FaEye />
                        </button>
                        <span className="tooltip-text">View Bug</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="btn-container full-width" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-global btn-primary" onClick={() => navigate('/create-bug')}>➕ Create Bug</button>
        </div>
      </div>
    </div>
  );
}
