import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import "./TaskList.css";
import { FaEdit ,FaPlus} from "react-icons/fa";

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
   const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/view-tasks", { withCredentials: true })
      .then((res) => {
        setTasks(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks.");
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p>{error}</p>;

  return (
     <div className="features-list-page">
               <button className="create-btn" onClick={() => navigate('/create-task')}>
                      <FaPlus /> Create Task
                    </button>

    <div className="task-table-container" >

      <h2>Task List</h2>
      
      <div class="table-wrapper">
      <table className="task-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Story</th>
            {/* <th>Description</th>
            <th>Acceptance Criteria</th> */}
            <th>Story Points</th>
            <th>Sprint</th>
            <th>Feature</th>
            <th>Assigned User</th>
             {/* <th>Report To</th> */}
            <th>Task Type</th>
            <th>Status</th>
            <th>Start Date</th>
            {/* <th>End Date</th> */}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && (
            <tr>
              <td colSpan="11" style={{ textAlign: "center" }}>
                No tasks found.
              </td>
            </tr>
          )}
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.userstory || "-"}</td>
              {/* <td>{task.description || "-"}</td>
              <td>{task.acceptance_criteria || "-"}</td> */}
              <td>{task.storypoints ?? "-"}</td>
              <td>{task.sprint?.sprintName || task.sprint?.name || "-"}</td>
              <td>{task.feature?.name || "-"}</td>
              <td>
                {task.user?.firstName || task.user?.preffered_name || task.user?.username || "-"}
              </td>
               {/* <td>
                {task.reportedTo?.firstName || task.reportedTo?.preffered_name || task.reportedTo?.username || "-"}
              </td> */}

              <td>{task.taskType?.description || "-"}</td>
              <td>{task.taskStatus?.decription || task.taskStatus?.description || "-"}</td>
              <td>{task.start_date ? new Date(task.start_date).toLocaleDateString() : "-"}</td>
              {/* <td>{task.end_date ? new Date(task.end_date).toLocaleDateString() : "-"}</td> */}
              <td>
                <button 
                    className="view-btn" 
                    onClick={() => navigate(`/task/${task.id}`)}
                  >
                    View
                  </button>
                    <button 
                  className="edit-btn" 
                  onClick={() => navigate(`/edit-task/${task.id}`)}
                > 
                <FaEdit />
                </button>
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
