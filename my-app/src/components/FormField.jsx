import React from 'react';

const FormField = ({ label, required, hint, error, children, type = 'text', ...inputProps }) => {
    // If children are provided, render them directly (for select, textarea, etc.)
    if (children) {
        return (
            <div className="form-group">
                <label className="form-label">
                    {label}{required && ' *'}
                    {hint && <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 6 }}>({hint})</span>}
                </label>
                {children}
                {error && <div className="form-error">{error}</div>}
            </div>
        );
    }

    // Default: render an input
    return (
        <div className="form-group">
            <label className="form-label">
                {label}{required && ' *'}
                {hint && <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 6 }}>({hint})</span>}
            </label>
            <input type={type} className="form-input" required={required} {...inputProps} />
            {error && <div className="form-error">{error}</div>}
        </div>
    );
};

export default FormField;
