import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AssignedStories.css';

const AssignedStories = () => {
  const [stories, setStories] = useState([]);

  useEffect(() => {
axios.get('http://localhost:8080/api/user/assigned-stories', { withCredentials: true })
      .then(res => setStories(res.data))
      .catch(err => console.error('Error fetching assigned stories:', err));
  }, []);

  const updateStatus = (storyId, status) => {
    axios.patch(`http://localhost:8080/api/userstories/${storyId}/status`, { status }, { withCredentials: true })
      .then(() => {
        setStories(prev =>
          prev.map(s => (s.id === storyId ? { ...s, status } : s))
        );
      })
      .catch(() => alert('Failed to update status'));
  };

  const addComment = (storyId, comment) => {
    if (!comment.trim()) return;
    axios.post(`http://localhost:8080/api/userstories/${storyId}/comments`, { text: comment }, { withCredentials: true })
      .then(() => alert('Comment added'))
      .catch(() => alert('Failed to add comment'));
  };

  return (
    <div className="assigned-container">
      <h2>📋 Your Assigned User Stories</h2>
      <table className="assigned-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Description</th>
            <th>Criteria</th>
            <th>Points</th>
            <th>Reported To</th>
            <th>Status</th>
            <th>Comment</th>
            <th>Action</th>
            <th>Sprint</th>
          </tr>
        </thead>
        <tbody>
          {stories.map(story => (
            <tr key={story.id}>
              <td>{story.id}</td>
              <td>{story.description}</td>
              <td>{story.acceptancecriteria}</td>
              <td>{story.storypoints}</td>
              <td>{story.userstory?.preffered_name || 'N/A'}</td>
              <td>{story.sprint?.name || 'N/A'}</td>
              <td>
                <select
                  value={story.status}
                  onChange={e => updateStatus(story.id, e.target.value)}
                >
                  <option>To Do</option>
                  <option>In Progress</option>
                  <option>Done</option>
                </select>
              </td>
              <td>
                <textarea
                  rows={1}
                  placeholder="Enter comment"
                  onBlur={e => addComment(story.id, e.target.value)}
                />
              </td>
              <td>
                <button onClick={() => alert(JSON.stringify(story, null, 2))}>
                  🔍 View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssignedStories;
