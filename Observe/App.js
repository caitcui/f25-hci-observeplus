<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
=======
import React, { useState } from 'react';
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
import {
  StyleSheet,
  Text,
  View,
<<<<<<< HEAD
  StatusBar,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CalendarScreen from './screens/CalendarScreen';
import SessionNoteScreen from './screens/SessionNoteScreen';
import ReviewSignScreen from './screens/ReviewSignScreen';
import AddSessionScreen from './screens/AddSessionScreen';
import HistoryScreen from './screens/HistoryScreen';

const COMPLETED_SESSIONS_KEY = 'observeplus_completed_sessions';
=======
  StatusBar
} from 'react-native';
import CalendarScreen from './screens/CalendarScreen';
import SessionNoteScreen from './screens/SessionNoteScreen';
import ReviewSignScreen from './screens/ReviewSignScreen';
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('calendar');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [sessionData, setSessionData] = useState({
    notes: '',
    tags: [],
    peopleCategory: '',
    actionsCategory: ''
  });
<<<<<<< HEAD
  const [completedAppointments, setCompletedAppointments] = useState(new Set());
  const [appointments, setAppointments] = useState([]);
  const [isAppointmentsLoaded, setIsAppointmentsLoaded] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Sample appointments data (used for initialization)
  const SAMPLE_APPOINTMENTS = [
=======

  // sample appointments data, aligned with figma prototype
  const appointments = [
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
    {
      id: 1,
      date: '09/25/25',
      time: '8 AM - 10 AM',
      title: 'Direct Therapy',
      clients: 'Mosby, Ted',
      day: 'THU',
      dayNum: '25',
    },
    {
      id: 2,
      date: '09/26/25',
      time: '11 AM - 1 PM',
      title: 'Direct Therapy',
      clients: 'Scher, Robin',
      day: 'FRI',
      dayNum: '26',
    },
    {
      id: 3,
      date: '09/25/25',
      time: '12:30 PM - 2:30 PM',
      title: 'Direct Therapy',
      clients: 'Aldrin, Lily',
      day: 'THU',
      dayNum: '25',
    },
  ];

<<<<<<< HEAD
  // Save appointments to AsyncStorage
  const saveAppointments = async (appointmentsToSave) => {
    try {
      await AsyncStorage.setItem('appointments', JSON.stringify(appointmentsToSave));
      console.log('Appointments saved to AsyncStorage:', appointmentsToSave.length, 'appointments');
    } catch (error) {
      console.error('Failed to save appointments:', error);
    }
  };

  // Save completed session to AsyncStorage
  const saveCompletedSession = async (sessionRecord) => {
    try {
      const existingSessions = await AsyncStorage.getItem(COMPLETED_SESSIONS_KEY);
      const sessions = existingSessions ? JSON.parse(existingSessions) : [];
      sessions.push(sessionRecord);
      await AsyncStorage.setItem(COMPLETED_SESSIONS_KEY, JSON.stringify(sessions));
      console.log('✅ Completed session saved:', {
        id: sessionRecord.id,
        appointmentId: sessionRecord.appointmentId,
        client: sessionRecord.client,
        timestamp: new Date(sessionRecord.timestamp).toLocaleString()
      });
    } catch (error) {
      console.error('❌ Failed to save completed session:', error);
      throw error;
    }
  };

  // Load appointments from AsyncStorage on mount
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const savedAppointments = await AsyncStorage.getItem('appointments');
        
        if (savedAppointments) {
          const parsed = JSON.parse(savedAppointments);
          console.log('✅ Appointments loaded from AsyncStorage:', parsed.length, 'appointments');
          setAppointments(parsed);
        } else {
          console.log('📝 No saved appointments found. Initializing with sample appointments.');
          setAppointments(SAMPLE_APPOINTMENTS);
          await saveAppointments(SAMPLE_APPOINTMENTS);
        }
      } catch (error) {
        console.error('❌ Failed to load appointments:', error);
        setAppointments(SAMPLE_APPOINTMENTS);
      } finally {
        setIsAppointmentsLoaded(true);
      }
    };

    loadAppointments();
  }, []);

  // Load completed appointments on mount
  useEffect(() => {
    const loadCompletedAppointments = async () => {
      try {
        const saved = await AsyncStorage.getItem('completed_appointments');
        if (saved) {
          const completedIds = JSON.parse(saved);
          setCompletedAppointments(new Set(completedIds));
          console.log('✅ Loaded completed appointments:', completedIds.length);
        }
      } catch (error) {
        console.error('Failed to load completed appointments:', error);
      }
    };
    loadCompletedAppointments();
  }, []);

  // Save appointments to AsyncStorage whenever they change
  useEffect(() => {
    if (isAppointmentsLoaded) {
      // Save even if appointments array is empty (after deletion)
      saveAppointments(appointments);
    }
  }, [appointments, isAppointmentsLoaded]);

  const handleAppointmentSelect = async (appointment) => {
    // Check if appointment is completed
    if (completedAppointments.has(appointment.id)) {
      try {
        // Load completed sessions to find the one matching this appointment
        const existingSessions = await AsyncStorage.getItem(COMPLETED_SESSIONS_KEY);
        if (existingSessions) {
          const sessions = JSON.parse(existingSessions);
          const matchingSession = sessions.find(s => s.appointmentId === appointment.id);
          
          if (matchingSession) {
            // Navigate to history and show this session
            setSelectedSession(matchingSession);
            setCurrentScreen('history');
            return;
          }
        }
        // If session not found, just go to history
        setCurrentScreen('history');
      } catch (error) {
        console.error('Failed to load session:', error);
        // Fallback to history screen
        setCurrentScreen('history');
      }
    } else {
      // Not completed - open session note screen as usual
      setSelectedAppointment(appointment);
      setCurrentScreen('sessionNote');
    }
=======
  const handleAppointmentSelect = (appointment) => {
    setSelectedAppointment(appointment);
    setCurrentScreen('sessionNote');
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
  };

  const handleSessionSubmit = (data) => {
    setSessionData(data);
    setCurrentScreen('reviewSign');
  };

<<<<<<< HEAD
  // Handle final submission from ReviewSignScreen
  const handleFinalSubmit = async (signatureData) => {
    try {
      if (!selectedAppointment) {
        Alert.alert('Error', 'No appointment selected');
        return;
      }

      const sessionId = Date.now();
      const sessionRecord = {
        id: sessionId,
        appointmentId: selectedAppointment.id,
        date: selectedAppointment.date,
        client: selectedAppointment.clients,
        notes: sessionData.notes,
        tags: sessionData.tags,
        peopleCategory: sessionData.peopleCategory,
        actionsCategory: sessionData.actionsCategory,
        signature: signatureData,
        timestamp: Date.now()
      };

      console.log('💾 Saving completed session record:', sessionRecord);
      await saveCompletedSession(sessionRecord);

      const updatedCompleted = new Set([...completedAppointments, selectedAppointment.id]);
      setCompletedAppointments(updatedCompleted);
      await AsyncStorage.setItem(
        'completed_appointments',
        JSON.stringify([...updatedCompleted])
      );

      const STORAGE_KEY = `draft_session_${selectedAppointment.id || 'default'}`;
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(STORAGE_KEY + '_timestamp');
      
      setSessionData({
        notes: '',
        tags: [],
        peopleCategory: '',
        actionsCategory: ''
      });
      setSelectedAppointment(null);
      setCurrentScreen('calendar');
      
      Alert.alert('Success', 'Session submitted and saved successfully!');
    } catch (error) {
      console.error('❌ Failed to save session:', error);
      Alert.alert('Error', 'Failed to save session. Please try again.');
    }
  };

  const handleAddSession = () => {
    setSelectedAppointment(null);
    setCurrentScreen('addSession');
  };

  const handleAddAppointment = (newAppointment) => {
    try {
      console.log('Adding new appointment from modal:', newAppointment);
      const updated = [...appointments, newAppointment];
      setAppointments(updated);
      console.log('Appointment added. Total:', updated.length);
    } catch (error) {
      console.error('Failed to add appointment:', error);
      Alert.alert('Error', 'Failed to add appointment. Please try again.');
    }
  };

  const handleUpdateAppointment = (updatedAppointment) => {
    try {
      console.log('Updating appointment:', updatedAppointment);
      const updated = appointments.map(appt => 
        appt.id === updatedAppointment.id ? updatedAppointment : appt
      );
      setAppointments(updated);
      console.log('Appointment updated. Total:', updated.length);
    } catch (error) {
      console.error('Failed to update appointment:', error);
      Alert.alert('Error', 'Failed to update appointment. Please try again.');
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    try {
      console.log('Deleting appointment:', appointmentId);
      const updated = appointments.filter(appt => appt.id !== appointmentId);
      setAppointments(updated);
      
      // Explicitly save the updated appointments to AsyncStorage
      await saveAppointments(updated);
      
      if (completedAppointments.has(appointmentId)) {
        const updatedCompleted = new Set([...completedAppointments]);
        updatedCompleted.delete(appointmentId);
        setCompletedAppointments(updatedCompleted);
        await AsyncStorage.setItem(
          'completed_appointments',
          JSON.stringify([...updatedCompleted])
        ).catch(err => console.error('Failed to update completed appointments:', err));
      }
      
      console.log('Appointment deleted. Remaining:', updated.length);
    } catch (error) {
      console.error('Failed to delete appointment:', error);
      Alert.alert('Error', 'Failed to delete appointment. Please try again.');
    }
  };

  const handleSaveSession = async (newAppointment) => {
    try {
      console.log('Saving new appointment:', newAppointment);
      const updated = [...appointments, newAppointment];
      setAppointments(updated);
      console.log('Updated appointments array length:', updated.length);
      setCurrentScreen('calendar');
    } catch (error) {
      console.error('Failed to save appointment:', error);
      Alert.alert('Error', 'Failed to save appointment. Please try again.');
    }
  };

  const handleViewHistory = () => {
    setCurrentScreen('history');
  };

  const handleViewSession = (session) => {
    setSelectedSession(session);
  };

  const handleBackFromHistory = () => {
    setCurrentScreen('calendar');
    setSelectedSession(null);
  };

  const handleDeleteSession = async (sessionId, appointmentId) => {
    try {
      console.log('Deleting session and appointment:', { sessionId, appointmentId });
      
      // Delete session from completed sessions
      const existingSessions = await AsyncStorage.getItem(COMPLETED_SESSIONS_KEY);
      if (existingSessions) {
        const sessions = JSON.parse(existingSessions);
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        await AsyncStorage.setItem(
          COMPLETED_SESSIONS_KEY,
          JSON.stringify(updatedSessions)
        );
        console.log('✅ Session deleted from history');
      }
      
      // Delete the corresponding appointment
      if (appointmentId) {
        const updated = appointments.filter(appt => appt.id !== appointmentId);
        setAppointments(updated);
        await saveAppointments(updated);
        console.log('✅ Appointment deleted from calendar');
        
        // Remove from completed appointments
        if (completedAppointments.has(appointmentId)) {
          const updatedCompleted = new Set([...completedAppointments]);
          updatedCompleted.delete(appointmentId);
          setCompletedAppointments(updatedCompleted);
          await AsyncStorage.setItem(
            'completed_appointments',
            JSON.stringify([...updatedCompleted])
          );
          console.log('✅ Removed from completed appointments');
        }
      }
      
      console.log('✅ Session and appointment deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete session/appointment:', error);
      Alert.alert('Error', 'Failed to delete session. Please try again.');
    }
=======
  const handleFinalSubmit = () => {
    // reset and go back to calendar
    setSessionData({
      notes: '',
      tags: [],
      peopleCategory: '',
      actionsCategory: ''
    });
    setSelectedAppointment(null);
    setCurrentScreen('calendar');
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
  };

  return (
    <>
      {currentScreen === 'calendar' && (
        <CalendarScreen 
          appointments={appointments}
          onAppointmentSelect={handleAppointmentSelect}
<<<<<<< HEAD
          completedAppointments={completedAppointments}
          onAddSession={handleAddSession}
          onAddAppointment={handleAddAppointment}
          onDeleteAppointment={handleDeleteAppointment}
          onUpdateAppointment={handleUpdateAppointment}
          onViewHistory={handleViewHistory}
=======
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
        />
      )}
      {currentScreen === 'sessionNote' && (
        <SessionNoteScreen 
          appointment={selectedAppointment}
          onSubmit={handleSessionSubmit}
          onBack={() => setCurrentScreen('calendar')}
        />
      )}
      {currentScreen === 'reviewSign' && (
        <ReviewSignScreen 
          appointment={selectedAppointment}
          sessionData={sessionData}
          onSubmit={handleFinalSubmit}
          onBack={() => setCurrentScreen('sessionNote')}
        />
      )}
<<<<<<< HEAD
      {currentScreen === 'addSession' && (
        <AddSessionScreen
          onSave={handleSaveSession}
          onBack={() => setCurrentScreen('calendar')}
        />
      )}
      {currentScreen === 'history' && (
        <HistoryScreen
          onBack={handleBackFromHistory}
          onViewSession={handleViewSession}
          onDeleteSession={handleDeleteSession}
          initialSession={selectedSession}
        />
      )}
=======
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
    </>
  );
}
