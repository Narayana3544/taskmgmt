import React from 'react';

const PageHeader = ({ title, subtitle, children }) => {
    return (
        <div className="page-header">
            <div>
                <h1>{title}</h1>
                {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
            </div>
            {children && <div style={{ display: 'flex', gap: '12px' }}>{children}</div>}
        </div>
    );
};

export default PageHeader;
