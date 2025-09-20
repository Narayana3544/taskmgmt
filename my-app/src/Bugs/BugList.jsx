import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import api from "../api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./BugList.css";

export default function BugList() {
  const { id } = useParams(); // taskId
  const navigate = useNavigate();
  const [bugs, setBugs] = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    const fetchBugs = async () => {
      try {
        const res = await api.get(`/bugs/byTask/${id}`, { withCredentials: true });
        setBugs(res.data);
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
  }, [id]);

  // Handle status change
  const handleStatusChange = async (bugId, newStatusId) => {
    try {
      await api.put(`/bugs/${bugId}/status?statusId=${newStatusId}`, null, { withCredentials: true });

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
      <button className="back-btn" onClick={() => navigate(-1)}>⬅ Back</button>
      <div className="task-table-container">
        <div className="table-wrapper">
          <h2>Bugs for Task #{id}</h2>
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
                    >
                      {statuses.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.description || s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{bug.assignedUser?.first_name || bug.assignedUser?.name}</td>
                  <td>{bug.reportedUser?.first_name || bug.reportedUser?.name}</td>
                  <td>{new Date(bug.createdAt).toLocaleString()}</td>
                  <td>
                    <button onClick={() => navigate(`/bug/${bug.id}`)}> <FaEye /> </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
