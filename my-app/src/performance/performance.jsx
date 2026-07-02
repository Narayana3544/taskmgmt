import React, { useState, useEffect } from 'react';
import api from '../api';
import './ViewPerformanceReviews.css';
import { useNavigate } from 'react-router-dom';
import { FaEdit } from "react-icons/fa";

const ViewPerformanceReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const fetchAllReviews = () => {
    api.get('/performance-reviews', { withCredentials: true })
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setReviews(data);
        setFilteredReviews(data);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load performance reviews');
      });
  };

  const handleSearch = () => {
    if (!employeeSearch.trim()) {
      setFilteredReviews(reviews);
    } else {
      const filtered = reviews.filter(
        r =>
          r.employee?.name
            ?.toLowerCase()
            .includes(employeeSearch.toLowerCase())
      );
      setFilteredReviews(filtered);
    }
  };

  const handleStatusChange = (reviewId, newStatus) => {
    api.patch(
      `/performance-reviews/${reviewId}/status`,
      { status: newStatus },
      { withCredentials: true }
    )
      .then(() => {
        const updated = filteredReviews.map(review =>
          review.id === reviewId
            ? { ...review, status: newStatus }
            : review
        );
        setFilteredReviews(updated);
      })
      .catch(() => alert('Failed to update status'));
  };

  return (
    <div className="view-performance-container">
      <div className="header-row">
        <h2>📊 Performance Reviews</h2>
        <button
          className="create-btn"
          onClick={() => navigate('/performance-review')}
        >
          + Create Review
        </button>
      </div>

      <div className="search-form">
        <input
          type="text"
          placeholder="Search by Employee Name"
          value={employeeSearch}
          onChange={(e) => setEmployeeSearch(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {error && <p className="error">{error}</p>}

      {filteredReviews.length > 0 ? (
        <div className="table-section">
          <table className="performance-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>Goals</th>
                <th>Achievements</th>
                <th>Self Rating</th>
                <th>Manager Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredReviews.map(review => (
                <tr key={review.id}>
                  <td>{review.id}</td>
                  <td>{review.employee?.name}</td>
                  <td>{review.goals}</td>
                  <td>{review.achievements}</td>
                  <td>{review.selfRating || '-'}</td>
                  <td>{review.managerRating || '-'}</td>

                  <td>
                    <select
                      value={review.status}
                      onChange={(e) =>
                        handleStatusChange(review.id, e.target.value)
                      }
                    >
                      <option>Draft</option>
                      <option>Submitted</option>
                      <option>Reviewed</option>
                    </select>
                  </td>

                  <td>
                    <button
                      className="edit-btn"
                      onClick={() =>
                        navigate(`/edit-performance-review/${review.id}`)
                      }
                    >
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No performance reviews found.</p>
      )}
    </div>
  );
};

export default ViewPerformanceReviews;
