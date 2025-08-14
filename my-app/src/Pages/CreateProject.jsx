import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
      .get("http://localhost:8080/api/getstatus",{withCredentials:true}) // Change to your backend URL
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

    // Prepare data for backend
    const payload = {
      name: project.name,
      description: project.description,
      status: { id: project.status }, // send status ID object
    };

    axios
      .post("http://localhost:8080/api/addproject", payload,{withCredentials:true})
      .then(() => {
        alert("Project created successfully!");
        navigate(-1); // go back after success
      })
      .catch((err) => {
        console.error("Error creating project:", err);
        alert("Error creating project");
      });
  };

  return (
    <div className="max-w-lg mx-auto bg-white shadow-lg p-6 rounded-xl mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Create Project</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Name */}
        <div>
          <label className="block font-semibold mb-1">Project Name</label>
          <input
            type="text"
            name="name"
            value={project.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Enter project name"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold mb-1">Description</label>
          <textarea
            name="description"
            value={project.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Enter project description"
            required
          />
        </div>

        {/* Status Dropdown */}
        <div>
          <label className="block font-semibold mb-1">Status</label>
          <select
            name="status"
            value={project.status}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select a status</option>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.decription} {/* Show description */}
              </option>
            ))}
          </select>
        </div>

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
  );
};

export default CreateProject;
