import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts } from '../styles/theme';

export default function AddSessionScreen({ onSave, onBack }) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [title, setTitle] = useState('');
  const [clients, setClients] = useState('');

  // Set default date to today in mm/dd/yy format
  // React.useEffect(() => {
  //   const today = new Date();
  //   const dayNum = today.getDate();
  //   const monthNum = today.getMonth() + 1;
  //   const yearNum = today.getFullYear();
    
  //   // Format as mm/dd/yy
  //   setMonth(monthNum.toString().padStart(2, '0'));
  //   setDay(dayNum.toString().padStart(2, '0'));
  //   setYear(yearNum.toString().slice(-2)); // Last 2 digits of year
  // }, []);

  // Helper to normalize time, now handling minutes (e.g., 12:30 PM -> 12:30 PM)
  const normalizeTime = (timeStr) => {
    if (!timeStr) return null;
    let normalized = timeStr.trim().toUpperCase();
    
    // Handle formats with colon (e.g., 12:30PM)
    // Ensure space between minutes and AM/PM (e.g., 12:30 PM)
    normalized = normalized.replace(/(\d{1,2})(:?)(\d{0,2})\s*(AM|PM)/i, (match, hour, colon, minute, period) => {
      const min = minute.length === 0 ? '00' : minute.padStart(2, '0');
      return `${hour.padStart(2, '0')}:${min} ${period.toUpperCase()}`;
    });
    
    // Handle formats without colon (e.g., 8 AM)
    normalized = normalized.replace(/^(\d{1,2})\s*(AM|PM)$/i, (match, hour, period) => {
      return `${hour.padStart(2, '0')}:00 ${period.toUpperCase()}`;
    });
    
    // Final clean up and basic validation for format: HH:MM AM/PM
    const timeRegex = /^(\d{2}):(\d{2})\s*(AM|PM)$/;
    return timeRegex.test(normalized) ? normalized : null;
  };

  // Helper to convert time string to minutes from midnight
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

  // Helper to validate time format (7:00 AM to 5:00 PM)
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

  // Helper to compare times
  const isEndTimeAfterStart = (startTimeStr, endTimeStr) => {
    const startMinutes = timeToMinutesFromMidnight(startTimeStr);
    const endMinutes = timeToMinutesFromMidnight(endTimeStr);
    
    if (startMinutes === -1 || endMinutes === -1) return false;

    return endMinutes > startMinutes;
  };

  const handleSave = () => {
    console.log('Attempting to save with values:', { day, month, year, startTime, endTime, title, clients });
    
    // Validation - check for empty fields
    if (!day || !month || !year || !startTime || !endTime || !title || !clients) {
      Alert.alert('Incomplete', 'Please fill in all fields');
      console.log('Validation failed: Missing fields');
      return;
    }

    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    // Validate date numbers
    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
      Alert.alert('Invalid Date', 'Please enter valid numbers for date');
      console.log('Validation failed: Invalid date numbers');
      return;
    }

    // Convert 2-digit year to 4-digit (assume 2000s for years 00-99)
    let fullYear = yearNum;
    if (yearNum < 100) {
      fullYear = 2000 + yearNum;
    }
    
    // Use Date object for a robust check (e.g., checking for 02/30/25)
    const dateObj = new Date(fullYear, monthNum - 1, dayNum);
    if (
      dateObj.getMonth() + 1 !== monthNum || 
      dateObj.getDate() !== dayNum || 
      dateObj.getFullYear() !== fullYear
    ) {
      Alert.alert('Invalid Date', 'Please enter a valid calendar date (e.g., 12/25/25)');
      console.log('Validation failed: Invalid date object or range');
      return;
    }

    // --- Time Validation ---
    const normalizedStartTime = normalizeTime(startTime);
    const normalizedEndTime = normalizeTime(endTime);
    
    if (!normalizedStartTime || !normalizedEndTime) {
      Alert.alert('Invalid Time Format', 'Times must be in a valid format like "8 AM" or "1:30 PM"');
      console.log('Validation failed: Invalid time format', { normalizedStartTime, normalizedEndTime });
      return;
    }

    if (!isValidTime(normalizedStartTime) || !isValidTime(normalizedEndTime)) {
      Alert.alert(
        'Invalid Time Range', 
        'Times must be within the business hours of 7:00 AM to 5:00 PM.'
      );
      console.log('Validation failed: Time out of business hours');
      return;
    }

    if (!isEndTimeAfterStart(normalizedStartTime, normalizedEndTime)) {
      Alert.alert('Invalid Time', 'End time must be after start time.');
      console.log('Validation failed: End time not after start time');
      return;
    }

    // Format date string as mm/dd/yy
    const formattedDate = `${monthNum.toString().padStart(2, '0')}/${dayNum.toString().padStart(2, '0')}/${fullYear.toString().slice(-2)}`;
    const dayAbbr = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

    // Create appointment with normalized times
    const newAppointment = {
      id: Date.now(),
      date: formattedDate,
      time: `${normalizedStartTime} - ${normalizedEndTime}`,
      title: title.trim(),
      clients: clients.trim(),
      day: dayAbbr,
      dayNum: dayNum.toString(),
    };

    console.log('Creating appointment:', newAppointment);
    
    try {
      onSave(newAppointment);
      Alert.alert('Success', 'Session added successfully!', [
        { text: 'OK' }
      ]);
    } catch (error) {
      console.error('Error saving appointment:', error);
      Alert.alert('Error', 'Failed to save session. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color={colors.accent3} />
          </TouchableOpacity>
          <View style={styles.titleBadge}>
            <Text style={styles.title}>Add New Session</Text>
          </View>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          {/* Date Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DATE (MM/DD/YY)</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.label}>Month</Text>
                <TextInput
                  style={styles.input}
                  value={month}
                  onChangeText={setMonth}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="MM"
                  placeholderTextColor={colors.accent3}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.label}>Day</Text>
                <TextInput
                  style={styles.input}
                  value={day}
                  onChangeText={setDay}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="DD"
                  placeholderTextColor={colors.accent3}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.label}>Year</Text>
                <TextInput
                  style={styles.input}
                  value={year}
                  onChangeText={setYear}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="YY"
                  placeholderTextColor={colors.accent3}
                />
              </View>
            </View>
          </View>

          {/* Time Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TIME (e.g., 8:30 AM)</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.label}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="e.g. 7 AM"
                  placeholderTextColor={colors.accent3}
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.timeField}>
                <Text style={styles.label}>End Time</Text>
                <TextInput
                  style={styles.input}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="e.g. 5 PM"
                  placeholderTextColor={colors.accent3}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Add Title"
              placeholderTextColor={colors.accent3}
            />
          </View>

          {/* Clients */}
          <View style={styles.section}>
            <Text style={styles.label}>Client(s)</Text>
            <TextInput
              style={styles.input}
              value={clients}
              onChangeText={setClients}
              placeholder="Last, First"
              placeholderTextColor={colors.accent3}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>SAVE SESSION</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  scrollView: { flex: 1 },
  header: {
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  titleBadge: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  title: { fontSize: 18, fontWeight: fonts.bold, color: colors.primary },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeField: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.accent3,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: fonts.medium,
    color: colors.accent3,
  },
  saveButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: fonts.bold,
    color: colors.primary,
    letterSpacing: 0.5,
  },
});