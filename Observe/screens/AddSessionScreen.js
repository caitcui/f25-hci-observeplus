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
  const [title, setTitle] = useState('Direct Therapy');
  const [clients, setClients] = useState('');

  // Set default date to today
  React.useEffect(() => {
    const today = new Date();
    setDay(today.getDate().toString());
    setMonth((today.getMonth() + 1).toString());
    setYear(today.getFullYear().toString());
  }, []);

  // Helper to normalize and validate time
  const normalizeTime = (timeStr) => {
    if (!timeStr) return null;
    
    // Remove extra spaces and convert to uppercase
    let normalized = timeStr.trim().toUpperCase();
    
    // Handle formats like "8 AM", "8:00 AM", "8:00AM", "8AM"
    // Remove colons if present
    normalized = normalized.replace(/:/g, '');
    
    // Ensure space between number and AM/PM
    normalized = normalized.replace(/(\d+)(AM|PM)/i, '$1 $2');
    
    return normalized.trim();
  };

  // Helper to validate time format
  const isValidTime = (timeStr) => {
    if (!timeStr) return false;
    
    const normalized = normalizeTime(timeStr);
    // Match: number (1-12) followed by AM or PM
    const timeRegex = /^(\d{1,2})\s*(AM|PM)$/i;
    return timeRegex.test(normalized);
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

    // Validate date ranges
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 2000) {
      Alert.alert('Invalid Date', 'Please enter a valid date (Day: 1-31, Month: 1-12, Year: 2000+)');
      console.log('Validation failed: Date out of range');
      return;
    }

    // Validate time format (more flexible)
    const normalizedStartTime = normalizeTime(startTime);
    const normalizedEndTime = normalizeTime(endTime);
    
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      Alert.alert(
        'Invalid Time', 
        'Please enter time in format like "8 AM" or "2 PM"\n\nExamples: "8 AM", "2 PM", "10:30 AM"'
      );
      console.log('Validation failed: Invalid time format', { startTime, endTime, normalizedStartTime, normalizedEndTime });
      return;
    }

    // Format date
    const dateObj = new Date(yearNum, monthNum - 1, dayNum);
    if (isNaN(dateObj.getTime())) {
      Alert.alert('Invalid Date', 'Please enter a valid date');
      console.log('Validation failed: Invalid date object');
      return;
    }

    // Format date string
    const formattedDate = `${monthNum.toString().padStart(2, '0')}/${dayNum.toString().padStart(2, '0')}/${yearNum.toString().slice(-2)}`;
    const dayAbbr = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

    // Use normalized times
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
            <Text style={styles.sectionTitle}>DATE</Text>
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
                  maxLength={4}
                  placeholder="YYYY"
                  placeholderTextColor={colors.accent3}
                />
              </View>
            </View>
          </View>

          {/* Time Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TIME</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.label}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="8 AM"
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
                  placeholder="10 AM"
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
              placeholder="Direct Therapy"
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
    fontSize: 11,
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
    fontSize: 11,
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
    padding: 16,
    fontSize: 14,
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
