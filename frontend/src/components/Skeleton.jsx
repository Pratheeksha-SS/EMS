import React from 'react';

const Skeleton = ({ className = '', style = {}, ...props }) => (
  <div 
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    style={{
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'loading 1.5s infinite',
      ...style
    }}
    {...props}
  />
);

export const SkeletonCard = () => (
  <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
      <Skeleton style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
      <div>
        <Skeleton style={{ height: '28px', width: '80px' }} />
        <Skeleton style={{ height: '14px', width: '120px', marginTop: '4px' }} />
      </div>
    </div>
  </div>
);

export const SkeletonStatsGrid = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
    {Array(4).fill().map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonTable = () => (
  <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
    <div style={{ background: '#f8fafc', padding: '16px', textAlign: 'left' }}>
      <Skeleton style={{ height: '20px', width: '200px' }} />
    </div>
    <div style={{ padding: '16px' }}>
      {Array(5).fill().map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '8px', height: '20px' }}>
          <Skeleton style={{ flex: 2 }} />
          <Skeleton style={{ flex: 1 }} />
          <Skeleton style={{ flex: 1 }} />
          <Skeleton style={{ flex: 1.5 }} />
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
