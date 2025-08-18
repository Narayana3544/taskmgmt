import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateProject.css";
// import {AssignUsers} from "./AssignUsersToProject";
import axios from "axios";

const CreateProject = () => {
  const navigate = useNavigate();

  const [project, setProject] = useState({
    name: "",
    description: "",
    status: "", // will store status ID
  });

  const [statuses, setStatuses] = useState([]);

  // Fetch statuses for dropdown
  useEffect(() => {
    axios
      .get("http://localhost:8080/api/getstatus", { withCredentials: true })
      .then((res) => setStatuses(res.data))
      .catch((err) => console.error("Error fetching statuses:", err));
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      name: project.name,
      description: project.description,
      status: { id: project.status },
    };

    axios
      .post("http://localhost:8080/api/addproject", payload, { withCredentials: true })
      .then(() => {
        alert("Project created successfully!");
        navigate(-1);
      })
      .catch((err) => {
        console.error("Error creating project:", err);
        alert("Error creating project");
      });
  };

  return (
    <div className="create-project-page">
      <div className="create-main">
        <h2 className="create-title">Create Project</h2>

        <form onSubmit={handleSubmit} className="create-form">
          {/* Project Name */}
          <div>
            <label>Project Name</label>
            <input
              type="text"
              name="name"
              value={project.name}
              onChange={handleChange}
              placeholder="Enter project name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label>Description</label>
            <textarea
              name="description"
              value={project.description}
              onChange={handleChange}
              placeholder="Enter project description"
              required
            />
          </div>

          {/* Status Dropdown */}
          <div>
            <label>Status</label>
            <select
              name="status"
              value={project.status}
              onChange={handleChange}
              required
            >
              <option value="">Select a status</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.decription}
                </option>
              ))}
            </select>
          </div>

          {/* <AssignUsers /> */}

          {/* Buttons */}
          <div className="btn-container">
            <button type="submit" className="submit-btn">
              Create
            </button>
            <button type="button" className="back-btn" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
