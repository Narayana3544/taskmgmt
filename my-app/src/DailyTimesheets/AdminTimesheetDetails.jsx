import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "../api";
import { FaEye, FaEdit } from 'react-icons/fa';
import "./AdminAllTimesheet.css";

export default function AdminTimesheetDetails() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");
  const userName = searchParams.get("name") || `User #${userId}`;

  const [entries, setEntries] = useState([]);
  const [taskSummary, setTaskSummary] = useState([]);
  
  const [dailyDetails, setDailyDetails] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  
  const [taskLogs, setTaskLogs] = useState([]);
  const [selectedTaskObj, setSelectedTaskObj] = useState(null);
  
  const [viewMode, setViewMode] = useState("date"); // 'date' or 'task'
  const [loading, setLoading] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);

  useEffect(() => {
    if (userId && startDate && endDate) {
      fetchRange(userId, startDate, endDate);
    }
  }, [userId, startDate, endDate]);

  const fetchRange = async (userId, start, end) => {
    setLoading(true);
    try {
      const res = await api.get(`/timesheets/range-summary/${userId}`, {
        params: { start, end },
        withCredentials: true,
      });
      setEntries(res.data);
      
      const logRes = await api.get(`/timesheet/range-summary-with-logs/${userId}`, {
        params: { start, end },
        withCredentials: true,
      });
      
      const tMap = {};
      logRes.data.forEach(day => {
        if (day.logs) {
          day.logs.forEach(log => {
            const tId = log.task?.id || 'unknown';
            if (!tMap[tId]) {
              tMap[tId] = { task: log.task, totalMinutes: 0, logs: [] };
            }
            tMap[tId].logs.push({...log, date: day.date});
            
            if (log.start_time && log.end_time) {
              const s = new Date(`1970-01-01T${log.start_time}`);
              const e = new Date(`1970-01-01T${log.end_time}`);
              tMap[tId].totalMinutes += (e - s) / 60000;
            }
          });
        }
      });
      
      setTaskSummary(Object.values(tMap));
    } catch (err) {
      console.error("Error fetching range summary:", err);
    }
    setLoading(false);
  };

  const handleViewDay = async (date) => {
    setLoadingDaily(true);
    try {
      const res = await api.get(`/timesheets/day/${userId}/${date}`, {
        withCredentials: true,
      });
      const sorted = res.data.sort((a, b) =>
        a.start_time?.localeCompare(b.start_time)
      );
      setDailyDetails(sorted);
      setSelectedDate(date);
    } catch (err) {
      console.error("Error fetching daily details:", err);
      setDailyDetails([]);
      setSelectedDate(null);
    }
    setLoadingDaily(false);
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

  const formatMinutes = (m) => {
    if (m === null || m === undefined || Number.isNaN(Number(m))) return "-";
    const hoursPart = Math.floor(m / 60);
    const minutesPart = Math.round(m % 60);
    return `${hoursPart}h ${String(minutesPart).padStart(2, "0")}m`;
  };

  const handleBack = () => {
    if (selectedDate || selectedTaskObj) {
      setSelectedDate(null);
      setSelectedTaskObj(null);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="admin-all-container">
      <div style={{ marginBottom: "20px" }}>
        <h2>Timesheet Details for {userName}</h2>
      </div>

      {!selectedDate && !selectedTaskObj ? (
        <div className="range-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '10px' }}>
            <h3>Details from {startDate} to {endDate}</h3>
            <div>
              <button 
                className={`btn-global ${viewMode === 'date' ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => setViewMode('date')}
              >
                By Date
              </button>
              <button 
                className={`btn-global ${viewMode === 'task' ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => setViewMode('task')}
                style={{ marginLeft: '10px' }}
              >
                By Task
              </button>
              <button className="btn-global btn-secondary" onClick={handleBack} style={{ marginLeft: '10px' }}>Back</button>
            </div>
          </div>
          
        {loading ? (
          <p>Loading...</p>
        ) : viewMode === 'date' ? (
          <table className="timesheet-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Hours</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, idx) => (
                <tr key={idx}>
                  <td>{e.date}</td>
                  <td>{formatHours(e)}</td>
                  <td>
                    <div className="action-buttons">
                      <div className="tooltip">
                        <FaEye
                          className="icon-btn view-icon"
                          onClick={() => handleViewDay(e.date)}
                        />
                        <span className="tooltip-text">View</span>
                      </div>
                      <div className="tooltip">
                        <FaEdit
                          className="icon-btn edit-icon"
                          onClick={() => navigate(`/timesheet/edit/${userId}/${e.date}?name=${encodeURIComponent(userName)}`)}
                        />
                        <span className="tooltip-text">Edit</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="timesheet-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Total Hours</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {taskSummary.map((t, idx) => (
                <tr key={idx}>
                  <td style={{ maxWidth: '300px', whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
                    {t.task ? `#${t.task.id} - ${t.task.userstory}` : "Unknown Task"}
                  </td>
                  <td>{formatMinutes(t.totalMinutes)}</td>
                  <td>
                    <div className="action-buttons">
                      <div className="tooltip">
                        <FaEye
                          className="icon-btn view-icon"
                          onClick={() => {
                            setSelectedTaskObj(t.task);
                            setTaskLogs(t.logs.sort((a, b) => a.date.localeCompare(b.date) || a.start_time?.localeCompare(b.start_time)));
                          }}
                        />
                        <span className="tooltip-text">View</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      ) : selectedDate ? (
        <div className="daily-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '15px' }}>
            <h3 style={{ margin: 0, flex: 1, wordWrap: 'break-word', overflowWrap: 'anywhere' }}>Logs for {selectedDate}</h3>
            <button className="btn-global btn-secondary" onClick={handleBack} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>Back</button>
          </div>
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
                {dailyDetails.map((d, i) => (
                  <tr key={i}>
                    <td>{d.start_time || "-"}</td>
                    <td>{d.end_time || "-"}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
                      {d.task?.userstory || "-"}
                    </td>
                    <td>{d.workType?.description || "-"}</td>
                    <td>{d.description}</td>
                    <td>
                      {["Official", "Time Off"].includes(d.workType?.description)
                        ? d.permissionGranted ? "Yes" : "No"
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No logs available for this date.</p>
          )}
        </div>
      ) : (
        <div className="daily-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '15px' }}>
            <h3 style={{ margin: 0, flex: 1, wordWrap: 'break-word', overflowWrap: 'anywhere' }}>Logs for Task: {selectedTaskObj ? `#${selectedTaskObj.id} - ${selectedTaskObj.userstory}` : "Unknown"}</h3>
            <button className="btn-global btn-secondary" onClick={handleBack} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>Back</button>
          </div>
          <table className="timesheet-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Start</th>
                <th>End</th>
                <th>Work Type</th>
                <th>Description</th>
                <th>Permission</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {taskLogs.map((d, i) => (
                <tr key={i}>
                  <td>{d.date}</td>
                  <td>{d.start_time || "-"}</td>
                  <td>{d.end_time || "-"}</td>
                  <td>{d.workType?.description || "-"}</td>
                  <td>{d.description}</td>
                  <td>
                    {["Official", "Time Off"].includes(d.workType?.description)
                      ? d.permissionGranted ? "Yes" : "No"
                      : "-"}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <div className="tooltip">
                        <FaEdit
                          className="icon-btn edit-icon"
                          onClick={() => navigate(`/timesheet/edit/${userId}/${d.date}?name=${encodeURIComponent(userName)}`)}
                        />
                        <span className="tooltip-text">Edit</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
