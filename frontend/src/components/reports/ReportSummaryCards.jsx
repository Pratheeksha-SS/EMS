import React from 'react';

/* ─── ReportSummaryCard ─────────────────────────────────────────────
   Reusable stat card matching the HRMS design language.
   Props:
     label      : string
     value      : string | number
     sub        : string (optional secondary line)
     icon       : string (emoji or char)
     gradient   : CSS gradient string
     shadow     : rgba shadow color string
     trend      : { value: string, up: bool } optional
     onClick    : function (optional)
   ──────────────────────────────────────────────────────────────────── */

const ReportSummaryCard = ({
  label,
  value,
  sub,
  icon = '📊',
  gradient = 'linear-gradient(135deg, #F97316, #EA580C)',
  shadow = 'rgba(249,115,22,0.25)',
  trend,
  onClick,
  loading = false,
}) => {
  if (loading) {
    return (
      <div style={{
        background: '#F1F5F9',
        padding: '22px 24px',
        borderRadius: '16px',
        height: '130px',
        animation: 'summaryPulse 1.5s ease-in-out infinite',
      }} />
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: gradient,
        padding: '22px 24px',
        borderRadius: '16px',
        color: 'white',
        boxShadow: `0 6px 20px ${shadow}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = `0 12px 28px ${shadow}`;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 6px 20px ${shadow}`;
      }}
    >
      {/* Decorative circles */}
      <div style={{
        position: 'absolute', top: '-18px', right: '-18px',
        width: '80px', height: '80px', borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.13)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-28px', left: '-8px',
        width: '65px', height: '65px', borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.08)',
        pointerEvents: 'none',
      }} />

      {/* Icon */}
      <div style={{ fontSize: '26px', marginBottom: '10px', lineHeight: 1 }}>{icon}</div>

      {/* Label */}
      <div style={{
        fontSize: '11px', fontWeight: '700', opacity: 0.85,
        textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px',
      }}>
        {label}
      </div>

      {/* Value */}
      <div style={{
        fontSize: '34px', fontWeight: '800', lineHeight: 1, marginBottom: '5px',
        letterSpacing: '-0.5px',
      }}>
        {value ?? '—'}
      </div>

      {/* Sub text */}
      {sub && (
        <div style={{ fontSize: '12px', opacity: 0.78, fontWeight: '500' }}>{sub}</div>
      )}

      {/* Trend badge */}
      {trend && (
        <div style={{
          position: 'absolute', bottom: '14px', right: '14px',
          fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
          letterSpacing: '0.4px',
          backgroundColor: 'rgba(255,255,255,0.22)',
          padding: '3px 8px', borderRadius: '10px',
          display: 'flex', alignItems: 'center', gap: '3px',
        }}>
          <span>{trend.up ? '↑' : '↓'}</span>
          {trend.value}
        </div>
      )}
    </div>
  );
};

export default ReportSummaryCard;