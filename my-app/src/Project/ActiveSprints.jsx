import React, { useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./UserSprints.css";

export default function UserSprints() {
  const [sprints, setSprints] = useState([]);
  const [tasksBySprint, setTasksBySprint] = useState({}); // store tasks per sprint
  const [loading, setLoading] = useState(true);
  const navigate=useNavigate();

  useEffect(() => {
    fetchSprints();
  }, []);

  const fetchSprints = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8080/api/users/currentsprints",
        { withCredentials: true }
      );
      setSprints(res.data);

      // fetch tasks for each sprint
      res.data.forEach((sprint) => fetchTasks(sprint.id));
    } catch (err) {
      console.error("Error fetching sprints:", err);
    } finally {
      setLoading(false);
    }
  };
  const [currentUser, setCurrentUser] = useState(null);

      useEffect(() => {
        axios.get("http://localhost:8080/api/users/me", { withCredentials: true })
          .then(res => setCurrentUser(res.data))
          .catch(err => console.error("Error fetching current user:", err));
      }, []);

  const fetchTasks = async (sprintId) => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/sprint/viewtaskBySprintId/${sprintId}`,
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
      await axios.put(`http://localhost:8080/api/tasks/${taskId}/assignMe`,
  {}, 
  { withCredentials: true }  
);
      fetchTasks(sprintId); // refresh only this sprint's tasks
    } catch (err) {
      console.error("Error assigning task:", err);
    }
  };

  const unassignTask = async (taskId, sprintId) => {
    try {
      await axios.put(`http://localhost:8080/api/tasks/${taskId}/unassignMe`,{withCredentials:true});
      fetchTasks(sprintId); // refresh only this sprint's tasks
    } catch (err) {
      console.error("Error unassigning task:", err);
    }
  };

  if (loading) return <p className="loading">Loading sprints...</p>;

  return (
    <div className="sprints-page">
       <button  onClick={() => navigate(-1)} className="back-btn">Back</button>
      <h2 className="page-title">My Active Sprints</h2>

      {sprints.length === 0 ? (
        <p className="no-sprints">No active sprints assigned.</p>
      ) : (
        sprints.map((sprint) => (
          <div key={sprint.id} className="sprint-card">
            <h3 className="sprint-title">{sprint.name}</h3>
            <p className="sprint-dates">
              {sprint.startDate} → {sprint.endDate}
            </p>

            {tasksBySprint[sprint.id] &&
            tasksBySprint[sprint.id].length > 0 ? (
              <table className="task-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Description</th>
                    <th>Assigned User</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasksBySprint[sprint.id].map((task) => (
                    <tr key={task.id}>
                      <td>{task.userstory}</td>
                      <td>{task.description}</td>
                      <td>
                        {
                         task.user?.first_name || "-"
                          }
                      </td>
                      {/* <td>
                        {task.user?.first_name  ? (
                          <button
                            className="btn unassign"
                            onClick={() => unassignTask(task.id, sprint.id)}
                          >
                            Unassign Me
                          </button>
                        ) : (
                          <button
                            className="btn assign"
                            onClick={() => assignTask(task.id, sprint.id)}
                          >
                            Assign Me
                          </button>
                        )}
                      </td> */}
                      <td>
                        {task.user ? (
                          task.user.id === currentUser?.id ? (
                            // Task assigned to me → show "Unassign Me"
                            <button
                              className="btn unassign"
                              onClick={() => unassignTask(task.id, sprint.id)}
                            >
                              Unassign Me
                            </button>
                          ) : (
                            // Task assigned to someone else → no button
                            <span className="assigned-to">Assigned to {task.user.first_name}</span>
                          )
                        ) : (
                          // Task not assigned → I can assign it
                          <button
                            className="btn assign"
                            onClick={() => assignTask(task.id, sprint.id)}
                          >
                            Assign Me
                          </button>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-tasks">No tasks in this sprint.</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
