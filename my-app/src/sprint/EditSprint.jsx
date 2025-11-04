import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "./CreateSprint.css";

const EditSprint = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [loading, setLoading] = useState(true);

  const [sprint, setSprint] = useState({
    name: "",
    startDate: "",
    endDate: "",
    projectId: "",
    featureId: "",
    sprintGoals: "",
  });

  // ✅ Fetch projects first, then sprint
  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectRes = await api.get("/projects", { withCredentials: true });
        setProjects(projectRes.data);

        const sprintRes = await api.get(`/sprints/${id}`, { withCredentials: true });
        const data = sprintRes.data;

        setSprint({
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          sprintGoals: data.sprintGoals || "",
          projectId: data.project?.id?.toString() || "",
          featureId: data.feature?.id?.toString() || "",
        });
      } catch (err) {
        console.error("Error loading sprint or projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ✅ Fetch features when project changes
  useEffect(() => {
    if (!sprint.projectId) return;
    setLoadingFeatures(true);

    api
      .get(`/features/project/${sprint.projectId}`, { withCredentials: true })
      .then((res) => setFeatures(res.data))
      .catch((err) => {
        console.error("Error fetching features:", err);
        setFeatures([]);
      })
      .finally(() => setLoadingFeatures(false));
  }, [sprint.projectId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSprint((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const updatedSprint = {
      name: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      sprintGoals: sprint.sprintGoals,
      feature: { id: parseInt(sprint.featureId) },
      project: { id: parseInt(sprint.projectId) },
    };

    api
      .put(`/update/${id}`, updatedSprint, { withCredentials: true })
      .then(() => {
        alert("✅ Sprint updated successfully!");
        navigate("/manage-sprints");
      })
      .catch((err) => {
        console.error("Error updating sprint:", err);
        alert("Failed to update sprint.");
      });
  };

  if (loading) {
    return <div className="loading-message">Loading sprint details...</div>;
  }

  return (
    <div className="create-sprint-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ⬅ Back
      </button>

      <h2>Edit Sprint</h2>

      <form onSubmit={handleSubmit} className="sprint-form">
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

        <div className="form-group">
          <label>Sprint Goals:</label>
          <textarea
            name="sprintGoals"
            value={sprint.sprintGoals}
            onChange={handleChange}
            rows="3"
            required
          />
        </div>

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
          Update Sprint
        </button>
      </form>
    </div>
  );
};

export default EditSprint;
