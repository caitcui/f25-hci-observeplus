/**
 * Calendar API service
 */

/**
 * Get calendar events for a date range
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @returns {Promise<Array>} - Array of calendar events
 */
export const getCalendarEvents = async (startDate, endDate) => {
  try {
    const response = await fetch(`/api/calendar/events?start=${startDate}&end=${endDate}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const events = await response.json();
    return events;
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    throw error;
  }
};

/**
 * Update calendar view preferences
 * @param {string} viewType - 'day' | 'week' | 'month' | 'year'
 * @param {string} date - Current date (ISO format)
 * @returns {Promise<Object>} - Updated view preferences
 */
export const updateCalendarView = async (viewType, date) => {
  try {
    const response = await fetch('/api/calendar/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewType, date }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to update calendar view:', error);
    throw error;
  }
};
