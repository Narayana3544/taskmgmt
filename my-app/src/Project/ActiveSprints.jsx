import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import api from '../api';
import "./UserSprints.css";

export default function UserSprints() {
  const [sprints, setSprints] = useState([]);
  const [tasksBySprint, setTasksBySprint] = useState({});
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState({}); // per sprint
  const [pageBySprint, setPageBySprint] = useState({}); // pagination per sprint

  const tasksPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    fetchSprints();
    fetchCurrentUser();
    fetchStatuses();
  }, []);

  const fetchSprints = async () => {
    try {
      const res = await api.get("/users/currentsprints", {
        withCredentials: true,
      });
      setSprints(res.data);

      const initialTabs = {};
      const initialPages = {};
      res.data.forEach((s) => {
        initialTabs[s.id] = "all";
        initialPages[s.id] = 1;
        fetchTasks(s.id);
      });
      setActiveTab(initialTabs);
      setPageBySprint(initialPages);
    } catch (err) {
      console.error("Error fetching sprints:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/users/me", {
        withCredentials: true,
      });
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await api.get("/getstatusForTask", {
        withCredentials: true,
      });
      setStatuses(res.data);
    } catch (err) {
      console.error("Error fetching statuses:", err);
    }
  };

  const fetchTasks = async (sprintId) => {
    try {
      const res = await api.get(
        `/sprint/viewtaskBySprintId/${sprintId}`,
        { withCredentials: true }
      );
      setTasksBySprint((prev) => ({
        ...prev,
        [sprintId]: res.data,
      }));
    } catch (err) {
      console.error(`Error fetching tasks for sprint ${sprintId}:`, err);
    }
  };

  const assignTask = async (taskId, sprintId) => {
    try {
      await api.put(`/tasks/${taskId}/assignMe`, {}, { withCredentials: true });
      fetchTasks(sprintId);
    } catch (err) {
      console.error("Error assigning task:", err);
    }
  };

  const unassignTask = async (taskId, sprintId) => {
    try {
      await api.put(`/tasks/${taskId}/unassignMe`, {}, { withCredentials: true });
      fetchTasks(sprintId);
    } catch (err) {
      console.error("Error unassigning task:", err);
    }
  };

  const handleStatusChange = async (taskId, statusId, sprintId) => {
    try {
      await api.put(
        `/tasks/${taskId}/status/${statusId}`,
        {},
        { withCredentials: true }
      );
      fetchTasks(sprintId);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const changePage = (sprintId, direction) => {
    setPageBySprint((prev) => ({
      ...prev,
      [sprintId]: Math.max(1, prev[sprintId] + direction),
    }));
  };

  if (loading) return <p className="loading">Loading sprints...</p>;

  return (
    <div className="sprints-page">
      <h2 className="page-title">Active Sprint Tasks</h2>

      {sprints.length === 0 ? (
        <p className="no-sprints">No active sprints assigned.</p>
      ) : (
        sprints.map((sprint) => {
          const allTasks = tasksBySprint[sprint.id] || [];
          const myTasks = allTasks.filter((t) => t.user?.id === currentUser?.id);

          const page = pageBySprint[sprint.id] || 1;
          const currentTasks =
            activeTab[sprint.id] === "all"
              ? allTasks.slice((page - 1) * tasksPerPage, page * tasksPerPage)
              : myTasks.slice((page - 1) * tasksPerPage, page * tasksPerPage);

          const totalPages =
            activeTab[sprint.id] === "all"
              ? Math.ceil(allTasks.length / tasksPerPage)
              : Math.ceil(myTasks.length / tasksPerPage);

          return (
            <div key={sprint.id} className="sprint-card">
              <h3 className="sprint-title">{sprint.name}</h3>
              <p className="sprint-dates">
                {sprint.startDate} → {sprint.endDate}
              </p>

              {/* Tabs */}
              <div className="tabs">
                <button
                  className={activeTab[sprint.id] === "all" ? "tab active" : "tab"}
                  onClick={() => {
                    setActiveTab({ ...activeTab, [sprint.id]: "all" });
                    setPageBySprint({ ...pageBySprint, [sprint.id]: 1 });
                  }}
                >
                  All Tasks
                </button>
                <button
                  className={activeTab[sprint.id] === "my" ? "tab active" : "tab"}
                  onClick={() => {
                    setActiveTab({ ...activeTab, [sprint.id]: "my" });
                    setPageBySprint({ ...pageBySprint, [sprint.id]: 1 });
                  }}
                >
                  My Tasks
                </button>
              </div>

              {/* Table */}
              <table className="task-table">
                <thead>
                  {activeTab[sprint.id] === "all" ? (
                    <tr>
                      <th style={{ whiteSpace: 'nowrap', width: '1%' }}>ID</th>
                      <th>Task</th>
                      <th>Description</th>
                      <th style={{ whiteSpace: 'nowrap', width: '1%' }}>Assigned To</th>
                      <th style={{ whiteSpace: 'nowrap', width: '1%' }}>Action</th>
                    </tr>
                  ) : (
                    <tr>
                      <th>ID</th>
                      <th>Story</th>
                      <th>Story Points</th>
                      <th>Sprint</th>
                      <th>Feature</th>
                      <th>Task Type</th>
                      <th>Status</th>
                      <th>Start Date</th>
                      <th>Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {currentTasks.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center" }}>
                        No tasks found.
                      </td>
                    </tr>
                  ) : (
                    currentTasks.map((task) =>
                      activeTab[sprint.id] === "all" ? (
                        <tr key={task.id}>
                          <td style={{ whiteSpace: 'nowrap', width: '1%' }}>{task.id}</td>
                          <td>{task.userstory}</td>
                          <td>{task.description}</td>
                          <td style={{ whiteSpace: 'nowrap', width: '1%' }}>{task.user?.first_name || "-"}</td>
                          <td style={{ whiteSpace: 'nowrap', width: '1%' }}>
                            {task.user ? (
                              task.user.id === currentUser?.id ? (
                                <button
                                  className="link-btn danger"
                                  onClick={() => unassignTask(task.id, sprint.id)}
                                >
                                  Unassign Me
                                </button>
                              ) : (
                                <span className="assigned-to">
                                  Assigned to {task.user.first_name}
                                </span>
                              )
                            ) : (
                              <button
                                className="link-btn primary"
                                onClick={() => assignTask(task.id, sprint.id)}
                              >
                                Assign Me
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        <tr key={task.id}>
                          <td >{task.id}</td>
                          <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={task.userstory}>
                        {task.userstory || "-"}
                      </td>
                          <td>{task.storypoints ?? "-"}</td>
                          <td>{task.sprint?.sprintName || task.sprint?.name || "-"}({task.sprint.status})</td>
                          <td>{task.feature?.name || "-"}</td>
                          <td>{task.taskType?.description || "-"}</td>
                          <td>
                            <select
                              value={task.taskStatus?.id || ""}
                              onChange={(e) => handleStatusChange(task.id, e.target.value, sprint.id)}
                            >
                              <option value="">-- Select Status --</option>
                              {statuses.map((status) => (
                                <option key={status.id} value={status.id}>
                                  {status.decription}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>{task.start_date ? new Date(task.start_date).toLocaleDateString() : "-"}</td>
                          <td>
                            <div className="action-buttons">
                              <button className="icon-btn" onClick={() => navigate(`/task/${task.id}`)} title="View">
                                <FaEye />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
             {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={page === 1}
                  onClick={() => changePage(sprint.id, -1)}
                >
                  Prev
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={`page-btn ${page === i + 1 ? "active" : ""}`}
                    onClick={() =>
                      setPageBySprint({ ...pageBySprint, [sprint.id]: i + 1 })
                    }
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  className="page-btn"
                  disabled={page === totalPages}
                  onClick={() => changePage(sprint.id, +1)}
                >
                  Next
                </button>
              </div>
            )}
            </div>
          );
        })
      )}
    </div>
  );
}
