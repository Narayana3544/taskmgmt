import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "../Task/TaskForm.css";

const EditFeature = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [featureData, setFeatureData] = useState({ name: "", description: "", status: "", project: { id: "" } });
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, featureRes] = await Promise.all([
          api.get("/getstatusForFeature", { withCredentials: true }),
          api.get(`/features/${id}`, { withCredentials: true }),
        ]);
        setStatuses(statusRes.data);
        const feature = featureRes.data;
        setFeatureData({
          name: feature.name || "",
          description: feature.description || "",
          status: feature.status?.id || "",
          project: feature.project ? { id: feature.project.id } : { id: "" },
        });
      } catch (err) {
        console.error("Error loading feature or statuses:", err);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    setFeatureData({ ...featureData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedStatusObj = statuses.find(s => s.id === parseInt(featureData.status));
    const isClosing = selectedStatusObj &&
      (selectedStatusObj.decription.toLowerCase() === 'closed' || selectedStatusObj.decription.toLowerCase() === 'completed');

    if (isClosing) {
      try {
        const sprintsRes = await api.get(`/features/${id}/sprints`, { withCredentials: true });
        let projectTasks = [];
        if (featureData.project?.id) {
          const tasksRes = await api.get(`/viewTaskByProjectId/${featureData.project.id}`, { withCredentials: true });
          projectTasks = tasksRes.data.filter(t => t.feature?.id === parseInt(id));
        }
        const hasOpenSprints = sprintsRes.data.some(s => {
          const stat = s.status?.toLowerCase() || '';
          return stat !== 'closed' && stat !== 'completed';
        });
        const hasOpenTasks = projectTasks.some(t => {
          const stat = t.taskStatus?.decription?.toLowerCase() || '';
          return stat !== 'done' && stat !== 'closed' && stat !== 'completed';
        });
        if (hasOpenSprints || hasOpenTasks) {
          alert("Please close sprint and tasks first.");
          return;
        }
      } catch (err) {
        console.error("Error validating feature closure:", err);
        alert("Failed to validate feature closure requirements.");
        return;
      }
    }

    const payload = {
      name: featureData.name,
      description: featureData.description,
      status: { id: featureData.status },
      project: featureData.project.id ? { id: featureData.project.id } : null,
    };

    try {
      await api.put(`/features/${id}`, payload, { withCredentials: true });
      alert("Feature updated successfully!");
      navigate("/view-features");
    } catch (err) {
      console.error("Error updating feature:", err);
      alert("Failed to update feature.");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this feature?")) {
      try {
        await api.delete(`/features/${id}`, { withCredentials: true });
        alert("Feature deleted successfully!");
        navigate("/view-features");
      } catch (err) {
        console.error("Error deleting feature:", err);
        alert("Unable to delete — this feature may be linked to other stories.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '15px' }}>

      <div className="form-group" style={{ gridColumn: 'span 6', marginBottom: 0 }}>
        <label>Feature Name<sup style={{color:'red'}}>*</sup></label>
        <input type="text" name="name" value={featureData.name} onChange={handleChange} required />
      </div>

      <div className="form-group" style={{ gridColumn: 'span 6', marginBottom: 0 }}>
        <label>Status<sup style={{color:'red'}}>*</sup></label>
        <select name="status" value={featureData.status} onChange={handleChange} required>
          <option value="">Select a status</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>{status.decription}</option>
          ))}
        </select>
      </div>

      <div className="form-group" style={{ gridColumn: 'span 12', marginBottom: 0 }}>
        <label>Description<sup style={{color:'red'}}>*</sup></label>
        <textarea name="description" value={featureData.description} onChange={handleChange} rows={3} style={{ padding: '8px' }} required />
      </div>

      <div className="btn-container" style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '5px' }}>
        <button type="button" className="btn-global btn-secondary" onClick={() => navigate(-1)}>Back</button>
        <button type="button" className="btn-global btn-danger" onClick={handleDelete}>Delete</button>
        <button type="submit" className="btn-global btn-primary">Update Feature</button>
      </div>
    </form>
  );
};

export default EditFeature;