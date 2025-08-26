// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axios from "axios";
// import "./ViewProject.css";

// const ViewProject = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const [project, setProject] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [users, setUsers] = useState([]);
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [showAssignForm, setShowAssignForm] = useState(false);

//   useEffect(() => {
//     axios
//       .get(`http://localhost:8080/api/projects/${id}`, { withCredentials: true })
//       .then((res) => {
//         setProject(res.data);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Error fetching project:", err);
//         setLoading(false);
//       });

//     axios
//       .get("http://localhost:8080/api/users", { withCredentials: true })
//       .then((res) => setUsers(res.data))
//       .catch((err) => console.error("Error fetching users:", err));
//   }, [id]);

//   const toggleUserSelection = (user) => {
//     setSelectedUsers((prev) =>
//       prev.includes(user.id)
//         ? prev.filter((uid) => uid !== user.id)
//         : [...prev, user.id]
//     );
//   };

//   const handleAssignUsers = () => {
//     if (selectedUsers.length === 0) {
//       alert("Please select at least one user");
//       return;
//     }

//     axios
//       .post(`http://localhost:8080/api/projects/${id}/assign-users`, selectedUsers, {
//         withCredentials: true,
//       })
//       .then(() => {
//         alert("Users assigned successfully!");
//         setShowAssignForm(false);
//         setSelectedUsers([]);
//         return axios.get(`http://localhost:8080/api/projects/${id}`, { withCredentials: true });
//       })
//       .then((res) => setProject(res.data))
//       .catch((err) => {
//         console.error("Error assigning users:", err);
//         alert("Failed to assign users");
//       });
//   };

//    const [assignedUsers, setAssignedUsers] = useState([]);

//    useEffect(() => {
//     axios
//       .get(`http://localhost:8080/api/project/users/${id}`, { withCredentials: true })
//       .then((res) => setAssignedUsers(res.data))
//       .catch((err) => console.error("Error fetching assigned users:", err));
//   }, [id]);
//   if (loading) return <div>Loading project details...</div>;
//   if (!project) return <div>Project not found.</div>;

//   return (
//     <div className="view-project-page">
//       <h2>Project Details</h2>

//       <div className="project-detail"><strong>Name:</strong> {project.name}</div>
//       <div className="project-detail"><strong>Description:</strong> {project.description}</div>
//       <div className="project-detail"><strong>Status:</strong> {project.status?.decription || "N/A"}</div>

//       {project.teamMembers && project.teamMembers.length > 0 && (
//         <div className="project-detail">
//           <strong>Assigned Users:</strong>
//           <div className="assigned-users">
//             {project.teamMembers.map((member) => (
//               <div key={member.user.id} className="user-tag">{member.user.preffered_name}</div>
//             ))}
//           </div>
//         </div>
//       )}
//       <div className="project-detail">
//         <strong>Assigned Users:</strong>
//         {project.teamMembers && project.teamMembers.length > 0 ? (
//             <div className="assigned-users">
//             {project.teamMembers.map((member) => (
//                 <span key={member.user.id} className="user-tag">
//                 {member.user.name}
//                 </span>
//             ))}
//             </div>
//         ) : (
//             <p>No users assigned yet.</p>
//         )}
//         </div>
//          {/* Assigned Users Section */}
//       <div className="assigned-users-section">
//         <h3>Assigned Users</h3>
//         {assignedUsers.length > 0 ? (
//           <table className="users-table">
//             <thead>
//               <tr>
//                 <th>#</th>
//                 <th>Name</th>
//                 <th>Email</th>
//                 <th>Role</th>
//               </tr>
//             </thead>
//             <tbody>
//               {assignedUsers.map((user, index) => (
//                 <tr key={user.id}>
//                   <td>{index + 1}</td>
//                   <td>{user.preffered_name}</td>
//                   <td>{user.email}</td>
//                   <td>{user.role}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         ) : (
//           <p>No users assigned yet.</p>
//         )}
//       </div>


    //   <button
    //     className="btn btn-assign"
    //     onClick={() => setShowAssignForm((prev) => !prev)}
    //   >
    //     {showAssignForm ? "Cancel" : "Assign Users"}
    //   </button>

    //   {showAssignForm && (
    //     <div className="assign-form">
    //       <strong>Select Users:</strong>
    //       <div className="user-checkbox-grid">
    //         {users.map((user) => (
    //           <label
    //             key={user.id}
    //             className={`user-checkbox ${selectedUsers.includes(user.id) ? "selected" : ""}`}
    //           >
    //             <input
    //               type="checkbox"
    //               checked={selectedUsers.includes(user.id)}
    //               onChange={() => toggleUserSelection(user)}
    //             />
    //             {user.preffered_name}
    //           </label>
    //         ))}
    //       </div>

    //       <button className="btn btn-submit mt-3" onClick={handleAssignUsers}>
    //         Assign Selected Users
    //       </button>
    //     </div>
    //   )}

