import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SprintOverview.css';
import { useParams } from 'react-router-dom';

const SprintOverview = () => {
  const { id } = useParams();

  const [error, setError] = useState('');
const [data, setData] = useState({ userStories: [] }); 

  useEffect(() => {
    axios.get(`http://localhost:8080/api/sprints/${id}/overview`, { withCredentials: true })
      .then(res => setData(res.data))
      .catch(err => {
        console.error(err);
        setError('Failed to load sprint overview.');
      });
  }, [id]);

  if (error) return <div>{error}</div>;
  if (!data) return <div>Loading...</div>;

//   const { sprint, users, userStories } = data;
 const {
  sprint = {},
  users = [],
  userStories = []
} = data;

const userPerformance = (users || []).map(user => {
  const userStoriesForUser = (userStories || []).filter(s => s.userstory?.id === user.id);
  const done = userStoriesForUser.filter(s => s.status === 'Done');
  const totalPoints = userStoriesForUser.reduce((sum, s) => sum + s.storypoints, 0);
  const donePoints = done.reduce((sum, s) => sum + s.storypoints, 0);
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

  const achievedPoints = userStories
    .filter(story => story.status === 'Done')
    .reduce((sum, s) => sum + s.storypoints, 0);

  return (
    <div className="sprint-overview-container">
      <h2>📊 Sprint Overview: {sprint.name}</h2>

      <section className="sprint-details">
        <p><strong>Start:</strong> {sprint.startDate}</p>
        <p><strong>End:</strong> {sprint.endDate}</p>
        <p><strong>Feature:</strong> {sprint.feature?.name}</p>
        <p><strong>Total Story Points:</strong> {userStories.reduce((sum, s) => sum + s.storypoints, 0)}</p>
        <p><strong>Achieved Story Points:</strong> {achievedPoints}</p>
      </section>

      <section className="users-section">
        <h3>👥 Assigned Users</h3>
        <table>
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
      </section>

      <section className="status-section">
        {Object.entries(statusGroups).map(([status, stories]) => (
          <div key={status}>
            <h4>{status} ({stories.length})</h4>
          {data?.assignedUsers?.length > 0 && (
  <ul>
    {data.assignedUsers.map(user => (
      <li key={user.id}>{user.preferred_name}</li>
    ))}
  </ul>
)}

{data?.userStories?.length > 0 && (
  <ul>
    {data.userStories.map(story => (
      <li key={story.id}>{story.description} - {story.status}</li>
    ))}
  </ul>
)}
          </div>
        ))}
      </section>
    </div>
  );
};

export default SprintOverview;
