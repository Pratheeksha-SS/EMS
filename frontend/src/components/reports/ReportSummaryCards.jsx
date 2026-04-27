import React from 'react';
import { Users, Calendar, CheckCircle, Clock, TrendingUp, XCircle, Award, Briefcase } from 'lucide-react';

const ReportSummaryCards = ({ summary, reportType, loading }) => {
  if (loading) {
    return (
      <div style={styles.container}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={styles.skeletonCard}>
            <div style={styles.skeletonIcon} />
            <div style={styles.skeletonContent}>
              <div style={styles.skeletonValue} />
              <div style={styles.skeletonLabel} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary || Object.keys(summary).length === 0) {
    return null;
  }

  const getCards = () => {
    switch(reportType) {
      case 'attendance':
        return [
          { 
            label: 'Total Employees', 
            value: summary.total_employees || 0, 
            icon: <Users size={22} />, 
            color: '#F97316', 
            bg: '#FFF7ED',
            trend: summary.employee_trend
          },
          { 
            label: 'Present Days', 
            value: summary.present || 0, 
            icon: <CheckCircle size={22} />, 
            color: '#10B981', 
            bg: '#ECFDF5',
            trend: summary.present_trend
          },
          { 
            label: 'Absent Days', 
            value: summary.absent || 0, 
            icon: <XCircle size={22} />, 
            color: '#EF4444', 
            bg: '#FEF2F2',
            trend: summary.absent_trend
          },
          { 
            label: 'Attendance %', 
            value: `${summary.attendance_percentage || 0}%`, 
            icon: <TrendingUp size={22} />, 
            color: '#8B5CF6', 
            bg: '#F3E8FF',
            trend: summary.percentage_trend
          },
        ];
      case 'leave':
        return [
          { 
            label: 'Total Leaves', 
            value: summary.total_requests || 0, 
            icon: <Calendar size={22} />, 
            color: '#F97316', 
            bg: '#FFF7ED' 
          },
          { 
            label: 'Approved', 
            value: summary.approved || 0, 
            icon: <CheckCircle size={22} />, 
            color: '#10B981', 
            bg: '#ECFDF5' 
          },
          { 
            label: 'Pending', 
            value: summary.pending || 0, 
            icon: <Clock size={22} />, 
            color: '#F59E0B', 
            bg: '#FEF3C7' 
          },
          { 
            label: 'Rejected', 
            value: summary.rejected || 0, 
            icon: <XCircle size={22} />, 
            color: '#EF4444', 
            bg: '#FEF2F2' 
          },
        ];
      case 'employee':
        return [
          { 
            label: 'Total Employees', 
            value: summary.total_employees || 0, 
            icon: <Users size={22} />, 
            color: '#F97316', 
            bg: '#FFF7ED' 
          },
          { 
            label: 'Avg Attendance', 
            value: `${summary.avg_attendance || 0}%`, 
            icon: <TrendingUp size={22} />, 
            color: '#10B981', 
            bg: '#ECFDF5' 
          },
          { 
            label: 'Total Leaves', 
            value: summary.total_leaves || 0, 
            icon: <Calendar size={22} />, 
            color: '#F59E0B', 
            bg: '#FEF3C7' 
          },
          { 
            label: 'Departments', 
            value: summary.total_departments || 0, 
            icon: <Briefcase size={22} />, 
            color: '#8B5CF6', 
            bg: '#F3E8FF' 
          },
        ];
      default:
        return [];
    }
  };

  const cards = getCards();

  return (
    <div style={styles.container}>
      {cards.map((card, idx) => (
        <div key={idx} style={styles.card}>
          <div style={{ ...styles.icon, background: card.bg, color: card.color }}>
            {card.icon}
          </div>
          <div style={styles.content}>
            <div style={styles.value}>{card.value}</div>
            <div style={styles.label}>{card.label}</div>
            {card.trend && (
              <div style={{ ...styles.trend, color: card.trend > 0 ? '#10B981' : '#EF4444' }}>
                {card.trend > 0 ? '↑' : '↓'} {Math.abs(card.trend)}%
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid #e5e7eb',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    },
  },
  icon: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 1.2,
  },
  label: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
    fontWeight: '500',
  },
  trend: {
    fontSize: '10px',
    marginTop: '4px',
    fontWeight: '600',
  },
  skeletonCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid #e5e7eb',
  },
  skeletonIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    background: '#f3f4f6',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonValue: {
    height: '28px',
    width: '60px',
    background: '#f3f4f6',
    borderRadius: '6px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  skeletonLabel: {
    height: '12px',
    width: '80px',
    background: '#f3f4f6',
    borderRadius: '4px',
    marginTop: '8px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
};

export default ReportSummaryCards;