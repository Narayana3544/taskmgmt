import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AssignedStories = () => {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8080/api/stories/assigned', { withCredentials: true })
      .then(res => setStories(res.data))
      .catch(err => console.error('Error fetching assigned stories:', err));
  }, []);

  const handleStatusChange = (id, newStatus) => {
    setStories(prev =>
      prev.map(story =>
        story.id === id ? { ...story, status: newStatus } : story
      )
    );
  };

  const handleCommentChange = (id, comment) => {
    setStories(prev =>
      prev.map(story =>
        story.id === id ? { ...story, comment } : story
      )
    );
  };

  const handleUpdate = (id) => {
    const story = stories.find(s => s.id === id);
    axios.put(`http://localhost:8080/api/stories/${id}/update`, {
      status: story.status,
      comment: story.comment
    }, { withCredentials: true })
      .then(() => alert('Updated successfully!'))
      .catch(err => alert('Update failed!'));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📋 Assigned User Stories</h2>
      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse border border-gray-700 text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Description</th>
              <th className="p-2 border">Acceptance Criteria</th>
              <th className="p-2 border">Points</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Reported To</th>
              <th className="p-2 border">Comment</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {stories.map((story) => (
              <tr key={story.id} className="border-b">
                <td className="p-2 border">{story.id}</td>
                <td className="p-2 border">{story.description}</td>
                <td className="p-2 border">{story.acceptanceCriteria}</td>
                <td className="p-2 border">{story.storyPoints}</td>
                <td className="p-2 border">
                  <select
                    value={story.status}
                    onChange={(e) => handleStatusChange(story.id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </td>
                <td className="p-2 border">{story.reportedTo || 'N/A'}</td>
                <td className="p-2 border">
                  <input
                    type="text"
                    value={story.comment || ''}
                    onChange={(e) => handleCommentChange(story.id, e.target.value)}
                    className="border px-2 py-1 w-full"
                  />
                </td>
                <td className="p-2 border text-center">
                  <button
                    onClick={() => handleUpdate(story.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-800"
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
            {stories.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center p-4">No assigned stories found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignedStories;
