import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts } from '../styles/theme';

export default function CalendarScreen({ 
  appointments, 
  onAppointmentSelect, 
  completedAppointments,
  initialDateOffset = 0,
  onAddSession,
  onAddAppointment,
  onDeleteAppointment,
  onUpdateAppointment,
  onViewHistory,
}) {
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month', 'year'
  const [currentDateRange, setCurrentDateRange] = useState(initialDateOffset); // Offset from today
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [editForm, setEditForm] = useState({
    date: '',
    time: '',
    title: '',
    clients: '',
  });
  useEffect(() => {
    if (initialDateOffset !== 0) {
      setCurrentDateRange(initialDateOffset);
    }
  }, [initialDateOffset]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewAppointment, setPreviewAppointment] = useState(null);
  const [previewAppointmentContext, setPreviewAppointmentContext] = useState(null);

  // Helper to validate date format (MM/DD/YY) and existence
  const isValidDate = (dateStr) => {
    if (!dateStr) return false;
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;
    const match = dateStr.match(dateRegex);

    if (!match) return false;

    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
    }

    const fullYear = 2000 + year;
    
    const dateObj = new Date(fullYear, month - 1, day);
    
    return (
      dateObj.getMonth() + 1 === month && 
      dateObj.getDate() === day && 
      dateObj.getFullYear() === fullYear
    );
  };

  // Helper to normalize and validate time
  const normalizeTime = (timeStr) => {
    if (!timeStr) return null;
    let normalized = timeStr.trim().toUpperCase();

    normalized = normalized.replace(/(\d{1,2})(:?)(\d{0,2})\s*(AM|PM)/i, (match, hour, colon, minute, period) => {
      const min = minute.length === 0 ? '00' : minute.padStart(2, '0');
      return `${hour.padStart(2, '0')}:${min} ${period.toUpperCase()}`;
    });

    normalized = normalized.replace(/^(\d{1,2})\s*(AM|PM)$/i, (match, hour, period) => {
      return `${hour.padStart(2, '0')}:00 ${period.toUpperCase()}`;
    });

    const timeRegex = /^(\d{2}):(\d{2})\s*(AM|PM)$/;
    return timeRegex.test(normalized) ? normalized : null;
  };

  // Helper to validate time format (7 AM to 5 PM)
  const isValidTime = (timeStr) => {
    const normalized = normalizeTime(timeStr);
    if (!normalized) return false;
    
    const timeRegex = /^(\d{2}):(\d{2})\s*(AM|PM)$/i;
    const match = normalized.match(timeRegex);
    if (!match) return false;
    
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const period = match[3].toUpperCase();

    if (minute < 0 || minute > 59) return false;

    // Convert to 24-hour format for easy comparison
    let hour24 = hour;
    if (period === 'PM' && hour !== 12) hour24 += 12;
    if (period === 'AM' && hour === 12) hour24 = 0; // 12 AM (midnight)
    
    // The range is 7:00 AM (420 minutes) to 5:00 PM (17 * 60 = 1020 minutes)
    const totalMinutes = hour24 * 60 + minute;
    const minMinutes = 7 * 60; // 7 AM
    const maxMinutes = 17 * 60; // 5 PM
    
    return totalMinutes >= minMinutes && totalMinutes <= maxMinutes;
  };

  const timeToMinutesFromMidnight = (timeStr) => {
    const normalized = normalizeTime(timeStr);
    if (!normalized) return -1;
    
    const timeRegex = /^(\d{2}):(\d{2})\s*(AM|PM)$/i;
    const match = normalized.match(timeRegex);
    
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    // Convert to 24-hour
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0; // 12 AM (midnight)
    
    return hour * 60 + minute;
  };

  // Helper to compare times
  const isEndTimeAfterStart = (startTimeStr, endTimeStr) => {
    const startMinutes = timeToMinutesFromMidnight(startTimeStr);
    const endMinutes = timeToMinutesFromMidnight(endTimeStr);
    
    if (startMinutes === -1 || endMinutes === -1) return false;

    return endMinutes > startMinutes;
  };

  // Parse time string to get start time in minutes from 7 AM (e.g., "8 AM - 10 AM" -> 60)
  const parseStartMinutes = (timeStr) => {
    if (!timeStr) return null;
    const times = timeStr.split(' - ');
    if (times.length < 1) return null;
    
    const startMinutesFromMidnight = timeToMinutesFromMidnight(times[0].trim());
    if (startMinutesFromMidnight === -1) return null;

    // Convert to minutes from 7 AM (420 minutes)
    const minMinutes = 7 * 60; 
    const startMinutes = startMinutesFromMidnight - minMinutes;
    
    return startMinutes >= 0 ? startMinutes : null;
  };

  // Parse time string to get duration in minutes
  const parseDurationMinutes = (timeStr) => {
    if (!timeStr) return 120; // Default 2 hours
    const times = timeStr.split(' - ');
    if (times.length !== 2) return 120;
    
    const startMinutes = timeToMinutesFromMidnight(times[0].trim());
    const endMinutes = timeToMinutesFromMidnight(times[1].trim());
    
    if (startMinutes === -1 || endMinutes === -1) return 120;
    
    const duration = endMinutes - startMinutes;
    return duration > 0 ? duration : 120;
  };

  // Get dates for current view based on view mode
  const getCurrentDates = () => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + currentDateRange);
    
    if (viewMode === 'day') {
      const tomorrow = new Date(baseDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return [baseDate, tomorrow];
    } else if (viewMode === 'week') {
      // Get start of week (Sunday)
      const startOfWeek = new Date(baseDate);
      const day = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - day);
      
      // Get all 7 days of the week
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        weekDates.push(date);
      }
      return weekDates;
    }
    return [baseDate];
  };

  // Format date for display (Nov 21)
  const formatDateShort = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  // Format date range based on view mode
  const formatDateRange = () => {
    if (viewMode === 'day') {
      const dates = getCurrentDates();
      const start = formatDateShort(dates[0]);
      const end = formatDateShort(dates[1]);
      const year = dates[0].getFullYear();
      return `${start} - ${end}, ${year}`;
    } else if (viewMode === 'week') {
      const dates = getCurrentDates();
      const start = formatDateShort(dates[0]);
      const end = formatDateShort(dates[6]);
      const year = dates[0].getFullYear();
      return `${start} - ${end}, ${year}`;
    } else if (viewMode === 'month') {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
      return `${months[currentMonth]} ${currentYear}`;
    } else if (viewMode === 'year') {
      return `${currentYear}`;
    }
    return '';
  };

  // Convert date to MM/DD/YY format for matching with appointments
  const formatDateKey = (date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  };

  // Get day abbreviation (FRI, SAT, etc.)
  const getDayAbbr = (date) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getDay()];
  };

  // Get appointments for displayed dates
  const displayedAppointments = useMemo(() => {
    if (viewMode === 'day') {
      const today = new Date();
      today.setDate(today.getDate() + currentDateRange);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dates = [today, tomorrow];
      const dateKeys = dates.map(d => formatDateKey(d));
      
      return dateKeys.map((dateKey, index) => {
        const dateAppts = appointments.filter(apt => apt.date === dateKey);
        return {
          dateKey,
          date: dates[index],
          appointments: dateAppts,
        };
      });
    } else if (viewMode === 'week') {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + currentDateRange);
      const startOfWeek = new Date(baseDate);
      const day = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - day);
      
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        dates.push(date);
      }
      
      const dateKeys = dates.map(d => formatDateKey(d));
      
      return dateKeys.map((dateKey, index) => {
        const dateAppts = appointments.filter(apt => apt.date === dateKey);
        return {
          dateKey,
          date: dates[index],
          appointments: dateAppts,
        };
      });
    }
    return [];
  }, [appointments, currentDateRange, viewMode]);

  // Time slots from 7 AM to 4 PM
  const timeSlots = ['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM'];

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setEditForm({
      date: appointment.date || '',
      time: appointment.time || '',
      title: appointment.title || '',
      clients: appointment.clients || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editForm.date || !editForm.time || !editForm.title || !editForm.clients) {
      Alert.alert('Incomplete', 'Please fill in all fields');
      return;
    }

    if (!isValidDate(editForm.date)) {
      Alert.alert('Invalid Date', 'Date must be in MM/DD/YY format and be a valid calendar date (e.g., 09/25/25)');
      return;
    }

    const timeParts = editForm.time.split(' - ');
    if (timeParts.length !== 2) {
      Alert.alert('Invalid Time', 'Time must be in the format: "8:00 AM - 10:00 AM"');
      return;
    }

    const startTime = timeParts[0].trim();
    const endTime = timeParts[1].trim();
    const normalizedStartTime = normalizeTime(startTime);
    const normalizedEndTime = normalizeTime(endTime);

    if (!normalizedStartTime || !normalizedEndTime) {
      Alert.alert('Invalid Time Format', 'Times must be in a valid format like "8 AM" or "1:30 PM"');
      return;
    }

    if (!isValidTime(normalizedStartTime) || !isValidTime(normalizedEndTime)) {
      Alert.alert(
        'Invalid Time Range', 
        'Times must be within the business hours of 7:00 AM to 5:00 PM.'
      );
      return;
    }

    if (!isEndTimeAfterStart(normalizedStartTime, normalizedEndTime)) {
      Alert.alert('Invalid Time', 'End time must be after start time.');
      return;
    }

    const normalizedTime = `${normalizedStartTime} - ${normalizedEndTime}`;

    const updated = {
      ...editingAppointment,
      date: editForm.date,
      time: normalizedTime,
      title: editForm.title,
      clients: editForm.clients,
    };

    onUpdateAppointment(updated);
    setShowEditModal(false);
    setEditingAppointment(null);
  };

  const handleDelete = (appointmentId, e) => {
    e?.stopPropagation();
    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteAppointment(appointmentId),
        },
      ]
    );
  };

  const handlePrevious = () => {
    if (viewMode === 'day') {
      setCurrentDateRange(currentDateRange - 1);
    } else if (viewMode === 'week') {
      setCurrentDateRange(currentDateRange - 7);
    } else if (viewMode === 'month') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else if (viewMode === 'year') {
      setCurrentYear(currentYear - 1);
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') {
      setCurrentDateRange(currentDateRange + 1);
    } else if (viewMode === 'week') {
      setCurrentDateRange(currentDateRange + 7);
    } else if (viewMode === 'month') {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    } else if (viewMode === 'year') {
      setCurrentYear(currentYear + 1);
    }
  };

  const handleToday = () => {
    // Switch to day view and navigate to today
    setViewMode('day');
    setCurrentDateRange(0);
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Render month view
  const renderMonthView = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <View style={styles.monthView}>
        <View style={styles.weekDaysRow}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDayHeader}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.monthGrid}>
          {days.map((day, index) => {
            if (day === null) {
              return <View key={index} style={styles.monthDayEmpty} />;
            }
            
            const date = new Date(currentYear, currentMonth, day);
            const dateKey = formatDateKey(date);
            const dateAppts = appointments.filter(apt => apt.date === dateKey);
            const isToday = date.toDateString() === new Date().toDateString();
            const isCurrentMonth = date.getMonth() === currentMonth;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthDay,
                  isToday && styles.monthDayToday,
                  !isCurrentMonth && styles.monthDayOtherMonth,
                ]}
                onPress={() => {
                  setViewMode('day');
                  const today = new Date();
                  const targetDate = new Date(currentYear, currentMonth, day);
                  const diffTime = targetDate - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  setCurrentDateRange(diffDays);
                }}
              >
                <Text style={[
                  styles.monthDayNumber,
                  isToday && styles.monthDayNumberToday,
                  !isCurrentMonth && styles.monthDayNumberOtherMonth,
                ]}>
                  {day}
                </Text>
                {dateAppts.length > 0 && (
                  <View style={styles.monthDayAppts}>
                    <Text style={styles.monthDayApptsText}>{dateAppts.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Render year view
  const renderYearView = () => {
    const months = [
      ['Jan', 'Feb', 'Mar'],
      ['Apr', 'May', 'Jun'],
      ['Jul', 'Aug', 'Sep'],
      ['Oct', 'Nov', 'Dec'],
    ];
    
    return (
      <View style={styles.yearView}>
        {months.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.yearRow}>
            {row.map((monthName, colIndex) => {
              const monthIndex = rowIndex * 3 + colIndex;
              
              return (
                <TouchableOpacity
                  key={colIndex}
                  style={styles.yearMonth}
                  onPress={() => {
                    setViewMode('month');
                    setCurrentMonth(monthIndex);
                  }}
                >
                  <Text style={styles.yearMonthName}>{monthName}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  // Render appointments for a date column
  const renderAppointmentsForDate = (dateData) => {
    const { dateKey, date, appointments: dateAppointments } = dateData;
    
    // Create array of appointments with their positions
    const appointmentsWithPosition = dateAppointments.map(apt => {
      const startMinutes = parseStartMinutes(apt.time);
      const durationMinutes = parseDurationMinutes(apt.time);
      return {
        appointment: apt,
        startMinutes: startMinutes,
        durationMinutes: durationMinutes,
      };
    }).filter(item => item.startMinutes !== null && item.startMinutes >= 0);
    
    const appointmentCount = dateAppointments.length;
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    return (
      <View style={styles.dayEventsColumn} key={dateKey}>
        {/* Time slots with appointments */}
        <View style={styles.timeSlotsContainer}>
          {timeSlots.map((time, index) => (
            <View key={`empty-${dateKey}-${index}`} style={styles.emptySlot} />
          ))}
          
          {/* Render appointments absolutely positioned */}
          {appointmentsWithPosition.map(({ appointment, startMinutes, durationMinutes }) => {
            const isCompleted = completedAppointments?.has(appointment.id);
            
            // In week view, hide action buttons and show only completed checkmark if needed
            const isWeekView = viewMode === 'week';
            
            return (
              <TouchableOpacity
                key={appointment.id}
                style={[
                  styles.appointmentBlock,
                  isWeekView && styles.appointmentBlockWeek,
                  { 
                    height: durationMinutes,
                    top: startMinutes,
                  },
                ]}
                //onPress={() => onAppointmentSelect(appointment)}
                onPress={() => {
                  setPreviewAppointment(appointment);
                  setPreviewAppointmentContext(currentDateRange);
                  setShowPreviewModal(true);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.appointmentContent, isWeekView && styles.appointmentContentWeek]}>
                  <Text style={styles.appointmentTime} numberOfLines={1}>{appointment.time}</Text>
                  <Text style={styles.appointmentTitle} numberOfLines={1}>{appointment.title}</Text>
                  <Text style={styles.appointmentClient} numberOfLines={1}>{appointment.clients}</Text>
                </View>
                
                {!isWeekView && (
                  <View style={styles.appointmentActions}>
                    {isCompleted ? (
                      // Show only checkmark when completed
                      <View style={styles.iconCheckCompleted}>
                        <MaterialIcons name="check" size={16} color={colors.primary} />
                      </View>
                    ) : (
                      // Show edit and delete buttons when not completed
                      <>
                        <TouchableOpacity
                          style={styles.iconEdit}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleEdit(appointment);
                          }}
                        >
                          <MaterialIcons name="edit" size={18} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconDelete}
                          onPress={(e) => handleDelete(appointment.id, e)}
                        >
                          <MaterialIcons name="delete-outline" size={18} color={colors.primary} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
                
                {isWeekView && isCompleted && (
                  <View style={styles.iconCheckCompletedWeek}>
                    <MaterialIcons name="check" size={10} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header with view toggles */}
      <View style={styles.header}>
        <View style={styles.viewToggle}>
          <TouchableOpacity 
            style={viewMode === 'day' ? styles.viewToggleActive : styles.viewToggleInactive}
            onPress={() => setViewMode('day')}
          >
            <Text style={viewMode === 'day' ? styles.viewToggleTextActive : styles.viewToggleText}>Day</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={viewMode === 'week' ? styles.viewToggleActive : styles.viewToggleInactive}
            onPress={() => setViewMode('week')}
          >
            <Text style={viewMode === 'week' ? styles.viewToggleTextActive : styles.viewToggleText}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={viewMode === 'month' ? styles.viewToggleActive : styles.viewToggleInactive}
            onPress={() => setViewMode('month')}
          >
            <Text style={viewMode === 'month' ? styles.viewToggleTextActive : styles.viewToggleText}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={viewMode === 'year' ? styles.viewToggleActive : styles.viewToggleInactive}
            onPress={() => setViewMode('year')}
          >
            <Text style={viewMode === 'year' ? styles.viewToggleTextActive : styles.viewToggleText}>Year</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Navigation */}
      <View style={styles.dateNavigation}>
        <TouchableOpacity style={styles.todayButton} onPress={handleToday}>
          <MaterialIcons name="today" size={18} color={colors.primary} />
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
        
        <View style={styles.dateNavigationCenter}>
          <TouchableOpacity onPress={handlePrevious}>
            <MaterialIcons name="chevron-left" size={24} color={colors.accent3} />
          </TouchableOpacity>
          <Text style={styles.dateRangeText}>{formatDateRange()}</Text>
          <TouchableOpacity onPress={handleNext}>
            <MaterialIcons name="chevron-right" size={24} color={colors.accent3} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {viewMode === 'day' || viewMode === 'week' ? (
          <View>
            {/* Date headers row at the top */}
            <View style={styles.calendarHeaderRow}>
              <View style={styles.timeColumnHeader} />
              {displayedAppointments.map((dateData) => {
                const { date, appointments: dateAppointments } = dateData;
                const appointmentCount = dateAppointments.length;
                const today = new Date();
                const isToday = date.toDateString() === today.toDateString();
                
                return (
                  <View key={dateData.dateKey} style={[styles.dateHeaderCell, isToday && styles.dateHeaderCellToday]}>
                    <Text style={styles.dayLabel}>{getDayAbbr(date)}</Text>
                    <View style={[styles.dateCircle, isToday && styles.dateCircleToday]}>
                      <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                        {date.getDate()}
                      </Text>
                    </View>
                    {appointmentCount > 0 && (
                      <Text style={styles.appointmentCount}>{appointmentCount} appt{appointmentCount !== 1 ? 's' : ''}</Text>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Time grid for day/week view */}
            <View style={styles.timeGrid}>
              <View style={styles.timeColumn}>
                {timeSlots.map((time, index) => (
                  <View key={index} style={styles.timeSlot}>
                    <Text style={styles.timeLabel}>{time}</Text>
                  </View>
                ))}
              </View>

              {/* Appointment columns for each date */}
              {displayedAppointments.map((dateData) => renderAppointmentsForDate(dateData))}
            </View>
          </View>
        ) : viewMode === 'month' ? (
          /* Month view */
          renderMonthView()
        ) : (
          /* Year view */
          renderYearView()
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.previousSessionButton} 
          onPress={() => onViewHistory(currentDateRange)}
        >
          <MaterialIcons name="history" size={18} color={colors.primary} />
          <Text style={styles.previousSessionText}>Previous Session</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.fab} onPress={onAddSession}>
          <MaterialIcons name="add" size={20} color={colors.primary} />
          <Text style={styles.fabText}>Add Appointment</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >

        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Appointment</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.accent3} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Date (MM/DD/YY)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editForm.date}
                  onChangeText={(text) => setEditForm({ ...editForm, date: text })}
                  placeholder="09/25/25"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Time</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editForm.time}
                  onChangeText={(text) => setEditForm({ ...editForm, time: text })}
                  placeholder="8 AM - 10 AM"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Title</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editForm.title}
                  onChangeText={(text) => setEditForm({ ...editForm, title: text })}
                  placeholder="Direct Therapy"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Client(s)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editForm.clients}
                  onChangeText={(text) => setEditForm({ ...editForm, clients: text })}
                  placeholder="Last, First"
                />
              </View>

              <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveEdit}>
                <Text style={styles.modalSaveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Session Preview Modal */}
      <Modal
        visible={showPreviewModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPreviewModal(false)}
      >
        <View style={styles.previewModalOverlay}>
          <View style={styles.previewModalContent}>
            <View style={styles.previewModalHeader}>
              <Text style={styles.previewModalTitle}>Session Details</Text>
              <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.accent3} />
              </TouchableOpacity>
            </View>
            
            {previewAppointment && (
              <View style={styles.previewModalBody}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Date:</Text>
                  <Text style={styles.previewValue}>{previewAppointment.date}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Time:</Text>
                  <Text style={styles.previewValue}>{previewAppointment.time}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Title:</Text>
                  <Text style={styles.previewValue}>{previewAppointment.title}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Client(s):</Text>
                  <Text style={styles.previewValue}>{previewAppointment.clients}</Text>
                </View>
                
                <View style={styles.previewButtons}>
                  <TouchableOpacity 
                    style={styles.previewCancelButton}
                    onPress={() => setShowPreviewModal(false)}
                  >
                    <Text style={styles.previewCancelButtonText}>BACK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.previewEnterButton}
                    onPress={() => {
                      setShowPreviewModal(false);
                      onAppointmentSelect(previewAppointment, previewAppointmentContext);
                    }}
                  >
                    <Text style={styles.previewEnterButtonText}>
                      {completedAppointments?.has(previewAppointment.id) ? 'VIEW DETAILS' : 'ENTER NOTES'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    marginLeft: '10%',
    padding: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  viewToggleActive: {
    backgroundColor: colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  viewToggleInactive: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  viewToggleTextActive: {
    color: colors.primary,
    fontWeight: fonts.semiBold,
    fontSize: 16,
  },
  viewToggleText: {
    color: colors.accent3,
    fontWeight: fonts.medium,
    fontSize: 16,
  },
  historyButton: {
    backgroundColor: colors.secondary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderBottomWidth: 0,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 6,
  },
  todayButtonText: {
    color: colors.primary,
    fontWeight: fonts.semiBold,
    fontSize: 14,
  },
  dateNavigationCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    minWidth: 180,
    textAlign: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 0,
    borderTopWidth: 0,
    backgroundColor: colors.primary, // White background to show white space between columns
  },
  timeColumn: {
    width: 60,
    borderRightWidth: 0,
    paddingRight: 8,
    marginRight: 8, // White space after time column
    paddingTop: 12,
    backgroundColor: '#F0F9FF', // Exact light blue shade
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.primary,
  },
  timeColumnHeader: {
    width: 60,
    marginRight: 8,
  },
  dateHeaderCell: {
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  dateHeaderCellToday: {
    backgroundColor: 'transparent',
  },
  timeSlot: {
    height: 60,
    justifyContent: 'flex-start',
    paddingRight: 8,
    borderBottomWidth: 0,
    alignItems: 'flex-end',
    paddingTop: 0,
  },
  timeLabel: {
    fontSize: 15,
    fontWeight: fonts.medium,
    color: colors.accent3,
    textAlign: 'right',
    lineHeight: 15,
  },
  dayEventsColumn: {
    flex: 1,
    marginRight: 0,
    borderRightWidth: 0,
    paddingRight: 0,
    backgroundColor: '#F0F9FF', // Exact light blue shade matching the design
  },
  dateHeaderColumn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 4,
    borderBottomWidth: 0,
  },
  dateHeaderColumnToday: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 0,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 0,
  },
  dateCircleToday: {
    backgroundColor: '#023E8A', // Blue color
    borderColor: '#023E8A',
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: fonts.bold,
    color: colors.primary,
  },
  dayNumberToday: {
    color: colors.primary, // White text on blue background
  },
  appointmentCount: {
    fontSize: 11,
    fontWeight: fonts.medium,
    color: colors.accent3,
    marginTop: 0,
  },
  timeSlotsContainer: {
    position: 'relative',
    height: 540, // 9 hours (7 AM to 4 PM) * 60 minutes = 540 pixels
  },
  emptySlot: {
    height: 60,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  appointmentBlockWeek: {
    padding: 8,
    minHeight:70,
  },
  appointmentContentWeek: {
    paddingRight: 0,
  },
  iconCheckCompletedWeek: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentBlock: {
    backgroundColor: colors.accent1,
    borderRadius: 6,
    padding: 8,
    position: 'absolute',
    left: 2,
    right: 2,
    zIndex: 10,
    minHeight: 60,
  },
  appointmentContent: {
    flex: 1,
    paddingRight: 60,
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 13,
    fontWeight: fonts.semiBold,
    color: colors.primary,
    marginBottom: 2,
  },
  appointmentTitle: {
    fontSize: 15,
    fontWeight: fonts.bold,
    color: colors.primary,
    marginBottom: 2,
  },
  appointmentClient: {
    fontSize: 15,
    fontWeight: fonts.medium,
    color: colors.primary,
  },
  appointmentActions: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  iconCheckCompleted: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEdit: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconDelete: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'flex-end',
  },
  previousSessionButton: {
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  previousSessionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: fonts.semiBold,
  },
  fab: {
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: fonts.semiBold,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: fonts.bold,
    color: colors.accent3,
  },
  modalScroll: {
    padding: 20,
  },
  modalField: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.accent3,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.accent3,
  },
  modalSaveButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  modalSaveButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: fonts.bold,
  },
  // Month view styles
  monthView: {
    padding: 16,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthDayEmpty: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
  },
  monthDay: {
    width: '14.28%',
    // aspectRatio: 1,
    minHeight: 100,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.accent2,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    position: 'relative',
    zIndex: 1,
  },
  monthDayToday: {
    backgroundColor: colors.accent2,
    borderColor: colors.secondary,
    borderWidth: 2,
    zIndex: 2,
  },
  monthDayOtherMonth: {
    opacity: 0.3,
  },
  monthDayNumber: {
    fontSize: 18,
    fontWeight: fonts.medium,
    color: colors.accent3,
  },
  monthDayNumberToday: {
    fontWeight: fonts.bold,
    color: colors.secondary,
  },
  monthDayNumberOtherMonth: {
    color: colors.accent3,
  },
  monthDayAppts: {
    marginTop: 2,
    backgroundColor: colors.accent1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 6,
    position: 'relative',
    zIndex: 3,
  },
  monthDayApptsText: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.primary,
  },
  // Year view styles
  yearView: {
    padding: 16,
  },
  yearRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  yearMonth: {
    flex: 1,
    aspectRatio: 1.2,
    backgroundColor: colors.accent2,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent3,
  },
  yearMonthName: {
    fontSize: 18,
    fontWeight: fonts.bold,
    color: colors.accent3,
    marginBottom: 8,
  },
  yearMonthAppts: {
    fontSize: 12,
    fontWeight: fonts.medium,
    color: colors.secondary,
  },
  previewModalContent: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: '85%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  previewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent2,
  },
  previewModalTitle: {
    fontSize: 20,
    fontWeight: fonts.bold,
    color: colors.accent3,
  },
  previewModalBody: {
    padding: 20,
  },
  previewRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    width: 90,
  },
  previewValue: {
    fontSize: 16,
    fontWeight: fonts.medium,
    color: colors.accent3,
    flex: 1,
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  previewCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.accent3,
    alignItems: 'center',
  },
  previewCancelButtonText: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
  },
  previewEnterButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    alignItems: 'center',
  },
  previewEnterButtonText: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.primary,
  },
});