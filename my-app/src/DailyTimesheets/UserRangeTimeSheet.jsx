import React, { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import "./UserRangeTimeSheet.css";
import { FaEye } from "react-icons/fa";

export default function UserRangeTimeSheet() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [entries, setEntries] = useState([]);
  const [dailyDetails, setDailyDetails] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  // Mock holidays — replace with API if available
  const holidays = ["2025-09-25", "2025-10-02"];

  const isWeekend = (dateStr) => {
    const day = new Date(dateStr).getDay();
    return day === 0 || day === 6;
  };

  const isHoliday = (dateStr) => holidays.includes(dateStr);

  const fetchRange = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/timesheets/range-summary", {
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

  const handleViewDay = async (date) => {
    if (new Date(date) > new Date(today)) {
      alert("Cannot view future dates.");
      return;
    }

    setLoadingDaily(true);
    try {
      const res = await api.get(`/timesheets/day/${date}`, { withCredentials: true });
      setDailyDetails(res.data);
      setSelectedDate(date);
    } catch (err) {
      console.error("Error fetching daily entries:", err);
      alert("No entries found (assumed leave)");
      setDailyDetails([]);
      setSelectedDate(date);
    }
    setLoadingDaily(false);
  };
const formatHours = (entry) => {
    // Prefer backend-provided formatted string if available
    if (entry?.totalHoursAndMinutes) return entry.totalHoursAndMinutes;

    // Fallback: compute from totalHours (decimal)
    const th = entry?.totalHours;

    if (th === null || th === undefined || Number.isNaN(Number(th))) return "-";

    // round to nearest minute to avoid weird fractions
    const totalMinutes = Math.round(Number(th) * 60);
    const hoursPart = Math.floor(totalMinutes / 60);
    const minutesPart = Math.abs(totalMinutes % 60);

    return `${hoursPart}h ${String(minutesPart).padStart(2, "0")}m`;
  };
  return (
    <div className="timesheet-container">
      <h2>My Timesheets</h2>

      <div className="range-picker">
        <label>
          Start Date:
          <input
            type="date"
            max={today}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label>
          End Date:
          <input
            type="date"
            max={today}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>

        <button onClick={fetchRange}>Fetch</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table className="timesheet-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Hours</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
                        {entries.map((entry, idx) => {
            const weekend = isWeekend(entry.date);
            const holiday = isHoliday(entry.date);

            let rowClass = "";
            let statusText = entry.status; // default from backend

            // Only override if no work done
            if (holiday && entry.totalHours === 0) {
              rowClass = "holiday-row";
              statusText = "Holiday";
            } else if (weekend && entry.totalHours === 0) {
              rowClass = "weekend-row";
              statusText = "Weekend";
            } else if (entry.status === "Leave") {
              rowClass = "leave-row";
              statusText = "Leave";
            } else if (entry.status === "Worked") {
              rowClass = "worked-row"; // optional highlight for worked days
              statusText = "Worked";
            }

            return (
              <tr key={idx} className={rowClass}>
                <td>{entry.date}</td>
               <td>{formatHours(entry)}</td>
                <td>{statusText}</td>
                <td>
                  {/* <button onClick={() => handleViewDay(entry.date)}>View</button> */}
                  <div className="tooltip">
                                    <FaEye
                                      className="icon-btn view-icon"
                                      onClick={() => handleViewDay(entry.date)}
                                    />
                                    <span className="tooltip-text">View</span>
                   </div>
                </td>
                
              </tr>
            );
          })}
            </tbody>
          </table>

          {selectedDate && (
            <div className="daily-details">
              <h3>Details for {selectedDate}</h3>
              {loadingDaily ? (
                <p>Loading daily entries...</p>
              ) : dailyDetails.length > 0 ? (
                <table className="daily-table">
                  <thead>
                    <tr>
                      <th>Start</th>
                      <th>End</th>
                      <th>Task</th>
                      <th>Work Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyDetails.map((entry, idx) => (
                      <tr key={idx}>
                        <td>{entry.start_time || "-"}</td>
                        <td>{entry.end_time || "-"}</td>
                        <td>{entry.task?.userstory || "-"}</td>
                        <td>{entry.workType?.description || "-"}</td>
                        <td>{entry.description || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-entries">No records found (assumed leave)</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}