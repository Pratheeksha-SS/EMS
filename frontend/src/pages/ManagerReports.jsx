import React from 'react';
import HRReports from '../admin/HRReports';

const ManagerReports = ({ user }) => {
  return (
    <div className="manager-reports">
      <h1>Team Reports</h1>
      <p className="description">
        View reports for your team members. All data is filtered to show only employees in your department.
      </p>
      <HRReports user={user} isManager={true} />
    </div>
  );
};

export default ManagerReports;