import React from 'react';
import './Pagination.css';
import { FaAngleDoubleLeft, FaAngleLeft, FaAngleRight, FaAngleDoubleRight } from 'react-icons/fa';

export default function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20, 50]
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="custom-pagination-wrapper">
      <div className="pagination-items-per-page">
        <span className="pagination-label">Items :</span>
        <select 
          className="pagination-select"
          value={itemsPerPage} 
          onChange={(e) => {
            onItemsPerPageChange(Number(e.target.value));
            onPageChange(1);
          }}
        >
          {itemsPerPageOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="pagination-info">
        {startItem} – {endItem} of {totalItems}
      </div>

      <div className="pagination-controls">
        <button 
          className="pagination-btn"
          onClick={() => onPageChange(1)} 
          disabled={currentPage === 1 || totalItems === 0}
        >
          <FaAngleDoubleLeft />
        </button>
        <button 
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1 || totalItems === 0}
        >
          <FaAngleLeft />
        </button>
        <button 
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages || totalItems === 0}
        >
          <FaAngleRight />
        </button>
        <button 
          className="pagination-btn"
          onClick={() => onPageChange(totalPages)} 
          disabled={currentPage === totalPages || totalItems === 0}
        >
          <FaAngleDoubleRight />
        </button>
      </div>
    </div>
  );
}
