import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CalendarScreen from './screens/CalendarScreen';
import SessionNoteScreen from './screens/SessionNoteScreen';
import ReviewSignScreen from './screens/ReviewSignScreen';
import AddSessionScreen from './screens/AddSessionScreen';
import HistoryScreen from './screens/HistoryScreen';
import { trackTagUsage } from './services/tagSuggestionService';
import { 
  initializeStorage, 
  getItem, 
  setItem, 
  removeItem,
  STORAGE_KEYS,
  clearDraftSession,
  validateAndRepairData,
  loadDraftSession,
} from './services/storageService';

const COMPLETED_SESSIONS_KEY = STORAGE_KEYS.COMPLETED_SESSIONS;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('calendar');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [sessionData, setSessionData] = useState({
    notes: '',
    tags: [],
    peopleCategory: '',
    actionsCategory: ''
  });
  const [completedAppointments, setCompletedAppointments] = useState(new Set());
  const [appointments, setAppointments] = useState([]);
  const [isAppointmentsLoaded, setIsAppointmentsLoaded] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [navigationContext, setNavigationContext] = useState({ source: 'calendar', viewDate: null });

  // Sample appointments data (used for initialization)
  const SAMPLE_APPOINTMENTS = [
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

  const calculateDateOffset = (dateStr) => {
    const [month, day, year] = dateStr.split('/').map(Number);
    const targetDate = new Date(2000 + year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Save appointments to storage
  const saveAppointments = async (appointmentsToSave) => {
    try {
      await setItem(STORAGE_KEYS.APPOINTMENTS, appointmentsToSave);
      console.log('✅ Appointments saved:', appointmentsToSave.length, 'appointments');
    } catch (error) {
      console.error('❌ Failed to save appointments:', error);
      Alert.alert('Error', 'Failed to save appointments. Please try again.');
    }
  };

  // Save completed session to storage
  const saveCompletedSession = async (sessionRecord) => {
    try {
      const sessions = await getItem(STORAGE_KEYS.COMPLETED_SESSIONS, []);
      if (!Array.isArray(sessions)) {
        throw new Error('Invalid sessions data structure');
      }
      sessions.push(sessionRecord);
      await setItem(STORAGE_KEYS.COMPLETED_SESSIONS, sessions);
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

  // Initialize storage and load data on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize storage system
        await initializeStorage();
        
        // Validate and repair any corrupted data
        await validateAndRepairData();
        
        // Load appointments
        const savedAppointments = await getItem(STORAGE_KEYS.APPOINTMENTS, null);
        
        if (savedAppointments && Array.isArray(savedAppointments) && savedAppointments.length > 0) {
          console.log('✅ Appointments loaded:', savedAppointments.length, 'appointments');
          setAppointments(savedAppointments);
        } else {
          console.log('📝 No saved appointments found. Initializing with sample appointments.');
          setAppointments(SAMPLE_APPOINTMENTS);
          await saveAppointments(SAMPLE_APPOINTMENTS);
        }
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setAppointments(SAMPLE_APPOINTMENTS);
      } finally {
        setIsAppointmentsLoaded(true);
      }
    };

    initializeApp();
  }, []);

  // Load completed appointments on mount
  useEffect(() => {
    const loadCompletedAppointments = async () => {
      try {
        const saved = await getItem(STORAGE_KEYS.COMPLETED_APPOINTMENTS, []);
        if (Array.isArray(saved) && saved.length > 0) {
          setCompletedAppointments(new Set(saved));
          console.log('✅ Loaded completed appointments:', saved.length);
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

  const handleAppointmentSelect = async (appointment,context = { source: 'calendar', viewDate: null }) => {
    setNavigationContext({ ...context, source: 'calendar', appointment });

    // Check if appointment is completed
    if (completedAppointments.has(appointment.id)) {
      try {
        // Load completed sessions to find the one matching this appointment
        const sessions = await getItem(COMPLETED_SESSIONS_KEY, []);
        if (Array.isArray(sessions) && sessions.length > 0) {
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
  };

  const handleSessionSubmit = (data) => {
    setSessionData(data);
    setCurrentScreen('reviewSign');
  };

  // Handle back from ReviewSignScreen - load latest session data
  const handleBackFromReviewSign = async () => {
    try {
      // Load the latest session data from storage
      const { draft } = await loadDraftSession(selectedAppointment?.id);
      if (draft) {
        setSessionData({
          notes: draft.notes || '',
          tags: draft.tags || [],
          peopleCategory: draft.peopleCategory || '',
          actionsCategory: draft.actionsCategory || '',
        });
        console.log('✅ Loaded session data on back');
      }
    } catch (error) {
      console.error('Failed to load session data on back:', error);
    }
    setCurrentScreen('sessionNote');
  };

  // Handle data changes from SessionNoteScreen
  const handleSessionDataChange = (data) => {
    setSessionData(data);
  };

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

      // Track tag usage for suggestions
      await trackTagUsage(sessionData);

      const updatedCompleted = new Set([...completedAppointments, selectedAppointment.id]);
      setCompletedAppointments(updatedCompleted);
      await setItem(STORAGE_KEYS.COMPLETED_APPOINTMENTS, [...updatedCompleted]);

      // Clear draft data after successful submission
      await clearDraftSession(selectedAppointment.id);
      
      setSessionData({
        notes: '',
        tags: [],
        peopleCategory: '',
        actionsCategory: ''
      });
      setSelectedAppointment(null);

      const dateOffset = calculateDateOffset(selectedAppointment.date);
      setNavigationContext({ 
        source: 'calendar', 
        dateOffset: dateOffset
      });
      
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
        await setItem(STORAGE_KEYS.COMPLETED_APPOINTMENTS, [...updatedCompleted]).catch(err => 
          console.error('Failed to update completed appointments:', err)
        );
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
      const dateOffset = calculateDateOffset(newAppointment.date);
      setNavigationContext({ 
        source: 'calendar', 
        dateOffset: dateOffset 
      });
      setCurrentScreen('calendar');
    } catch (error) {
      console.error('Failed to save appointment:', error);
      Alert.alert('Error', 'Failed to save appointment. Please try again.');
    }
  };

  const handleViewHistory = () => {
    setCurrentScreen('history');
  };

  const handleViewSession = (session, context = {}) => {
    setNavigationContext({ ...context, source: 'history' });
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
      const sessions = await getItem(STORAGE_KEYS.COMPLETED_SESSIONS, []);
      if (Array.isArray(sessions)) {
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        await setItem(STORAGE_KEYS.COMPLETED_SESSIONS, updatedSessions);
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
          await setItem(STORAGE_KEYS.COMPLETED_APPOINTMENTS, [...updatedCompleted]);
          console.log('✅ Removed from completed appointments');
        }
      }
      
      console.log('✅ Session and appointment deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete session/appointment:', error);
      Alert.alert('Error', 'Failed to delete session. Please try again.');
    }
  };

  return (
    <>
      {currentScreen === 'calendar' && (
        <CalendarScreen 
          appointments={appointments}
          onAppointmentSelect={handleAppointmentSelect}
          completedAppointments={completedAppointments}
          initialDateOffset={navigationContext.dateOffset || 0}
          onAddSession={handleAddSession}
          onAddAppointment={handleAddAppointment}
          onDeleteAppointment={handleDeleteAppointment}
          onUpdateAppointment={handleUpdateAppointment}
          onViewHistory={handleViewHistory}
        />
      )}
      {currentScreen === 'sessionNote' && (
        <SessionNoteScreen 
          key={selectedAppointment?.id} // Force remount when appointment changes
          appointment={selectedAppointment}
          onSubmit={handleSessionSubmit}
          // onBack={() => setCurrentScreen('calendar')}
          onBack={() => navigationContext.source === 'history' ? 
                setCurrentScreen('history') : setCurrentScreen('calendar')}
          onDataChange={handleSessionDataChange}
        />
      )}
      {currentScreen === 'reviewSign' && (
        <ReviewSignScreen 
          appointment={selectedAppointment}
          sessionData={sessionData}
          onSubmit={handleFinalSubmit}
          // onBack={handleBackFromReviewSign}
          onBack={() => navigationContext.source === 'history' ? 
              setCurrentScreen('history') : handleBackFromReviewSign()}
        />
      )}
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
    </>
  );
}
