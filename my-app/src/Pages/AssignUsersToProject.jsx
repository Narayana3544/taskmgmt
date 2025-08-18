import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AssignUsersToProject.css";

export default function AssignUsersForm() {
  const [projectId, setProjectId] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/users",{withCredentials:true});
      setUsers(response.data);
      console.log("Fetched Users:", response.data); // ✅ check in console
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  fetchUsers();
}, []);

  // Fetch all users for dropdown
  useEffect(() => {
    axios.get("http://localhost:8080/api/users",{withCredentials:true})
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Error fetching users:", err));
      
  }, []);

  const handleUserChange = (e) => {
    const options = Array.from(e.target.selectedOptions, (option) => option.value);
    setSelectedUsers(options);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("Submitting:", { userIds: selectedUsers, projectId }); // 👈 check
  try {
    await axios.post(
      `http://localhost:8080/api/project/${projectId}/assign-users`,
      { userIds: selectedUsers },{withCredentials:true}
    );
    alert("Users assigned successfully!");
  } catch (err) {
    console.error("Error assigning users:", err.response?.data || err.message);
  }
};

  return (
    <div className="assign-form-container">
      <h2>Assign Users to Project</h2>
      <form onSubmit={handleSubmit} className="assign-form">
        
        <label htmlFor="projectId">Project ID:</label>
        <input
          type="number"
          id="projectId"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="Enter Project ID"
          required
        />

        <label htmlFor="users">Select Users:</label>
        <select
          multiple
          id="users"
          value={selectedUsers}
          onChange={handleUserChange}
          required
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.preffered_name}
            </option>
          ))}
        </select>

        <button type="submit" className="assign-btn">Assign Users</button>
      </form>
    </div>
  );
}
