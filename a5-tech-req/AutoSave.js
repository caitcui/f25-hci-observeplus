import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

/**
 * Part 7: localStorage Savings (AsyncStorage) - Standalone App
 * Demonstrates autosave functionality that saves user input at fixed intervals
 * After leaving or refreshing, the saved content is displayed upon reentry
 */
export default function App() {
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const saveIntervalRef = useRef(null);

  const STORAGE_KEY = 'observeplus_session_notes';
  const AUTOSAVE_INTERVAL = 3000; // 3 seconds

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedText = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedText !== null) {
          setText(savedText);
          const savedTimestamp = await AsyncStorage.getItem(STORAGE_KEY + '_timestamp');
          if (savedTimestamp) {
            setLastSaved(new Date(parseInt(savedTimestamp)));
          }
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load saved data:', error);
        setIsInitialized(true);
      }
    };

    loadSavedData();
  }, []);

  // Autosave functionality
  useEffect(() => {
    if (!isInitialized) return;

    // Clear any existing interval
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }

    // Save immediately when text changes (debounced in real app, but for demo)
    const saveData = async () => {
      if (text.trim() === '') return;

      try {
        setIsSaving(true);
        await AsyncStorage.setItem(STORAGE_KEY, text);
        const timestamp = Date.now();
        await AsyncStorage.setItem(STORAGE_KEY + '_timestamp', timestamp.toString());
        setLastSaved(new Date(timestamp));
        
        // Brief delay to show saving indicator
        setTimeout(() => {
          setIsSaving(false);
        }, 500);
      } catch (error) {
        console.error('Failed to save data:', error);
        setIsSaving(false);
      }
    };

    // Set up interval for autosave
    saveIntervalRef.current = setInterval(() => {
      if (text.trim() !== '') {
        saveData();
      }
    }, AUTOSAVE_INTERVAL);

    // Cleanup on unmount or when text changes
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [text, isInitialized]);

  const clearSavedData = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(STORAGE_KEY + '_timestamp');
      setText('');
      setLastSaved(null);
      setIsSaving(false);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.title}>Observe+</Text>
        <Text style={styles.subtitle}>Part 7: AutoSave (localStorage)</Text>
        <Text style={styles.description}>
          Type your session notes below. Text is automatically saved every 3 seconds.
        </Text>
      </View>

      <View style={styles.statusBar}>
        <View style={styles.statusIndicator}>
          <MaterialIcons
            name={isSaving ? 'save' : 'cloud-done'}
            size={20}
            color={isSaving ? '#F4542C' : '#71717A'}
          />
          <Text style={styles.statusText}>
            {isSaving ? 'Saving...' : 'Autosave: ON'}
          </Text>
        </View>
        {lastSaved && (
          <Text style={styles.timestampText}>
            Last saved: {lastSaved.toLocaleTimeString()}
          </Text>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="Enter your session notes here..."
          placeholderTextColor="#71717A"
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearSavedData}
          disabled={!text.trim()}
        >
          <MaterialIcons name="clear" size={20} color="#FFFFFF" />
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9C46A',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#71717A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F4542C',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#71717A',
    lineHeight: 20,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9C46A',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#71717A',
    marginLeft: 8,
  },
  timestampText: {
    fontSize: 12,
    color: '#71717A',
  },
  scrollView: {
    flex: 1,
  },
  textInput: {
    flex: 1,
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9C46A',
    fontSize: 16,
    color: '#71717A',
    minHeight: 300,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9C46A',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4542C',
    padding: 12,
    borderRadius: 8,
    opacity: 1,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

