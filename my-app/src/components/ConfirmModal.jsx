import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmStyle = 'danger' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0, zIndex: 100 }}>
            <div className="card" onClick={e => e.stopPropagation()} style={{ width: 400, maxWidth: '90%', animation: 'fadeIn 0.2s ease-out' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '16px' }}>
                        {confirmStyle === 'danger' && <AlertTriangle size={18} color="var(--color-danger)" />}
                        {title}
                    </h3>
                    <button className="btn btn-sm btn-secondary" onClick={onClose} style={{ padding: '4px', border: 'none', background: 'transparent' }} aria-label="Close">
                        <X size={16} />
                    </button>
                </div>
                <div className="card-body" style={{ padding: '16px 20px', fontSize: '14px', lineHeight: '1.5' }}>
                    {message}
                </div>
                <div className="card-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--color-bg-alt)', borderRadius: '0 0 8px 8px' }}>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button className={`btn btn-${confirmStyle}`} onClick={() => { onConfirm(); onClose(); }}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
