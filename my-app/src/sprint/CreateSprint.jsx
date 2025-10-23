import React, { useEffect, useState } from "react";
import api from "../api";
import "./CreateSprint.css";
import { useNavigate } from "react-router-dom";

const CreateSprint = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loadingFeatures, setLoadingFeatures] = useState(false);

  const [sprint, setSprint] = useState({
    name: "",
    startDate: "",
    endDate: "",
    projectId: "",
    featureId: "",
  });

  // ✅ Fetch all projects when page loads
  useEffect(() => {
    api
      .get("/projects", { withCredentials: true })
      .then((res) => {
        setProjects(res.data);
      })
      .catch((err) => console.error("❌ Error fetching projects:", err));
  }, []);

  // ✅ Fetch features when project changes
  useEffect(() => {
    if (!sprint.projectId) {
      setFeatures([]);
      return;
    }

    setLoadingFeatures(true);

    const projectId = parseInt(sprint.projectId, 10);
    console.log("Fetching features for projectId:", projectId);

    api
      .get(`/features/project/${projectId}`, { withCredentials: true })
      .then((res) => {
        console.log("✅ Features fetched:", res.data);
        setFeatures(res.data);
      })
      .catch((err) => {
        console.error("❌ Error fetching features:", err);
        setFeatures([]);
      })
      .finally(() => setLoadingFeatures(false));
  }, [sprint.projectId]);

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSprint((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();

    const sprintData = {
      name: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      feature: { id: parseInt(sprint.featureId) },
      project: { id: parseInt(sprint.projectId) },
    };

    console.log("Submitting sprint:", sprintData);

    api
      .post("/sprints/create-sprints", sprintData, { withCredentials: true })
      .then(() => {
        alert("✅ Sprint created successfully!");
        setSprint({
          name: "",
          startDate: "",
          endDate: "",
          projectId: "",
          featureId: "",
        });
        navigate("/manage-sprints");
      })
      .catch((err) => {
        console.error("❌ Error creating sprint:", err);
        alert("Failed to create sprint. Please try again.");
      });
  };

  return (
    <div className="create-sprint-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ⬅ Back
      </button>

      <h2>Create Sprint</h2>

      <form onSubmit={handleSubmit} className="sprint-form">
        {/* Sprint Name */}
        <div className="form-group">
          <label>Sprint Name:</label>
          <input
            type="text"
            name="name"
            value={sprint.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Start Date */}
        <div className="form-group">
          <label>Start Date:</label>
          <input
            type="date"
            name="startDate"
            value={sprint.startDate}
            onChange={handleChange}
            required
          />
        </div>

        {/* End Date */}
        <div className="form-group">
          <label>End Date:</label>
          <input
            type="date"
            name="endDate"
            value={sprint.endDate}
            onChange={handleChange}
            required
          />
        </div>

        {/* Project Dropdown */}
        <div className="form-group">
          <label>Project:</label>
          <select
            name="projectId"
            value={sprint.projectId}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Project --</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Feature Dropdown */}
        <div className="form-group">
          <label>Feature:</label>
          <select
            name="featureId"
            value={sprint.featureId}
            onChange={handleChange}
            required
            disabled={!sprint.projectId || loadingFeatures}
          >
            <option value="">
              {loadingFeatures
                ? "Loading features..."
                : !sprint.projectId
                ? "-- Select a project first --"
                : "-- Select Feature --"}
            </option>
            {features.map((feature) => (
              <option key={feature.id} value={feature.id}>
                {feature.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="submit-btn">
          Create Sprint
        </button>
      </form>
    </div>
  );
};

export default CreateSprint;
