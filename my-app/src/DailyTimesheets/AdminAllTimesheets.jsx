import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import { FaEye } from "react-icons/fa";
import "./AdminAllTimesheet.css";

export default function AdminAllTimesheets() {

  const navigate = useNavigate();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const pastWeek = new Date();
  pastWeek.setDate(today.getDate() - 7);
  const pastWeekStr = pastWeek.toISOString().split("T")[0];
  const [summaries, setSummaries] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  // ✅ Default dates
  const [searchParams, setSearchParams] = useSearchParams();
  const [start, setStart] = useState(searchParams.get("start") || pastWeekStr);
  const [end, setEnd] = useState(searchParams.get("end") || todayStr);
  const [loading, setLoading] = useState(false);
  
  // Fetch users & auto-fetch summary on load
  useEffect(() => {
    api.get("/users", { withCredentials: true })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Error fetching users:", err));
      
    fetchSummary(start, end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Fetch summary
  const fetchSummary = async (s = start, e = end) => {
    setLoading(true);
    setSearchParams({ start: s, end: e });
    try {
      const res = await api.get(`/timesheet/all-summary?start=${s}&end=${e}`);
      setSummaries(res.data);
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
    setLoading(false);
  };
  // Fetch selected user's range
  const handleViewUser = (userId, username) => {
    navigate(`/admin/timesheet-details/${userId}?start=${start}&end=${end}&name=${encodeURIComponent(username || '')}`);
  };


  const formatHours = (entry) => {

    if (entry?.totalHoursAndMinutes) return entry.totalHoursAndMinutes;

    const th = entry?.totalHours;

    if (th === null || th === undefined || Number.isNaN(Number(th))) return "-";

    const totalMinutes = Math.round(Number(th) * 60);

    const hoursPart = Math.floor(totalMinutes / 60);
    const minutesPart = Math.abs(totalMinutes % 60);

    return `${hoursPart}h ${String(minutesPart).padStart(2, "0")}m`;

  };

  return (
    <div className="admin-all-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>Admin Timesheet Overview</h2>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <label style={{ margin: 0, fontWeight: 'bold' }}>Start:</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <label style={{ margin: 0, fontWeight: 'bold' }}>End:</label>
            <input
              type="date"
              value={end}
              max={todayStr}
              onChange={(e) => setEnd(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <button className="btn-global btn-primary" onClick={() => fetchSummary(start, end)} style={{ padding: '6px 12px' }}>Search</button>
        </div>
      </div>

      {loading ? (

        <p>Loading...</p>

      ) : (

        <table className="summary-table">

          <thead>

            <tr>
              <th>User</th>
              <th>Days Filled</th>
              <th>Actions</th>
            </tr>

          </thead>

          <tbody>

            {summaries.map((s) => (

              <tr key={s.userId}>

                <td>{s.username}</td>

                <td>{s.daysFilled}</td>

                <td className="actions-cell">

                  <FaEye
                    title="View Range Summary"
                    className="view-icon"
                    onClick={() => handleViewUser(s.userId, s.username)}
                  />



                </td>

              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>

  );

}