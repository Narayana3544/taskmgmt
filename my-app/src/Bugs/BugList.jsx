import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import api from "../api";
import "./BugList.css";

export default function BugList() {
  const { id } = useParams(); // taskId
  const navigate = useNavigate();
  const [bugs, setBugs] = useState([]);

  useEffect(() => {
    const fetchBugs = async () => {
      try {
        const res = await api.get(`/bugs/byTask/${id}`, { withCredentials: true });
        setBugs(res.data);
      } catch (err) {
        console.error("Error fetching bugs:", err);
      }
    };
    fetchBugs();
  }, [id]);

  return (
        <div className="features-list-page">
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
          {bugs.map(bug => (
            <tr key={bug.id}>
              <td>{bug.id}</td>
              <td>{bug.title}</td>
              <td>{bug.priority?.description || bug.priority?.name}</td>
              <td>{bug.status?.decription || bug.status?.name}</td>
              <td>{bug.assignedUser?.first_name || bug.assignedUser?.name}</td>
              <td>{bug.reportedUser?.first_name || bug.reportedUser?.name}</td>
              <td>{new Date(bug.createdAt).toLocaleString()}</td>
              <td>
                <button onClick={() => navigate(`/bug/${bug.id}`)}> <FaEye /></button>
                
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