//       <button className="btn btn-back" onClick={() => navigate(-1)}>Back</button>
//     </div>
//   );
// };

// export default ViewProject;


import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ViewProject.css";

const ViewProject = () => {
  const { id } = useParams(); // project id
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showAssignForm, setShowAssignForm] = useState(false);

  // Fetch project details
  const fetchProject = () => {
    axios
      .get(`http://localhost:8080/api/projects/${id}`, { withCredentials: true })
      .then((res) => setProject(res.data))
      .catch((err) => console.error("Error fetching project:", err));
  };

  // Fetch assigned users
  const fetchAssignedUsers = () => {
    axios
      .get(`http://localhost:8080/api/project/users/${id}`, { withCredentials: true })
      .then((res) => setAssignedUsers(res.data))
      .catch((err) => console.error("Error fetching assigned users:", err));
  };

  // Fetch all users
  const fetchAllUsers = () => {
    axios
      .get("http://localhost:8080/api/users", { withCredentials: true })
      .then((res) => setAllUsers(res.data))
      .catch((err) => console.error("Error fetching all users:", err));
  };

  useEffect(() => {
    fetchProject();
    fetchAssignedUsers();
    fetchAllUsers();
  }, [id]);

  // Checkbox toggle
  const handleUserSelect = (e) => {
    const userId = parseInt(e.target.value);
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Assign selected users
  const handleAssignUsers = () => {
    if (selectedUsers.length === 0) {
      alert("Please select at least one user.");
      return;
    }

    axios
      .post(
        `http://localhost:8080/api/projects/${id}/assign-users`,
        selectedUsers,
        { withCredentials: true }
      )
      .then(() => {
        alert("Users assigned successfully!");
        setSelectedUsers([]);
        setShowAssignForm(false);
        fetchAssignedUsers();
      })
      .catch((err) => {
        console.error("Error assigning users:", err);
        alert("Failed to assign users.");
      });
  };

  // Unassign single user
  const handleUnassignUser = (userId) => {
  axios
    .delete(`http://localhost:8080/api/project/unassign`, {
      params: { projectId: project.id, userId: userId },
      withCredentials: true,
    })
    .then(() => {
      alert("User unassigned successfully!");
      // Remove user locally from assignedUsers state
      setAssignedUsers((prev) => prev.filter((u) => u.id !== userId));
    })
    .catch((err) => {
      console.error("Error unassigning user:", err);
      alert("Failed to unassign user.");
    });
};

  if (!project) return <p>Loading project details...</p>;

  return (
    <div className="view-project-page">


    <button className="back-btn" onClick={() => navigate(-1)}>⬅ Back</button>

      <h2>Project Details</h2>

      <div className="project-info">
        <p><strong>Name:</strong> {project.name}</p>
        <p><strong>Description:</strong> {project.description}</p>
        <p><strong>Status:</strong> {project.status?.decription || "N/A"}</p>
      </div>

      <h3>Assigned Users</h3>
      {assignedUsers.length > 0 ? (
        <table className="assigned-users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {assignedUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.preffered_name}</td>
                <td>{user.email}</td>
                <td>
                  <button
                    className="remove-btn"
                    onClick={() => handleUnassignUser(user.id)}
                  >
                   unassign
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No users assigned yet.</p>
      )}

      <div className="btn-container">
        <button
          className="assign-btn"
          onClick={() => setShowAssignForm((prev) => !prev)}
        >
          {showAssignForm ? "Cancel" : "Assign Users"}
        </button>
      </div>

      {showAssignForm && (
        <div className="assign-users-form">
          <h4>Select Users to Assign</h4>
          <div className="users-checkboxes">
            {allUsers.map((user) => (
              <label
                key={user.id}
                className={selectedUsers.includes(user.id) ? "selected" : ""}
              >
                <input
                  type="checkbox"
                  value={user.id}
                  checked={selectedUsers.includes(user.id)}
                  onChange={handleUserSelect}
                />
                {user.preffered_name} 
              </label>
            ))}
          </div>
          <button className="submit-btn" onClick={handleAssignUsers}>
            Assign Selected Users
          </button>
        </div>
      )}
    </div>
  );
};

export default ViewProject;


