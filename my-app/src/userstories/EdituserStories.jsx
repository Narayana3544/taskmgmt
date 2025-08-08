import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./CreateUserStory.css"; // reuse create form styles

const EditUserStory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState({
    description: "",
    acceptancecriteria: "",
    storypoints: "",
    status: "To Do",
    feature: { id: "" }
  });

  useEffect(() => {
    axios.get(`http://localhost:8080/api/userstories/${id}`, { withCredentials: true })
      .then(res => setStory(res.data))
      .catch(err => console.error("Error loading story:", err));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStory(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeatureChange = (e) => {
    setStory(prev => ({
      ...prev,
      feature: { id: e.target.value }
    }));
  };

  const handleSave = () => {
    axios.put(`http://localhost:8080/api/userstories/${id}`, story, { withCredentials: true })
      .then(() => {
        alert("Story updated successfully!");
        navigate("/view-stories");
      })
      .catch(err => {
        console.error("Error updating story:", err);
        alert("Failed to update story");
      });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this story?")) {
      axios.delete(`http://localhost:8080/api/userstories/${id}`, { withCredentials: true })
        .then(() => {
          alert("Story deleted successfully!");
          navigate("/view-userstories");
        })
        .catch(err => {
          console.error("Error deleting story:", err);
          alert("Failed to delete story");
        });
    }
  };

  return (
    <div className="create-user-story-container">
      <h2>✏️ Edit User Story</h2>
      <div className="create-user-story-form">
        <div className="full-width">
          <label>Description</label>
          <textarea
            name="description"
            value={story.description}
            onChange={handleChange}
          />
        </div>

        <div className="full-width">
          <label>Acceptance Criteria</label>
          <textarea
            name="acceptancecriteria"
            value={story.acceptancecriteria}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Story Points</label>
          <input
            type="number"
            name="storypoints"
            value={story.storypoints}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Status</label>
          <select
            name="status"
            value={story.status}
            onChange={handleChange}
          >
            <option>To Do</option>
            <option>In Progress</option>
            <option>Done</option>
          </select>
        </div>

        <div>
          <label>Feature ID</label>
          <input
            type="number"
            value={story.feature?.id || ""}
            onChange={handleFeatureChange}
          />
        </div>

        <div className="button-row">
          <button className="save-btn" onClick={handleSave}> Save</button>
          <button className="delete-btn" onClick={handleDelete}> Delete</button>
          <button className="cancel-btn" onClick={() => navigate("/view-stories")}> Back</button>
        </div>
      </div>
    </div>
  );
};

export default EditUserStory;
