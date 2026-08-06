import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "../Task/TaskForm.css";
import { sortLatestFirst } from "../utils/sortUtils";

const EditSprint = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [loading, setLoading] = useState(true);

  const [sprint, setSprint] = useState({
    name: "", startDate: "", endDate: "", projectId: "", featureId: "", sprintGoals: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectRes = await api.get("/projects", { withCredentials: true });
        setProjects(sortLatestFirst(projectRes.data));
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

  useEffect(() => {
    if (!sprint.projectId) return;
    setLoadingFeatures(true);
    api.get(`/features/project/${sprint.projectId}`, { withCredentials: true })
      .then((res) => setFeatures(sortLatestFirst(res.data)))
      .catch(() => setFeatures([]))
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
    api.put(`/update/${id}`, updatedSprint, { withCredentials: true })
      .then(() => { alert("✅ Sprint updated successfully!"); navigate("/manage-sprints"); })
      .catch(() => alert("Failed to update sprint."));
  };

  if (loading) return <div>Loading sprint details...</div>;

  return (
    <form onSubmit={handleSubmit} className="task-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '15px' }}>

      <div className="form-group" style={{ gridColumn: 'span 6', marginBottom: 0 }}>
        <label>Sprint Name<sup style={{color:'red'}}>*</sup></label>
        <input type="text" name="name" value={sprint.name} onChange={handleChange} required />
      </div>

      <div className="form-group" style={{ gridColumn: 'span 6', marginBottom: 0 }}>
        <label>Sprint Goals<sup style={{color:'red'}}>*</sup></label>
        <textarea name="sprintGoals" value={sprint.sprintGoals} onChange={handleChange} rows={2} style={{ minHeight:'34px', padding:'8px' }} required />
      </div>

      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Start Date<sup style={{color:'red'}}>*</sup></label>
        <input type="date" name="startDate" value={sprint.startDate} onChange={handleChange} required />
      </div>

      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>End Date<sup style={{color:'red'}}>*</sup></label>
        <input type="date" name="endDate" value={sprint.endDate} onChange={handleChange} required />
      </div>

      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Project<sup style={{color:'red'}}>*</sup></label>
        <select name="projectId" value={sprint.projectId} onChange={handleChange} required>
          <option value="">-- Select Project --</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
        <label>Feature<sup style={{color:'red'}}>*</sup></label>
        <select name="featureId" value={sprint.featureId} onChange={handleChange} required disabled={!sprint.projectId || loadingFeatures}>
          <option value="">{loadingFeatures ? "Loading..." : "-- Select Feature --"}</option>
          {features.map((feature) => (
            <option key={feature.id} value={feature.id}>{feature.name}</option>
          ))}
        </select>
      </div>

      <div className="btn-container" style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '5px' }}>
        <button type="button" className="btn-global btn-secondary" onClick={() => navigate(-1)}>Back</button>
        <button type="submit" className="btn-global btn-primary">Update Sprint</button>
      </div>
    </form>
  );
};

export default EditSprint;