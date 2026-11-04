import React from 'react';
import '../dashboard.css';

const SkeletonLoader = () => {
  return (
    <div className="project-dashboard-root" aria-label="Loading dashboard" role="status">
      {/* Header bar skeleton */}
      <div className="dash-card" style={{ marginBottom: 16, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '40%' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="dash-skeleton" style={{ width: 60, height: 22 }} />
              <div className="dash-skeleton" style={{ width: 80, height: 22 }} />
              <div className="dash-skeleton" style={{ width: 90, height: 22 }} />
            </div>
            <div className="dash-skeleton" style={{ width: 260, height: 28 }} />
            <div className="dash-skeleton" style={{ width: 340, height: 16 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="dash-skeleton" style={{ width: 90, height: 34 }} />
            <div className="dash-skeleton" style={{ width: 100, height: 34 }} />
            <div className="dash-skeleton" style={{ width: 110, height: 34 }} />
          </div>
        </div>
      </div>

      {/* KPI Strip Skeleton (5 cards) */}
      <div className="dashboard-grid-12" style={{ marginBottom: 16 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="dash-card"
            style={{
              gridColumn: i <= 2 ? 'span 3' : 'span 2',
              padding: 16,
              minHeight: 110,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="dash-skeleton" style={{ width: 80, height: 14 }} />
              <div className="dash-skeleton" style={{ width: 24, height: 24, borderRadius: '50%' }} />
            </div>
            <div className="dash-skeleton" style={{ width: 90, height: 32, margin: '8px 0' }} />
            <div className="dash-skeleton" style={{ width: 110, height: 12 }} />
          </div>
        ))}
      </div>

      {/* Main Analytics Row Skeleton (8-col pipeline + 4-col donut) */}
      <div className="dashboard-grid-12" style={{ marginBottom: 16 }}>
        <div className="dash-card dash-col-8" style={{ minHeight: 280 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="dash-skeleton" style={{ width: 140, height: 18 }} />
            <div className="dash-skeleton" style={{ width: 90, height: 14 }} />
          </div>
          <div className="dash-skeleton" style={{ width: '100%', height: 44, borderRadius: 8, margin: '24px 0' }} />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <div key={k} className="dash-skeleton" style={{ width: 85, height: 16 }} />
            ))}
          </div>
        </div>

        <div className="dash-card dash-col-4" style={{ minHeight: 280 }}>
          <div className="dash-skeleton" style={{ width: 130, height: 18, marginBottom: 20 }} />
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180 }}>
            <div className="dash-skeleton" style={{ width: 150, height: 150, borderRadius: '50%' }} />
          </div>
        </div>
      </div>

      {/* Sprint + Team Workload Skeleton */}
      <div className="dashboard-grid-12" style={{ marginBottom: 16 }}>
        <div className="dash-card dash-col-6" style={{ minHeight: 260 }}>
          <div className="dash-skeleton" style={{ width: 120, height: 18, marginBottom: 16 }} />
          <div className="dash-skeleton" style={{ width: '100%', height: 180 }} />
        </div>
        <div className="dash-card dash-col-6" style={{ minHeight: 260 }}>
          <div className="dash-skeleton" style={{ width: 120, height: 18, marginBottom: 16 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4].map((m) => (
              <div key={m} className="dash-skeleton" style={{ width: '100%', height: 36 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;

