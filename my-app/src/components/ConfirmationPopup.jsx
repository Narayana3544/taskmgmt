import React from 'react';
import './ConfirmationPopup.css';

export default function ConfirmationPopup({ isOpen, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="confirm-modal-box">
        <p>{message}</p>
        <div className="popup-actions">
          <button className="confirm-btn" onClick={onConfirm}>Yes</button>
          <button className="cancel-btn" onClick={onCancel}>No</button>
        </div>
      </div>
    </div>
  );
}
