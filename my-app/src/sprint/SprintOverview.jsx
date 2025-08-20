import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SprintOverview.css';
import { useParams, useNavigate } from 'react-router-dom';

const SprintOverview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [data, setData] = useState({ userStories: [] });

  useEffect(() => {
    axios
      .get(`http://localhost:8080/api/sprints/${id}/overview`, { withCredentials: true })
      .then(res => setData(res.data))
      .catch(err => {
        console.error(err);
        setError('Failed to load sprint overview.');
      });
  }, [id]);

  if (error) return <div>{error}</div>;
  if (!data) return <div>Loading...</div>;

  const {
    sprint = {},
    users = [],
    userStories = []
  } = data;

  const userPerformance = users.map(user => {
    const userStoriesForUser = userStories.filter(s => s.userstory?.id === user.id);
    const done = userStoriesForUser.filter(s => s.status === 'Done');
    const totalPoints = userStoriesForUser.reduce((sum, s) => sum + (s.storypoints || 0), 0);
    const donePoints = done.reduce((sum, s) => sum + (s.storypoints || 0), 0);
    return {
      ...user,
      totalStories: userStoriesForUser.length,
      doneStories: done.length,
      totalPoints,
      donePoints
    };
  });

  const statusGroups = {
    'To Do': [],
    'In Progress': [],
    'Done': []
  };

  userStories.forEach(story => {
    statusGroups[story.status]?.push(story);
  });

  return (
    <div className="sprint-overview-container">
      <div className="overview-header">
        <h2>📊 Sprint Overview: {sprint.name}</h2>
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <section className="sprint-details">
        <p><strong>Start:</strong> {sprint.startDate || 'N/A'}</p>
        <p><strong>End:</strong> {sprint.endDate || 'N/A'}</p>
        <p><strong>Feature:</strong> {sprint.feature?.name || 'N/A'}</p>
        <p><strong>Total Story Points:</strong> {userStories.reduce((sum, s) => sum + (s.storypoints || 0), 0)}</p>
        <p><strong>Achieved Story Points:</strong> {
          userStories
            .filter(story => story.status === 'Done')
            .reduce((sum, s) => sum + (s.storypoints || 0), 0)
        }</p>
      </section>

      <section className="users-section">
        <h3>👥 Assigned Users</h3>
        {users.length > 0 ? (
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th><th>Role</th><th>Total</th><th>Done</th><th>Story Points</th><th>Achieved</th>
              </tr>
            </thead>
            <tbody>
              {userPerformance.map(user => (
                <tr key={user.id}>
                  <td>{user.preferred_name}</td>
                  <td>{user.role}</td>
                  <td>{user.totalStories}</td>
                  <td>{user.doneStories}</td>
                  <td>{user.totalPoints}</td>
                  <td>{user.donePoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No assigned users found.</p>
        )}
      </section>

      <section className="status-section">
        <h3>📌 User Stories by Status</h3>
        {Object.entries(statusGroups).map(([status, stories]) => (
          <div key={status} className="story-table-group">
            <h4 className="status-header">{status} ({stories.length})</h4>
            <table className="story-status-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Acceptance Criteria</th>
                  <th>Story Points</th>
                  <th>Assigned To</th>
                  <th>Reported To</th>
                </tr>
              </thead>
              <tbody>
                {stories.map(story => (
                  <tr key={story.id}>
                    <td>{story.id}</td>
                    <td>{story.description}</td>
                    <td>{story.acceptancecriteria || 'N/A'}</td>
                    <td>{story.storypoints}</td>
                    <td>{story.userstory?.preffered_name || 'N/A'}</td>
                    <td>{story.reportedTo?.prefferred_name || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>
    </div>
  );
};
export default SprintOverview;
