import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "./EditFeature.css";

const EditFeature = () => {
  const { id } = useParams(); // feature id from URL
  const navigate = useNavigate();

  const [featureData, setFeatureData] = useState({
    name: "",
    description: "",
    status: "",
    project: { id: "" },
  });

  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    // Fetch statuses and feature details
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
    setFeatureData({
      ...featureData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
    <div className="edit-feature-container">
      <h2>Edit Feature</h2>
      <form className="edit-feature-form" onSubmit={handleSubmit}>
        <label>Feature Name</label>
        <input
          type="text"
          name="name"
          value={featureData.name}
          onChange={handleChange}
          required
        />

        <label>Description</label>
        <textarea
          name="description"
          value={featureData.description}
          onChange={handleChange}
          required
        />

        <label>Status</label>
        <select
          name="status"
          value={featureData.status}
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

        <div className="button-group">
          <button type="submit" className="action-btn">Save</button>
          <button type="button" className="action-btn" onClick={handleDelete}>Delete</button>
          <button
            type="button"
            className="action-btn"
            onClick={() => navigate("/view-features")}
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditFeature;
