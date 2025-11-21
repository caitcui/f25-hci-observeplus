<<<<<<< HEAD
import React, { useState, useEffect, useRef } from 'react';
=======
import React from 'react';
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
<<<<<<< HEAD
  Modal,
  TextInput,
  Alert,
  Dimensions,
=======
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts } from '../styles/theme';

<<<<<<< HEAD
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_COLUMN_WIDTH = (SCREEN_WIDTH - 80) / 7; // 7 days, accounting for time column

export default function CalendarScreen({ 
  appointments, 
  onAppointmentSelect, 
  completedAppointments = new Set(),
  onAddSession,
  onAddAppointment,
  onDeleteAppointment,
  onUpdateAppointment,
  onViewHistory
}) {
  const [viewMode, setViewMode] = useState('Day');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Initialize with today for Day view (default)
    const day1 = new Date(today);
    const day2 = new Date(today);
    day2.setDate(today.getDate() + 1);
    // Return array with 7 days (for compatibility) but only use first 2
    return [day1, day2, day2, day2, day2, day2, day2];
  });
  
  const horizontalScrollRef = useRef(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Modal form state
  const [modalDate, setModalDate] = useState('');
  const [modalStartTime, setModalStartTime] = useState('');
  const [modalEndTime, setModalEndTime] = useState('');
  const [modalClient, setModalClient] = useState('');
  const [editingAppointment, setEditingAppointment] = useState(null);

  // Check if a date is today
  const isToday = (date) => {
    return date.getTime() === today.getTime();
  };

  // Get week dates from a given date
  const getWeekFromDate = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  // Helper to create a 2-day array for Day view navigation
  const createDayViewWeek = (date) => {
    const day1 = new Date(date);
    day1.setHours(0, 0, 0, 0);
    const day2 = new Date(day1);
    day2.setDate(day1.getDate() + 1);
    // Return array with 7 days (for compatibility) but only use first 2
    return [day1, day2, day2, day2, day2, day2, day2];
  };

  // Navigate to previous week
  const handlePreviousWeek = () => {
    const firstDay = currentWeek[0];
    const newDate = new Date(firstDay);
    newDate.setDate(firstDay.getDate() - 7);
    setCurrentWeek(getWeekFromDate(newDate));
  };

  // Navigate to next week
  const handleNextWeek = () => {
    const firstDay = currentWeek[0];
    const newDate = new Date(firstDay);
    newDate.setDate(firstDay.getDate() + 7);
    setCurrentWeek(getWeekFromDate(newDate));
  };

  // Jump to today (handles Month, Week, and Day views)
  const handleJumpToToday = () => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    if (viewMode === 'Month') {
      setCurrentMonth(todayDate);
    } else if (viewMode === 'Day') {
      setCurrentWeek(createDayViewWeek(todayDate));
    } else {
      setCurrentWeek(getWeekFromDate(todayDate));
      // Scroll to today's column
      setTimeout(() => {
        const updatedWeek = getWeekFromDate(todayDate);
        const todayIndex = updatedWeek.findIndex(d => isToday(d));
        if (todayIndex >= 0 && horizontalScrollRef.current) {
          horizontalScrollRef.current.scrollTo({
            x: todayIndex * DAY_COLUMN_WIDTH,
            animated: true,
          });
        }
      }, 100);
    }
  };

  // Format date range for header
  const getDateRangeText = () => {
    const firstDay = currentWeek[0];
    const lastDay = currentWeek[6];
    const firstMonth = firstDay.toLocaleDateString('en-US', { month: 'short' });
    const lastMonth = lastDay.toLocaleDateString('en-US', { month: 'short' });
    
    if (firstMonth === lastMonth) {
      return `${firstMonth} ${firstDay.getDate()} - ${lastDay.getDate()}, ${firstDay.getFullYear()}`;
    } else {
      return `${firstMonth} ${firstDay.getDate()} - ${lastMonth} ${lastDay.getDate()}, ${firstDay.getFullYear()}`;
    }
  };

  // Initialize modal with today's date
  useEffect(() => {
    if (showAddModal && !editingAppointment) {
      const today = new Date();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      const year = today.getFullYear().toString().slice(-2);
      setModalDate(`${month}/${day}/${year}`);
      setModalStartTime('');
      setModalEndTime('');
      setModalClient('');
    }
  }, [showAddModal]);

  const getDayAbbreviation = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  const getDayNumber = (date) => {
    return date.getDate().toString();
  };

  // Format date to match appointment format (MM/DD/YY)
  const formatDateForComparison = (date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  };

  // Helper to parse time to 24-hour format
  const parseTimeToHours = (timeStr) => {
    if (!timeStr) return null;
    let cleaned = timeStr.trim().toUpperCase();
    cleaned = cleaned.replace(/:/g, '');
    const match = cleaned.match(/(\d+)\s*(AM|PM)/);
    if (!match) return null;
    let hours = parseInt(match[1]);
    const period = match[2];
    if (isNaN(hours)) return null;
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    return hours;
  };

  // Helper to get appointments for a specific date
  const getAppointmentsForDate = (date) => {
    const dateStr = formatDateForComparison(date);
    // Also try alternative formats
    const altFormats = [
      dateStr, // MM/DD/YY
      `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`, // M/D/YYYY
      `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`, // MM/DD/YYYY
    ];
    
    const matching = appointments.filter(appt => {
      return altFormats.includes(appt.date);
    });
    
    console.log(`📊 Date: ${dateStr}, Found: ${matching.length} appointments`);
    if (matching.length > 0) {
      console.log('Appointments:', matching.map(a => ({ date: a.date, time: a.time, clients: a.clients })));
    }
    
    return matching;
  };

  // Get all appointments for a date with their positions
  const getAppointmentsWithPositions = (date) => {
    const dateAppointments = getAppointmentsForDate(date);
    const timeSlots = ['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM'];
    
    return dateAppointments.map(appt => {
      const timeRange = appt.time.split(' - ');
      const startTime = timeRange[0]?.trim() || '';
      const endTime = timeRange[1]?.trim() || '';
      
      const startHour = parseTimeToHours(startTime);
      const endHour = parseTimeToHours(endTime);
      
      let timeIndex = -1;
      if (startHour !== null && startHour >= 7 && startHour <= 16) {
        timeIndex = startHour - 7;
      }
      
      let duration = 1;
      if (startHour !== null && endHour !== null) {
        duration = endHour - startHour;
        if (duration <= 0) duration = 1;
      }
      
      return {
        appointment: appt,
        timeIndex,
        duration,
        startHour,
        endHour
      };
    }).filter(item => item.timeIndex >= 0 && item.timeIndex < timeSlots.length);
  };

  const timeSlots = ['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM'];

  // Calculate appointment height
  const calculateAppointmentHeight = (duration) => {
    return Math.max(duration * 60, 60);
  };

  // Handle delete appointment
  const handleDeleteAppointment = (appointment, event) => {
    event?.stopPropagation?.();
    Alert.alert(
      'Delete Appointment',
      `Delete appointment for ${appointment.clients}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDeleteAppointment) {
              onDeleteAppointment(appointment.id);
            }
          }
        }
      ]
    );
  };

  // Handle create/update appointment from modal
  const handleSaveAppointment = () => {
    if (!modalDate || !modalStartTime || !modalEndTime || !modalClient) {
      Alert.alert('Incomplete', 'Please fill in all fields');
      return;
    }

    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{2})$/;
    if (!dateRegex.test(modalDate)) {
      Alert.alert('Invalid Date', 'Please enter date in MM/DD/YY format');
      return;
    }

    const timeRegex = /^(\d{1,2})\s*(AM|PM)$/i;
    if (!timeRegex.test(modalStartTime.trim()) || !timeRegex.test(modalEndTime.trim())) {
      Alert.alert('Invalid Time', 'Please enter time in format like "8 AM" or "2 PM"');
      return;
    }

    const [month, day, year] = modalDate.split('/');
    const dateObj = new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isNaN(dateObj.getTime())) {
      Alert.alert('Invalid Date', 'Please enter a valid date');
      return;
    }

    const dayAbbr = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

    if (editingAppointment) {
      const updatedAppointment = {
        ...editingAppointment,
        date: modalDate,
        time: `${modalStartTime.trim()} - ${modalEndTime.trim()}`,
        clients: modalClient.trim(),
        day: dayAbbr,
        dayNum: day,
      };
      if (onUpdateAppointment) {
        onUpdateAppointment(updatedAppointment);
      }
      closeModal();
      Alert.alert('Success', 'Appointment updated successfully!');
    } else {
      const newAppointment = {
        id: Date.now(),
        date: modalDate,
        time: `${modalStartTime.trim()} - ${modalEndTime.trim()}`,
        title: 'Direct Therapy',
        clients: modalClient.trim(),
        day: dayAbbr,
        dayNum: day,
      };
      if (onAddAppointment) {
        onAddAppointment(newAppointment);
      }
      closeModal();
      Alert.alert('Success', 'Appointment created successfully!');
    }
  };

  const openEditModal = (appointment) => {
    setEditingAppointment(appointment);
    setModalDate(appointment.date);
    const timeParts = appointment.time.split(' - ');
    if (timeParts.length === 2) {
      setModalStartTime(timeParts[0].trim());
      setModalEndTime(timeParts[1].trim());
    }
    setModalClient(appointment.clients);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingAppointment(null);
    setModalDate('');
    setModalStartTime('');
    setModalEndTime('');
    setModalClient('');
  };

  const handleLongPress = (appointment) => {
    openEditModal(appointment);
  };

  // Get all days for month view (including previous/next month days to fill grid)
  const getMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    const days = [];
    
    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      days.push({ date: day, isCurrentMonth: true });
    }
    
    // Add days from next month to fill last week (to make 6 rows = 42 days)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    return days;
  };

  // Get month name and year for header
  const getMonthYearText = () => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Navigate to previous month
  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  // Navigate to next month
  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  // Render Month View
  const renderMonthView = () => {
    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const monthDays = getMonthDays(currentMonth); // Calculate inside render function
    
    return (
      <View style={styles.monthViewContainer}>
        {/* Month Header */}
        <View style={styles.monthHeader}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePreviousMonth}
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-left" size={24} color={colors.accent3} />
          </TouchableOpacity>
          
          <View style={styles.monthTitleContainer}>
            <Text style={styles.monthTitle}>{getMonthYearText()}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNextMonth}
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-right" size={24} color={colors.accent3} />
          </TouchableOpacity>
        </View>

        {/* Week Day Headers */}
        <View style={styles.weekDayHeaders}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDayHeader}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <ScrollView style={styles.monthGridScroll}>
          <View style={styles.monthGrid}>
            {monthDays.map((dayObj, index) => {
              const { date, isCurrentMonth } = dayObj;
              const dayAppointments = getAppointmentsForDate(date);
              const isTodayDate = isToday(date);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.monthDayCell,
                    !isCurrentMonth && styles.monthDayCellOtherMonth,
                    isTodayDate && styles.monthDayCellToday
                  ]}
                  onPress={() => {
                    setViewMode('Week');
                    setCurrentWeek(getWeekFromDate(date));
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.monthDayNumber,
                    !isCurrentMonth && styles.monthDayNumberOtherMonth,
                    isTodayDate && styles.monthDayNumberToday
                  ]}>
                    {date.getDate()}
                  </Text>
                  
                  {dayAppointments.length > 0 && (
                    <View style={styles.monthDayAppointments}>
                      {dayAppointments.slice(0, 3).map((apt, aptIndex) => {
                        const isAptCompleted = completedAppointments.has(apt.id);
                        return (
                          <View
                            key={aptIndex}
                            style={[
                              styles.monthAppointmentDot,
                              isAptCompleted && styles.monthAppointmentDotCompleted
                            ]}
                          />
                        );
                      })}
                      {dayAppointments.length > 3 && (
                        <Text style={styles.monthAppointmentMore}>
                          +{dayAppointments.length - 3}
                        </Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render Day View (shows today and tomorrow - BIGGER, NO WHITESPACE)
  const renderDayView = () => {
    // Use currentWeek[0] as the base date instead of always using today
    const baseDate = new Date(currentWeek[0]);
    baseDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(baseDate);
    nextDay.setDate(baseDate.getDate() + 1);
    const displayDays = [baseDate, nextDay];

    // Debug: Log appointments for the first day
    const firstDayStr = formatDateForComparison(baseDate);
    const firstDayApps = appointments.filter(a => a.date === firstDayStr);
    console.log('📅 First day date string:', firstDayStr);
    console.log('📋 All appointments:', appointments);
    console.log('✅ First day appointments:', firstDayApps);
    console.log('🔢 Count:', firstDayApps.length);

    // Calculate width for 2 days (much wider than 7-day view)
    const DAY_VIEW_COLUMN_WIDTH = (SCREEN_WIDTH - 80) / 2; // 2 days, accounting for time column

    return (
      <>
        {/* Day Navigation Header */}
        <View style={styles.weekHeader}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              // Create a fresh date to avoid mutation issues
              const currentBase = new Date(currentWeek[0]);
              currentBase.setHours(0, 0, 0, 0);
              const newDate = new Date(currentBase);
              newDate.setDate(currentBase.getDate() - 2); // Move back 2 days
              newDate.setHours(0, 0, 0, 0);
              setCurrentWeek(createDayViewWeek(newDate));
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-left" size={24} color={colors.accent3} />
          </TouchableOpacity>
          
          <View style={styles.dateRangeContainer}>
            <Text style={styles.dateRangeText}>
              {baseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {nextDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              // Create a fresh date to avoid mutation issues
              const currentBase = new Date(currentWeek[0]);
              currentBase.setHours(0, 0, 0, 0);
              const newDate = new Date(currentBase);
              newDate.setDate(currentBase.getDate() + 2); // Move forward 2 days
              newDate.setHours(0, 0, 0, 0);
              setCurrentWeek(createDayViewWeek(newDate));
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-right" size={24} color={colors.accent3} />
          </TouchableOpacity>
        </View>

        {/* Today Button */}
        <View style={styles.todayButtonContainer}>
          <TouchableOpacity
            style={styles.todayButton}
            onPress={handleJumpToToday}
            activeOpacity={0.7}
          >
            <MaterialIcons name="today" size={18} color={colors.primary} />
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Grid - NO horizontal scroll, fills screen */}
        <ScrollView style={styles.scrollView}>
          {/* Date Headers - Fixed width, no scroll */}
          <View style={styles.dateHeader}>
            <View style={styles.timeColumn} />
            {displayDays.map((date, index) => {
              const dateStr = formatDateForComparison(date);
              const dayApps = appointments.filter(a => a.date === dateStr);
              const isTodayDate = isToday(date);
              
              return (
                <View 
                  key={index} 
                  style={[
                    styles.dateColumn,
                    { width: DAY_VIEW_COLUMN_WIDTH, flex: 1 },
                    isTodayDate && styles.todayDateColumn
                  ]}
                >
                  <Text style={[
                    styles.dayLabel,
                    isTodayDate && styles.todayDayLabel
                  ]}>
                    {getDayAbbreviation(date)}
                  </Text>
                  <View style={[
                    styles.dayNumberContainer,
                    isTodayDate && styles.todayDayNumberContainer
                  ]}>
                    <Text style={[
                      styles.dayNumber,
                      isTodayDate && styles.todayDayNumber
                    ]}>
                      {getDayNumber(date)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Time Grid - Fixed width, no scroll, fills screen */}
          <View style={styles.timeGrid}>
            <View style={styles.timeColumn}>
              {timeSlots.map((time, index) => (
                <View key={index} style={styles.timeSlot}>
                  <Text style={styles.timeLabel}>{time}</Text>
                </View>
              ))}
            </View>

            {/* Day Columns - Much wider for 2 days */}
            {displayDays.map((date, dayIndex) => {
              const appointmentsWithPositions = getAppointmentsWithPositions(date);
              
              return (
                <View 
                  key={dayIndex} 
                  style={[
                    styles.dayEventsColumn,
                    { width: DAY_VIEW_COLUMN_WIDTH, flex: 1 }
                  ]}
                >
                  {timeSlots.map((time, timeIndex) => {
                    const apptPosition = appointmentsWithPositions.find(
                      pos => pos.timeIndex === timeIndex
                    );
                    
                    if (apptPosition) {
                      const { appointment: appt, duration } = apptPosition;
                      const isCompleted = completedAppointments.has(appt.id);
                      const height = calculateAppointmentHeight(duration);
                      
                      return (
                        <TouchableOpacity
                          key={timeIndex}
                          style={[styles.appointmentBlock, { height }]}
                          onPress={() => onAppointmentSelect(appt)}
                          onLongPress={() => handleLongPress(appt)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.appointmentTime}>{appt.time}</Text>
                          <Text style={styles.appointmentTitle}>{appt.title}</Text>
                          <Text style={styles.appointmentClient}>{appt.clients}</Text>
                          
                          <TouchableOpacity
                            style={[
                              styles.appointmentIcon,
                              isCompleted ? styles.iconCheck : styles.iconDelete
                            ]}
                            onPress={(e) => {
                              e.stopPropagation();
                              if (!isCompleted) {
                                handleDeleteAppointment(appt, e);
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <MaterialIcons 
                              name={isCompleted ? "check" : "delete-outline"} 
                              size={12} 
                              color={colors.primary} 
                            />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    } else {
                      return <View key={timeIndex} style={styles.emptySlot} />;
                    }
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </>
    );
  };

  // Render Week View (ONLY week-specific content, no duplicates)
  const renderWeekView = () => {
    return (
      <>
        {/* Week Navigation Header */}
        <View style={styles.weekHeader}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePreviousWeek}
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-left" size={24} color={colors.accent3} />
          </TouchableOpacity>
          
          <View style={styles.dateRangeContainer}>
            <Text style={styles.dateRangeText}>{getDateRangeText()}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNextWeek}
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-right" size={24} color={colors.accent3} />
          </TouchableOpacity>
        </View>

        {/* Today Button */}
        <View style={styles.todayButtonContainer}>
          <TouchableOpacity
            style={styles.todayButton}
            onPress={handleJumpToToday}
            activeOpacity={0.7}
          >
            <MaterialIcons name="today" size={18} color={colors.primary} />
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} nestedScrollEnabled>
          {/* Date Headers - Horizontally Scrollable */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            ref={horizontalScrollRef}
          >
            <View style={styles.dateHeader}>
              <View style={styles.timeColumn} />
              {currentWeek.map((date, index) => {
                const dateStr = formatDateForComparison(date);
                const dayApps = appointments.filter(a => a.date === dateStr);
                const isTodayDate = isToday(date);
                
                return (
                  <View 
                    key={index} 
                    style={[
                      styles.dateColumn,
                      { width: DAY_COLUMN_WIDTH },
                      isTodayDate && styles.todayDateColumn
                    ]}
                  >
                    <Text style={[
                      styles.dayLabel,
                      isTodayDate && styles.todayDayLabel
                    ]}>
                      {getDayAbbreviation(date)}
                    </Text>
                    <View style={[
                      styles.dayNumberContainer,
                      isTodayDate && styles.todayDayNumberContainer
                    ]}>
                      <Text style={[
                        styles.dayNumber,
                        isTodayDate && styles.todayDayNumber
                      ]}>
                        {getDayNumber(date)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Time Grid - Horizontally Scrollable */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            scrollEventThrottle={16}
          >
            <View style={styles.timeGrid}>
              <View style={styles.timeColumn}>
                {timeSlots.map((time, index) => (
                  <View key={index} style={styles.timeSlot}>
                    <Text style={styles.timeLabel}>{time}</Text>
                  </View>
                ))}
              </View>

              {/* Day Columns */}
              {currentWeek.map((date, dayIndex) => {
                const appointmentsWithPositions = getAppointmentsWithPositions(date);
                
                return (
                  <View 
                    key={dayIndex} 
                    style={[
                      styles.dayEventsColumn,
                      { width: DAY_COLUMN_WIDTH }
                    ]}
                  >
                    {timeSlots.map((time, timeIndex) => {
                      const apptPosition = appointmentsWithPositions.find(
                        pos => pos.timeIndex === timeIndex
                      );
                      
                      if (apptPosition) {
                        const { appointment: appt, duration } = apptPosition;
                        const isCompleted = completedAppointments.has(appt.id);
                        const height = calculateAppointmentHeight(duration);
                        
                        return (
                          <TouchableOpacity
                            key={timeIndex}
                            style={[styles.appointmentBlock, { height }]}
                            onPress={() => onAppointmentSelect(appt)}
                            onLongPress={() => handleLongPress(appt)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.appointmentTime}>{appt.time}</Text>
                            <Text style={styles.appointmentTitle}>{appt.title}</Text>
                            <Text style={styles.appointmentClient}>{appt.clients}</Text>
                            
                            <TouchableOpacity
                              style={[
                                styles.appointmentIcon,
                                isCompleted ? styles.iconCheck : styles.iconDelete
                              ]}
                              onPress={(e) => {
                                e.stopPropagation();
                                if (!isCompleted) {
                                  handleDeleteAppointment(appt, e);
                                }
                              }}
                              activeOpacity={0.7}
                            >
                              <MaterialIcons 
                                name={isCompleted ? "check" : "delete-outline"} 
                                size={12} 
                                color={colors.primary} 
                              />
                            </TouchableOpacity>
                          </TouchableOpacity>
                        );
                      } else {
                        return <View key={timeIndex} style={styles.emptySlot} />;
                      }
                    })}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </ScrollView>
      </>
    );
  };

  // Render Year View
  const renderYearView = () => {
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    const endYear = 2030;
    const years = [];
    
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    
    return (
      <View style={styles.yearViewContainer}>
        {/* Year Header */}
        <View style={styles.yearHeader}>
          <Text style={styles.yearHeaderTitle}>Select Year</Text>
        </View>

        {/* Year Grid */}
        <ScrollView 
          style={styles.yearGridScroll}
          contentContainerStyle={styles.yearGridContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.yearGrid}>
            {years.map((year) => {
              const isCurrentYear = year === currentYear;
              // Filter appointments for this year - handle different date formats
              const yearAppointments = appointments.filter(apt => {
                if (!apt || !apt.date) return false;
                
                try {
                  // Handle MM/DD/YY format
                  const dateParts = apt.date.split('/');
                  if (dateParts.length === 3) {
                    const yearPart = dateParts[2];
                    let aptYear;
                    
                    // If year is 2 digits, assume 20XX
                    if (yearPart.length === 2) {
                      aptYear = parseInt('20' + yearPart);
                    } else {
                      // If year is 4 digits, use as is
                      aptYear = parseInt(yearPart);
                    }
                    
                    return aptYear === year;
                  }
                  
                  // Try parsing as Date object if it's a different format
                  const parsedDate = new Date(apt.date);
                  if (!isNaN(parsedDate.getTime())) {
                    return parsedDate.getFullYear() === year;
                  }
                  
                  return false;
                } catch (error) {
                  console.error('Error parsing appointment date:', apt.date, error);
                  return false;
                }
              });
              
              return (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearCell,
                    isCurrentYear && styles.yearCellCurrent
                  ]}
                  onPress={() => {
                    const newDate = new Date(year, currentMonth.getMonth(), 1);
                    setCurrentMonth(newDate);
                    setViewMode('Month');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.yearCellText,
                    isCurrentYear && styles.yearCellTextCurrent
                  ]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

=======
export default function CalendarScreen({ appointments, onAppointmentSelect }) {
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
<<<<<<< HEAD
      {/* View Mode Selector */}
      <View style={styles.viewSelector}>
        <View style={styles.viewSelectorLeft}>
          {['Day', 'Week', 'Month', 'Year'].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.viewOption,
                viewMode === mode && styles.viewOptionActive
              ]}
              onPress={() => {
                setViewMode(mode);
                if (mode === 'Month') {
                  setCurrentMonth(new Date());
                }
              }}
            >
              <Text style={[
                styles.viewOptionText,
                viewMode === mode && styles.viewOptionTextActive
              ]}>
                {mode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity
          style={styles.historyButton}
          onPress={onViewHistory}
          activeOpacity={0.7}
        >
          <MaterialIcons name="history" size={20} color={colors.primary} />
          <Text style={styles.historyButtonText}>Past Sessions</Text>
        </TouchableOpacity>
      </View>

      {/* Render appropriate view */}
      {viewMode === 'Day' ? renderDayView() :
       viewMode === 'Year' ? renderYearView() : 
       viewMode === 'Month' ? renderMonthView() : 
       renderWeekView()}

      {/* Add Appointment Button */}
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => {
          setEditingAppointment(null);
          setShowAddModal(true);
        }}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={16} color={colors.primary} />
        <Text style={styles.addButtonText}>Add Appointment</Text>
      </TouchableOpacity>

      {/* Add/Edit Appointment Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAppointment ? 'Edit Appointment' : 'Add New Appointment'}
              </Text>
              <TouchableOpacity
                onPress={closeModal}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color={colors.accent3} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Date (MM/DD/YY)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={modalDate}
                  onChangeText={setModalDate}
                  placeholder="11/21/25"
                  placeholderTextColor={colors.accent3}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Start Time</Text>
                <TextInput
                  style={styles.modalInput}
                  value={modalStartTime}
                  onChangeText={setModalStartTime}
                  placeholder="8 AM"
                  placeholderTextColor={colors.accent3}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>End Time</Text>
                <TextInput
                  style={styles.modalInput}
                  value={modalEndTime}
                  onChangeText={setModalEndTime}
                  placeholder="10 AM"
                  placeholderTextColor={colors.accent3}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Client Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={modalClient}
                  onChangeText={setModalClient}
                  placeholder="Last, First"
                  placeholderTextColor={colors.accent3}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={closeModal}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCreateButton}
                  onPress={handleSaveAppointment}
                >
                  <Text style={styles.modalCreateText}>
                    {editingAppointment ? 'Update' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
=======
      {/* calendar header */}
      <View style={styles.header}>
        <View style={styles.viewToggle}>
          <TouchableOpacity style={styles.viewToggleActive}>
            <Text style={styles.viewToggleTextActive}>Day</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewToggleInactive}>
            <Text style={styles.viewToggleText}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewToggleInactive}>
            <Text style={styles.viewToggleText}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewToggleInactive}>
            <Text style={styles.viewToggleText}>Year</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* date Headers */}
        <View style={styles.dateHeader}>
          <View style={styles.timeColumn} />
          <View style={styles.dateColumn}>
            <Text style={styles.dayLabel}>THU</Text>
            <Text style={styles.dayNumber}>25</Text>
          </View>
          <View style={styles.dateColumn}>
            <Text style={styles.dayLabel}>FRI</Text>
            <Text style={styles.dayNumber}>26</Text>
          </View>
        </View>

        {/* grid for time slots */}
        <View style={styles.timeGrid}>
          <View style={styles.timeColumn}>
            {['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM'].map((time, index) => (
              <View key={index} style={styles.timeSlot}>
                <Text style={styles.timeLabel}>{time}</Text>
              </View>
            ))}
          </View>

          {/* sample - Thursday appointments */}
          <View style={styles.dayEventsColumn}>
            <View style={styles.emptySlot} />
            
            {/* 8-10 AM appt */}
            <TouchableOpacity 
              style={[styles.appointmentBlock, styles.appointmentDouble]}
              onPress={() => onAppointmentSelect(appointments[0])}
            >
              <Text style={styles.appointmentTime}>8 AM - 10 AM</Text>
              <Text style={styles.appointmentTitle}>Direct Therapy</Text>
              <Text style={styles.appointmentClient}>Mosby, Ted</Text>
              <View style={styles.iconCheck}>
                <MaterialIcons name="check" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>

            <View style={styles.emptySlot} />
            <View style={styles.emptySlot} />

            {/* 12:30-2:30 PM appt */}
            <TouchableOpacity 
              style={[styles.appointmentBlock, styles.appointmentDouble]}
              onPress={() => onAppointmentSelect(appointments[2])}
            >
              <Text style={styles.appointmentTime}>12:30 PM - 2:30 PM</Text>
              <Text style={styles.appointmentTitle}>Direct Therapy</Text>
              <Text style={styles.appointmentClient}>Aldrin, Lily</Text>
              <View style={styles.iconDelete}>
                <MaterialIcons name="delete-outline" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>

            <View style={styles.emptySlot} />
            <View style={styles.emptySlot} />
          </View>

          {/* Friday appt */}
          <View style={styles.dayEventsColumn}>
            <View style={styles.emptySlot} />
            <View style={styles.emptySlot} />
            <View style={styles.emptySlot} />
            <View style={styles.emptySlot} />

            {/* 11 AM - 1 PM appt */}
            <TouchableOpacity 
              style={[styles.appointmentBlock, styles.appointmentDouble]}
              onPress={() => onAppointmentSelect(appointments[1])}
            >
              <Text style={styles.appointmentTime}>11 AM - 1 PM</Text>
              <Text style={styles.appointmentTitle}>Direct Therapy</Text>
              <Text style={styles.appointmentClient}>Scher, Robin</Text>
              <View style={styles.iconDelete}>
                <MaterialIcons name="delete-outline" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>

            <View style={styles.emptySlot} />
            <View style={styles.emptySlot} />
            <View style={styles.emptySlot} />
          </View>
        </View>
      </ScrollView>
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
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
<<<<<<< HEAD
  viewSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewSelectorLeft: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  viewOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    flexShrink: 1,
  },
  viewOptionActive: {
    backgroundColor: colors.secondary,
  },
  viewOptionText: {
    fontSize: 13,
    fontWeight: fonts.medium,
    color: colors.accent3,
  },
  viewOptionTextActive: {
    color: colors.primary,
    fontWeight: fonts.semiBold,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    gap: 5,
    flexShrink: 0,
  },
  historyButtonText: {
    fontSize: 12,
    fontWeight: fonts.semiBold,
    color: colors.primary,
  },
  // Week Navigation Header
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent2,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.accent2,
  },
  dateRangeContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
  },
  // Today Button
  todayButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: fonts.semiBold,
    color: colors.primary,
  },
  // Horizontal Scroll
  horizontalScroll: {
    flexGrow: 0,
=======
  header: {
    padding: 16,
    backgroundColor: colors.primary,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  viewToggleActive: {
    backgroundColor: colors.secondary,
    paddingVertical: 8,
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
    fontSize: 14,
  },
  viewToggleText: {
    color: colors.accent3,
    fontWeight: fonts.medium,
    fontSize: 14,
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
  },
  dateHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
<<<<<<< HEAD
    paddingVertical: 16,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent2,
    minWidth: SCREEN_WIDTH, // Ensure it fills width
=======
    paddingVertical: 12,
    backgroundColor: colors.primary,
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
  },
  timeColumn: {
    width: 60,
  },
  dateColumn: {
<<<<<<< HEAD
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  todayDateColumn: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingVertical: 8,
=======
    flex: 1,
    alignItems: 'center',
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    marginBottom: 4,
  },
<<<<<<< HEAD
  todayDayLabel: {
    color: '#1976D2',
    fontWeight: fonts.bold,
  },
  dayNumberContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayDayNumberContainer: {
    backgroundColor: '#1976D2',
    borderRadius: 16,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: fonts.bold,
    color: colors.accent3,
  },
  todayDayNumber: {
    color: colors.primary,
  },
  appointmentCount: {
    fontSize: 10,
    fontWeight: fonts.medium,
    color: colors.secondary,
    marginTop: 4,
  },
  timeGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    minWidth: SCREEN_WIDTH, // Ensure it fills width
=======
  dayNumber: {
    fontSize: 24,
    fontWeight: fonts.bold,
    color: colors.accent3,
  },
  timeGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
  },
  timeSlot: {
    height: 60,
    justifyContent: 'flex-start',
    paddingRight: 8,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: fonts.medium,
    color: colors.accent3,
    textAlign: 'right',
  },
  dayEventsColumn: {
<<<<<<< HEAD
    marginHorizontal: 2,
=======
    flex: 1,
    marginHorizontal: 4,
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
  },
  emptySlot: {
    height: 60,
    backgroundColor: colors.accent2,
<<<<<<< HEAD
    marginBottom: 2,
=======
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
  },
  appointmentBlock: {
    backgroundColor: colors.accent1,
    borderRadius: 8,
    padding: 10,
    position: 'relative',
<<<<<<< HEAD
    marginBottom: 2,
=======
  },
  appointmentDouble: {
    height: 120,
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
  },
  appointmentTime: {
    fontSize: 10,
    fontWeight: fonts.semiBold,
    color: colors.primary,
    marginBottom: 4,
  },
  appointmentTitle: {
    fontSize: 13,
    fontWeight: fonts.bold,
    color: colors.primary,
    marginBottom: 2,
  },
  appointmentClient: {
    fontSize: 12,
    fontWeight: fonts.medium,
    color: colors.primary,
  },
<<<<<<< HEAD
  appointmentIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.secondary,
  },
  iconDelete: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: fonts.bold,
    marginLeft: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
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
  modalCloseButton: {
    padding: 4,
  },
  modalForm: {
    padding: 20,
  },
  modalField: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.accent3,
    borderRadius: 8,
    padding: 14,
    fontSize: 14,
    fontWeight: fonts.medium,
    color: colors.accent3,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.accent2,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
  },
  modalCreateButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCreateText: {
    fontSize: 16,
    fontWeight: fonts.bold,
    color: colors.primary,
  },
  
  // Month View Styles
  monthViewContainer: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent2,
  },
  monthTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: fonts.bold,
    color: colors.accent3,
  },
  weekDayHeaders: {
    flexDirection: 'row',
    backgroundColor: colors.accent2,
    paddingVertical: 8,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
  },
  monthGridScroll: {
    flex: 1,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  monthDayCell: {
    width: `${100/7}%`,
    aspectRatio: 1,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.accent2,
    backgroundColor: colors.primary,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  monthDayCellOtherMonth: {
    backgroundColor: colors.accent2,
    opacity: 0.5,
  },
  monthDayCellToday: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
    borderWidth: 2,
  },
  monthDayNumber: {
    fontSize: 14,
    fontWeight: fonts.medium,
    color: colors.accent3,
    marginBottom: 2,
  },
  monthDayNumberOtherMonth: {
    color: colors.accent3,
    opacity: 0.4,
  },
  monthDayNumberToday: {
    fontSize: 16,
    fontWeight: fonts.bold,
    color: '#1976D2',
  },
  monthDayAppointments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  monthAppointmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent1,
  },
  monthAppointmentDotCompleted: {
    backgroundColor: colors.secondary,
  },
  monthAppointmentMore: {
    fontSize: 8,
    fontWeight: fonts.medium,
    color: colors.accent3,
    marginLeft: 2,
  },
  
  // Year View Styles
  yearViewContainer: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  yearHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent2,
    alignItems: 'center',
  },
  yearHeaderTitle: {
    fontSize: 24,
    fontWeight: fonts.bold,
    color: colors.accent3,
    letterSpacing: 0.5,
  },
  yearGridScroll: {
    flex: 1,
  },
  yearGridContent: {
    padding: 16,
    paddingBottom: 20,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  yearCell: {
    width: '30%',
    aspectRatio: 1.2,
    backgroundColor: colors.accent2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.accent3,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  yearCellCurrent: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
    borderWidth: 3,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  yearCellText: {
    fontSize: 24,
    fontWeight: fonts.bold,
    color: colors.accent3,
  },
  yearCellTextCurrent: {
    fontSize: 28,
    color: '#1976D2',
  },
  yearAppointmentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  yearAppointmentBadgeText: {
    fontSize: 12,
    fontWeight: fonts.bold,
    color: colors.primary,
=======
  iconCheck: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: colors.secondary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconDelete: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: colors.secondary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
  },
});
