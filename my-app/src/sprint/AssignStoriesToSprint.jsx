import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './AssignStoriesToSprint.css';

const AssignStoriesToSprint = () => {
  const { sprintId } = useParams();
  const [stories, setStories] = useState([]);
  const [selectedStoryIds, setSelectedStoryIds] = useState([]);
  const [capacity, setCapacity] = useState(0);
  const [usedPoints, setUsedPoints] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`http://localhost:8080/api/features/userstories`, { withCredentials: true })
      .then((res) => setStories(res.data))
      .catch((err) => console.error('Error fetching user stories:', err));

    axios.get(`http://localhost:8080/api/sprints/${sprintId}`, { withCredentials: true })
      .then(res => {
        const userCount = res.data.users?.length || 0;
        setCapacity(userCount * 10);
      })
      .catch(err => console.error('Error getting sprint capacity:', err));
  }, [sprintId]);

  const toggleStory = (story) => {
    const isSelected = selectedStoryIds.includes(story.id);
    if (isSelected) {
      setSelectedStoryIds(prev => prev.filter(id => id !== story.id));
      setUsedPoints(prev => prev - story.storypoints);
    } else {
      if (usedPoints + story.storypoints <= capacity) {
        setSelectedStoryIds(prev => [...prev, story.id]);
        setUsedPoints(prev => prev + story.storypoints);
      } else {
        alert('⚠️ Sprint capacity exceeded.');
      }
    }
  };

  const handleAssign = () => {
    if (selectedStoryIds.length === 0) {
      alert('Please select at least one story.');
      return;
    }

    axios.post(`http://localhost:8080/api/sprints/${sprintId}/assign-stories`, selectedStoryIds, {
      withCredentials: true
    })
      .then(() => {
        alert('✅ Stories assigned successfully!');
        navigate('/manage-sprints');
      })
      .catch(err => {
        console.error('Error assigning stories:', err);
        alert('❌ Failed to assign stories.');
      });
  };

  return (
    <div className="assign-stories-page">
      <h2>📌 Assign Stories to Sprint <span className="sprint-id">#{sprintId}</span></h2>
      <div className="capacity-info">
        <span>Capacity: <strong>{capacity} SP</strong></span>
        <span>Used: <strong>{usedPoints} SP</strong></span>
        <span>Remaining: <strong>{capacity - usedPoints} SP</strong></span>
      </div>

      <div className="story-list">
        {stories.map(story => (
          <div key={story.id} className={`story-card ${selectedStoryIds.includes(story.id) ? 'selected' : ''}`}>
            <label>
              <input
                type="checkbox"
                checked={selectedStoryIds.includes(story.id)}
                onChange={() => toggleStory(story)}
              />
              <div className="story-content">
                <p className="story-title">📝 {story.description}</p>
                <p><strong>ID:</strong> {story.id}</p>
                <p><strong>Points:</strong> {story.storypoints}</p>
                <p><strong>Status:</strong> {story.status}</p>
              </div>
            </label>
          </div>
        ))}
      </div>

      <button className="assign-btn" onClick={handleAssign}>✅ Assign Selected Stories</button>
    </div>
  );
};

export default AssignStoriesToSprint;
