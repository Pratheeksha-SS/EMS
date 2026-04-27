import axios from 'axios';
import { extractListData } from '../utils/extractListData';

const BASE_URL = 'http://127.0.0.1:8000';

const getToken = () => localStorage.getItem('access_token');

const api = axios.create();

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const holidayService = {
  getHolidays: async (year = null) => {
    try {
      const url = year
        ? `${BASE_URL}/api/holidays/?year=${year}`
        : `${BASE_URL}/api/holidays/`;
      const response = await api.get(url);
      return extractListData(response.data);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      throw error;
    }
  },

  getEmployeeHolidays: async () => {
    try {
      const response = await api.get(`${BASE_URL}/api/employee/holidays/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching employee holidays:', error);
      throw error;
    }
  },

  getUpcomingHolidays: async () => {
    try {
      const response = await api.get(`${BASE_URL}/api/holidays/upcoming/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming holidays:', error);
      throw error;
    }
  },

  getCalendarHolidays: async (year, month) => {
    try {
      const response = await api.get(`${BASE_URL}/api/holidays/calendar/?year=${year}&month=${month}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching calendar holidays:', error);
      throw error;
    }
  },

  getHolidaysByMonth: async () => {
    try {
      const data = await holidayService.getEmployeeHolidays();
      return data.holidays_by_month || {};
    } catch (error) {
      console.error('Error fetching holidays by month:', error);
      throw error;
    }
  },

  getHolidaySummary: async () => {
    try {
      const data = await holidayService.getEmployeeHolidays();
      return data.summary || {};
    } catch (error) {
      console.error('Error fetching holiday summary:', error);
      throw error;
    }
  }
};
