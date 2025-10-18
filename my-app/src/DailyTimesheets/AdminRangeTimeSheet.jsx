import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./AdminRangeTimeSheet.css";

export default function AdminRangeTimeSheet() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [entries, setEntries] = useState([]);
  const [dailyDetails, setDailyDetails] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const navigate = useNavigate();

  // Fetch all users for admin
  const fetchUsers = async () => {
    try {
      const res = await api.get("/users", { withCredentials: true });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      alert("Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch range summary for selected user
  const fetchRange = async () => {
  if (!selectedUser || !startDate || !endDate) {
    alert("Please select user and both start and end dates.");
    return;
  }

  setLoading(true);
  try {
    const res = await api.get(`/timesheets/range-summary/${selectedUser}`, {
      params: { start: startDate, end: endDate },
      withCredentials: true,
    });

    setEntries(res.data);
    setDailyDetails([]);
    setSelectedDate(null);
  } catch (err) {
    console.error("Error fetching range summary:", err);
    alert("Failed to fetch data.");
  }
  setLoading(false);
};
  // Fetch daily entries
  const handleViewDay = async (date) => {
  setLoadingDaily(true);
  try {
    const res = await api.get(`/timesheets/day/${selectedUser}/${date}`, {
      withCredentials: true,
    });

    // Sort entries by start_time
    const sortedDaily = res.data.sort((a, b) => {
      if (!a.start_time) return 1;
      if (!b.start_time) return -1;
      return a.start_time.localeCompare(b.start_time);
    });

    setDailyDetails(sortedDaily);
    setSelectedDate(date);
  } catch (err) {
    console.error("Error fetching daily entries:", err);
    alert("Failed to fetch daily details.");
    setDailyDetails([]);
    setSelectedDate(null);
  }
  setLoadingDaily(false);
};


  // Utility functions
  const isWeekend = (dateStr) => {
    const d = new Date(dateStr);
    return d.getDay() === 0 || d.getDay() === 6;
  };

  const isHoliday = (dateStr) => {
    // Add your logic to check holidays
    const holidays = ["2025-09-21", "2025-10-02","2025-10-03"]; // Example
    return holidays.includes(dateStr);
  };

  return (
    <div className="admin-timesheet-container">
      <h2>Admin Timesheets</h2>

      <div className="filters">
        <label>
          User:
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">Select User</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.first_name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>

        <button onClick={fetchRange}>Fetch</button>
      </div>
            <button
  onClick={() =>
    navigate("/timesheet-export", { state: { userId: selectedUser, startDate, endDate } })
  }
>
  Export to Excel
</button>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="timesheet-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Total Hours</th>
              {/* <th>Status</th> */}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.length > 0 ? (
              entries.map((entry, idx) => {
                const weekend = isWeekend(entry.date);
                const holiday = isHoliday(entry.date);

                let rowClass = "";
                let statusText = entry.status;

                if (holiday) {
                  rowClass = "holiday-row";
                  statusText = "Holiday";
                } else if (weekend) {
                  rowClass = "weekend-row";
                  statusText = "Weekend";
                } else if (entry.status === "Leave") {
                  rowClass = "leave-row";
                  statusText = "Leave";
                }

                return (
                  <tr key={idx} className={rowClass}>
                    <td>{entry.date}</td>
                    <td>{entry.totalHours.toFixed(2)} h</td>
                    {/* <td>{statusText}</td> */}
                    <td>
                      <button onClick={() => handleViewDay(entry.date)}>
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  No entries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Detailed view for selected date */}
      {selectedDate && (
        <div className="daily-details">
          <h3>Details for {selectedDate}</h3>
          {loadingDaily ? (
            <p>Loading...</p>
          ) : dailyDetails.length > 0 ? (
            <table className="timesheet-table">
              <thead>
                <tr>
                  <th>Start</th>
                  <th>End</th>
                  <th>Task</th>
                  <th>Work Type</th>
                  <th>Description</th>
                  <th>Permission</th>
                </tr>
              </thead>
              <tbody>
                {dailyDetails.map((entry, idx) => (
                  <tr key={idx}>
                    <td>{entry.start_time || "-"}</td>
                    <td>{entry.end_time || "-"}</td>
                    <td>{entry.task?.userstory || "-"}</td>
                    <td>{entry.workType?.description || "-"}</td>
                    <td>{entry.description}</td>
                    <td>
                      {["Official", "Time Off"].includes(
                        entry.workType?.description
                      )
                        ? entry.permissionGranted
                          ? "Yes"
                          : "No"
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No records for this day</p>
          )}
        </div>
      )}
    </div>
  );
}

