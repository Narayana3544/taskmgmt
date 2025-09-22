import React, { useEffect, useState } from "react";
import api from '../api';
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import "./TaskList.css";
import { FaEdit, FaPlus } from "react-icons/fa";

export default function TaskList() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [features, setFeatures] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);


  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const tasksPerPage = 5;

  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects", {
        withCredentials: true,
      });
      setProjects(res.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  const fetchFeatures = async (projectId) => {
    try {
      const res = await api.get(
        `/features/project/${projectId}`,
        { withCredentials: true }
      );
      setFeatures(res.data);
    } catch (err) {
      console.error("Error fetching features:", err);
    }
  };

  const fetchTasks = async (projectId) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/viewTaskByProjectId/${projectId}`,
        { withCredentials: true }
      );
      setTasks(res.data);
      setCurrentPage(0);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks.");
      setLoading(false);
    }
  };

  // Filtered tasks (feature filter applied)
const filteredTasks = selectedFeature
  ? tasks.filter((t) => t.feature?.id === selectedFeature.value)
  : tasks;


  // Pagination
  const indexOfLastTask = (currentPage + 1) * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  // react-select project options
  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));
  const featureOptions = features.map((f) => ({ value: f.id, label: f.name }));

  return (
    <div className="features-list-page">
      {/* Filter Section */}
      <div className="filter-section">
        <Select
          options={projectOptions}
          value={selectedProject}
          onChange={(option) => {
            setSelectedProject(option);
            setSelectedFeature("");
            setFeatures([]);
            if (option) {
              fetchTasks(option.value);
              fetchFeatures(option.value);
            } else {
              setTasks([]);
            }
          }}
          isClearable
          placeholder="-- Select Project --"
        />

        <Select
          options={featureOptions}
          value={selectedFeature}
          onChange={(option) => {
            setSelectedFeature(option);
            setCurrentPage(0);
          }}
          isClearable
          placeholder="-- All Features --"
          isDisabled={!features.length}
        />
        <button
          className="reset-btn"
          onClick={() => {
            setSelectedProject(null);
            setSelectedFeature("");
            setTasks([]);
            setFeatures([]);
          }}
        >
          Reset
        </button>

        <button
          className="create-btn"
          onClick={() => navigate("/create-task")}
        >
          <FaPlus /> Create Task
        </button>
      </div>

      {loading && <p>Loading tasks...</p>}
      {error && <p>{error}</p>}

      <div className="task-table-container">
        <h2>Task List</h2>
        <div className="table-wrapper">
          <table className="task-table">
            <thead>
              <tr>
                <th>Story</th>
                <th>Story Points</th>
                <th>Sprint</th>
                <th>Feature</th>
                <th>Assigned User</th>
                <th>Task Type</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!selectedProject ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center" }}>
                    Select a project to see tasks.
                  </td>
                </tr>
              ) : currentTasks.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center" }}>
                    No tasks found.
                  </td>
                </tr>
              ) : (
                currentTasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.userstory || "-"}</td>
                    <td>{task.storypoints ?? "-"}</td>
                    <td>{task.sprint?.sprintName || task.sprint?.name || "-"}</td>
                    <td>{task.feature?.name || "-"}</td>
                    <td>
                      {task.user?.firstName ||
                        task.user?.preffered_name ||
                        task.user?.username ||
                        "-"}
                    </td>
                    <td>{task.taskType?.description || "-"}</td>
                    <td>
                      {task.taskStatus?.decription || task.taskStatus?.description || "-"}
                    </td>
                    <td>
                      {task.start_date
                        ? new Date(task.start_date).toLocaleDateString()
                        : "-"}
                    </td>
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {selectedProject && totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
              disabled={currentPage === 0}
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={currentPage === index ? "active" : ""}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
              }
              disabled={currentPage === totalPages - 1}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}