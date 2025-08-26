import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./EditFeature.css";

const EditFeature = () => {
  const { id } = useParams(); // feature id from URL
  const navigate = useNavigate();

  const [featureData, setFeatureData] = useState({
    name: "",
    description: "",
    status: "",
    project: { id: "" }
  });

   const [statuses, setStatuses] = useState([]);

    useEffect(() => {
    // Get statuses for dropdown
    axios.get('http://localhost:8080/api/getstatusForFeature', { withCredentials: true })
      .then(res => setStatuses(res.data))
      .catch(err => console.error('Failed to load statuses:', err));

    axios
      .get(`http://localhost:8080/api/features/${id}`, { withCredentials: true })
      .then((res) => {
        // Ensure project exists in state
        setFeatureData({
          name: res.data.name || "",
          description: res.data.description || "",
          status: res.data.status?.id || '',
          project: res.data.project ? { id: res.data.project.id } : { id: "" }
        });
      })
      .catch((err) => console.error("Error fetching feature:", err));
  }, [id]);

  const handleChange = (e) => {
    setFeatureData({
      ...featureData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      name: featureData.name,
      description: featureData.description,
      status:{ id:featureData.status},
      project: featureData.project.id ? { id: featureData.project.id } : null
    };

    axios
      .put(`http://localhost:8080/api/features/${id}`, payload, {
        withCredentials: true
      })
      .then(() => {
        alert("Feature updated successfully!");
        navigate("/view-features");
      })
      .catch((err) => console.error("Error updating feature:", err));
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this feature?")) {
      axios
        .delete(`http://localhost:8080/api/features/${id}`, {
          withCredentials: true
        })
        .then(() => {
          alert("Feature deleted successfully!");
          navigate("/view-features");
        })
        .catch((err) => {
          console.error("Error deleting feature:", err);
          alert("It may be linked to other stories");
        });
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
          name="descriptor"
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
              {statuses.map(status => (
                <option key={status.id} value={status.id}>
                  {status.decription}
                </option>
                ))}
        </select>
          

        <div className="button-group">
          <button type="submit" className="save-btn">Save</button>
          <button type="button" className="delete-btn" onClick={handleDelete}>Delete</button>
          <button
            type="button"
            className="cancel-btn"
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
