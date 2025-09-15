import React, { useEffect, useState } from 'react';
import api from '../api';
import './CreateSprint.css';
import { useNavigate } from 'react-router-dom';

const CreateSprint = () => {
  const [features, setFeatures] = useState([]);
  const navigate = useNavigate();
  const [sprint, setSprint] = useState({
    name: '',
    startDate: '',
    endDate: '',
    featureId: ''
  });

  useEffect(() => {
    api.get('/features', { withCredentials: true })
      .then(res => setFeatures(res.data))
      .catch(err => console.error('Error fetching features:', err));
  }, []);

const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === 'featureId') {
    setSprint(prev => ({ ...prev, feature: { id: parseInt(value) } }));
  } else {
    setSprint(prev => ({ ...prev, [name]: value }));
  }
};

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting sprint:', sprint);
    api.post('/sprints/create-sprints', sprint, { withCredentials: true })
      .then(() => {
        alert('sprint created sucessfully',navigate('/manage-sprints'));
        setSprint({ name: '', startDate: '', endDate: '', featureId: '',status:'' });
      })
      .catch(err => {
        console.error('Error creating sprint:', err);
        alert('Failed to create sprint.');
      });
  };

  return (
    <div className="create-sprint-container">
      <button className="back-btn" onClick={() => navigate(-1)}>⬅ Back</button>
      <h2>Create Sprint</h2>
      <form onSubmit={handleSubmit} className="sprint-form">
        <div className="form-group">
          <label>Sprint Name:</label>
          <input type="text" name="name" value={sprint.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Start Date:</label>
          <input type="date" name="startDate" value={sprint.startDate} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>End Date:</label>
          <input type="date" name="endDate" value={sprint.endDate} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Feature ID:</label>
       <select name="featureId" onChange={handleChange} required>
  <option value="">-- Select Feature --</option>
  {features.map(feature => (
    <option key={feature.id} value={feature.id}>
      {feature.name} (ID: {feature.id})
    </option>
  ))}
</select>
        </div>

        <button type="submit" className="submit-btn">Create Sprint</button>
      </form>
    </div>
  );
};

export default CreateSprint;
