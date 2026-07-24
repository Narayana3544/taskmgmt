import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaEye, FaEdit, FaPlus } from "react-icons/fa";
import api from "../api";
import { ToastContainer, toast } from "react-toastify";
import Select from "react-select";
import { sortLatestFirst } from "../utils/sortUtils";
import "react-toastify/dist/ReactToastify.css";
import "./BugList.css";
import StatusSummary from '../components/StatusSummary';
import Pagination from '../components/Pagination';

export default function BugList() {
  const navigate = useNavigate();
  const [bugs, setBugs] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [selectedFeature, setSelectedFeature] = useState("");
  const [selectedSprint, setSelectedSprint] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const uniqueFeatures = Array.from(new Set(bugs.map(b => b.featureName))).filter(Boolean).sort();
  const uniqueSprints = Array.from(new Set(bugs.map(b => b.sprintName))).filter(Boolean).sort();
  const uniqueUsers = Array.from(new Set(bugs.map(b => b.assignedUser))).filter(Boolean).sort();

  useEffect(() => {
    const fetchBugs = async () => {
      try {
        const res = await api.get(`/view-bugs`, { withCredentials: true });
        setBugs(sortLatestFirst(res.data));
      } catch (err) {
        console.error("Error fetching bugs:", err);
      }
    };

    const fetchStatuses = async () => {
      try {
        const res = await api.get("/getstatusForTask", { withCredentials: true });
        setStatuses(res.data || []);
      } catch (err) {
        console.error("Error fetching statuses:", err);
      }
    };

    const fetchProjects = async () => {
      try {
        const res = await api.get("/projects", { withCredentials: true });
        setProjects(sortLatestFirst(res.data || []));
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };

    fetchBugs();
    fetchStatuses();
    fetchProjects();
  }, []);

  const filteredBugs = React.useMemo(() => {
    let result = bugs;
    if (selectedProject) {
      const pName = projects.find(p => p.id === parseInt(selectedProject))?.name;
      result = result.filter((bug) => bug.projectName === pName);
    }
    if (selectedFeature) {
      result = result.filter(bug => bug.featureName === selectedFeature);
    }
    if (selectedSprint) {
      result = result.filter(bug => bug.sprintName === selectedSprint);
    }
    if (selectedUser) {
      result = result.filter(bug => bug.assignedUser === selectedUser);
    }
    if (selectedStatus) {
      result = result.filter(bug => bug.statusId === parseInt(selectedStatus) || bug.status === selectedStatus);
    }
    if (searchTitle) {
      result = result.filter(bug => bug.title?.toLowerCase().includes(searchTitle.toLowerCase()));
    }
    return result;
  }, [bugs, selectedProject, projects, searchTitle, selectedFeature, selectedSprint, selectedUser, selectedStatus]);

  const indexOfLastBug = currentPage * itemsPerPage;
  const currentBugs = filteredBugs.slice(indexOfLastBug - itemsPerPage, indexOfLastBug);

  // Handle status change
  const handleStatusChange = async (bugId, newStatusId) => {
    if (!window.confirm("Are you sure you want to change the status?")) {
      return;
    }

    try {
      await api.put(`/bugs/${bugId}/status/${newStatusId}`, null, { withCredentials: true });
      setBugs((prevBugs) =>
        prevBugs.map((b) =>
          b.id === bugId ? { ...b, statusId: parseInt(newStatusId), status: statuses.find(s => s.id === parseInt(newStatusId))?.decription } : b
        )
      );
      toast.success("Status updated successfully!");
    } catch (err) {
      console.error("Error updating bug status:", err);
      toast.error("Failed to update status.");
    }
  };

  return (
    <div className="features-list-page">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <div className="task-table-container">
        <div className="table-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', flex: 1 }}>
              <h2 style={{ margin: 0, whiteSpace: 'nowrap' }}>Bugs</h2>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ minWidth: '200px' }}>
                  <Select
                    options={projects.map(p => ({ value: p.id, label: p.name }))}
                    value={projects.find(p => p.id === parseInt(selectedProject)) 
                      ? { value: selectedProject, label: projects.find(p => p.id === parseInt(selectedProject)).name } 
                      : null}
                    onChange={(option) => {
                      setSelectedProject(option ? option.value : "");
                      setCurrentPage(1);
                    }}
                    isClearable
                    placeholder="-- Select Project --"
                  />
                </div>

                <StatusSummary data={filteredBugs} statusExtractor={(bug) => bug.status || 'Unknown'} />
              </div>
            </div>

            <div style={{ flexShrink: 0 }}>
              <button className="create-btn" onClick={() => navigate('/create-bug')} style={{ whiteSpace: 'nowrap' }}>
                <FaPlus /> Create Bug
              </button>
            </div>
          </div>
          <table className="bug-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>
                  Feature Name
                  <br />
                  <select
                    value={selectedFeature}
                    onChange={(e) => { setSelectedFeature(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="">All</option>
                    {uniqueFeatures.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </th>
                <th>
                  Sprint
                  <br />
                  <select
                    value={selectedSprint}
                    onChange={(e) => { setSelectedSprint(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="">All</option>
                    {uniqueSprints.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </th>
                <th>Bug Title</th>
                <th style={{ whiteSpace: 'nowrap' }}>ID</th>
                <th>
                  User
                  <br />
                  <select
                    value={selectedUser}
                    onChange={(e) => { setSelectedUser(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="">All</option>
                    {uniqueUsers.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </th>
                <th style={{ whiteSpace: 'nowrap' }}>
                  Status
                  <br />
                  <select
                    value={selectedStatus}
                    onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="">All</option>
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>{s.decription}</option>
                    ))}
                  </select>
                </th>
                <th style={{ whiteSpace: 'nowrap' }}>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentBugs.map((bug) => (
                <tr key={bug.id}>
                  <td>{bug.projectName || "-"}</td>
                  <td>{bug.featureName || "-"}</td>
                  <td>{bug.sprintName || "-"}</td>
                  <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={bug.title}>
                    {bug.title}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{bug.id}</td>
                  <td>{bug.assignedUser || "-"}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <select
                      value={bug.statusId || ""}
                      onChange={(e) => handleStatusChange(bug.id, e.target.value)}
                      style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      {statuses.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.decription || s.description || s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{bug.createdAt ? new Date(bug.createdAt).toLocaleDateString() : "-"}</td>
                  <td>
                    <div className="action-buttons">
                      <div className="tooltip">
                        <button className="icon-btn" onClick={() => navigate(`/bug/${bug.id}`)}>
                          <FaEye />
                        </button>
                        <span className="tooltip-text">View Bug</span>
                      </div>
                      <div className="tooltip">
                        <button className="icon-btn" onClick={() => navigate(`/edit-bug/${bug.id}`)}>
                          <FaEdit />
                        </button>
                        <span className="tooltip-text">Edit Bug</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBugs.length > 0 && (
            <Pagination
              totalItems={filteredBugs.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
