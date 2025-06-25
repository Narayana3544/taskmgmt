// src/pages/FeatureList.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import './FeatureList.css';


  
const FeatureList = ({ onEdit, onDelete }) => {
  const { projectId } = useParams();
  const [features, setFeatures] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`http://localhost:8080/api/features/project/${projectId}`)
      .then(res => {
        setFeatures(res.data);
      })
      .catch(err => {
        console.error('Error fetching features:', err);
      });
  }, [projectId]);

  return (
    <div className="features-list-page">
      <h2>Features for Project ID: {projectId}</h2>
      {features.length === 0 ? (
        <p>No features found for this project.</p>
      ) : (
        <ul className="feature-list">
          {features.map((feature) => (
            <li key={feature.id}>
                <h4>Feature id:{feature.id}</h4> 
              <h4>Feature Name:{feature.name}</h4>
              <p>Description:{feature.descriptor}</p>
              <p><strong>Status:</strong> {feature.status}</p>
               <div className="feature-actions horizontal-buttons">
                <button onClick={() => onEdit(feature.id)} className="edit-btn">Edit</button>
                <button onClick={() => onDelete(feature.id)} className="delete-btn">Delete</button>
                <button onClick={() => navigate(`/features/${feature.id}/userstories`)} className="view-btn">
                  View User Stories
                </button>
                <button onClick={() => navigate(`/features/${feature.id}/add-userstory`)} className="add-btn">
                  Add User Story
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FeatureList;
