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
    axios.get(`http://localhost:8080/api/userstories/unassigned`)
      .then((res) => setStories(res.data))
      .catch((err) => console.error('Error fetching user stories:', err));

    axios.get(`http://localhost:8080/api/sprints/${sprintId}/capacity`)
      .then(res => setCapacity(res.data))
      .catch(err => console.error('Error getting sprint capacity:', err));
  }, [sprintId]);

  const toggleStory = (story) => {
    if (selectedStoryIds.includes(story.id)) {
      setSelectedStoryIds(selectedStoryIds.filter(id => id !== story.id));
      setUsedPoints(prev => prev - story.storyPoints);
    } else {
      if (usedPoints + story.storyPoints <= capacity) {
        setSelectedStoryIds([...selectedStoryIds, story.id]);
        setUsedPoints(prev => prev + story.storyPoints);
      } else {
        alert('Sprint capacity exceeded.');
      }
    }
  };

  const handleAssign = () => {
    if (selectedStoryIds.length === 0) {
      alert('Please select at least one story.');
      return;
    }

    axios.post(`http://localhost:8080/api/sprints/${sprintId}/assign-stories`, selectedStoryIds)
      .then(() => {
        alert('Stories assigned successfully!');
        navigate('/manage-sprints');
      })
      .catch(err => {
        console.error('Error assigning stories:', err);
        alert('Failed to assign stories.');
      });
  };

  return (
    <div className="assign-stories-page">
      <h2>📌 Assign Stories to Sprint ID: {sprintId}</h2>
      <p>Capacity: {capacity} SP | Used: {usedPoints} SP | Remaining: {capacity - usedPoints} SP</p>

      <ul className="story-list">
        {stories.map(story => (
          <li key={story.id}>
            <label>
              <input
                type="checkbox"
                checked={selectedStoryIds.includes(story.id)}
                onChange={() => toggleStory(story)}
              />
              {story.description} (ID: {story.id}) — {story.storyPoints} SP
            </label>
          </li>
        ))}
      </ul>

      <button className="assign-btn" onClick={handleAssign}>✅ Assign Stories</button>
    </div>
  );
};

export default AssignStoriesToSprint;
