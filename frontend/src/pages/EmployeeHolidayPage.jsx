import React from 'react';
import HolidayCalendar from '../components/HolidayCalendar';

const EmployeeHolidayPage = () => (
  <HolidayCalendar
    enableOfficeNotes
    enableSearch
    title="Holiday Calendar"
    subtitlePrefix="View and manage holidays for"
  />
);

export default EmployeeHolidayPage;
