import React, { useEffect, useState } from "react";
import { useParams,useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from '../api';
import { sortLatestFirst } from "../utils/sortUtils";
import "./AssignTasksToSprint.css";

export default function AssignTaskToSprint() {
  const { featureId, sprintId } = useParams(); // assuming route has /assign/:featureId/:sprintId
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

   const fetchUnassignedTasks = async () => {
    if (!featureId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.get(
        `/tasks/unassigned-toSprint/${featureId}`,
        { withCredentials: true }
      );
      const unassignedOnly = res.data.filter(task => !task.sprint);
      setTasks(sortLatestFirst(unassignedOnly));
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load unassigned tasks.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ call fetch when component mounts
  useEffect(() => {
    fetchUnassignedTasks();
  }, [featureId]);


  const toggleSelectTask = (taskId) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const assignTasks = () => {
    if (selectedTasks.length === 0) {
      alert("Please select at least one task to assign.");
      return;
    }

   api.put(`/sprints/${sprintId}/assign-tasks`, selectedTasks,{withCredentials:true})
  .then(() => {
    toast.success("Tasks assigned successfully!");
    setTasks(prev => prev.filter(t => !selectedTasks.includes(t.id)));
    setSelectedTasks([]);
    setTimeout(() => {
      navigate(-1); // Navigate back to the previous sprint page
    }, 1000);
  })
  .catch(err => {
    console.error("Error assigning tasks:", err);
    toast.error("Failed to assign tasks");
  });
}


  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="features-list-page">
      <div className="task-table-container">
        <div className="table-wrapper">
          <h2>Assign Tasks to Sprint</h2>

          <table className="features-table">
            <thead>
          <tr>
            <th>Select</th>
            <th>ID</th>
            <th>User Story</th>
            <th>Story Points</th>
            <th>Assignee</th>
            <th>Reporter</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <tr key={task.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task.id)}
                    onChange={() => toggleSelectTask(task.id)}
                  />
                </td>
                <td>{task.id}</td>
                <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={task.userstory}>
                  {task.userstory || "-"}
                </td>
                <td>{task.storypoints ?? "-"}</td>
                <td>{task.user?.first_name || "-"}</td>
                <td>{task.reportedTo?.first_name || "-"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                No unassigned tasks found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="btn-container full-width" style={{ marginTop: '20px' }}>
        <button type="button" className="btn-global btn-secondary" onClick={() => navigate(-1)}>Back</button>
        <button
          className="btn-global btn-primary"
          onClick={assignTasks}
          disabled={selectedTasks.length === 0}
        >
          Assign Selected Tasks
        </button>
          </div>
        </div>
      </div>
    </div>
  );
}
