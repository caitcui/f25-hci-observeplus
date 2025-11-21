import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

/**
 * Part 5: onChange Events - Standalone App
 * Demonstrates tapping on labels to change their color
 * This shows that selecting labels results in visual changes on the screen
 */
export default function App() {
  const [selectedLabels, setSelectedLabels] = useState(new Set());

  const labels = [
    { id: 1, name: 'Anxiety', icon: 'mood' },
    { id: 2, name: 'Depression', icon: 'sentiment-dissatisfied' },
    { id: 3, name: 'Stress', icon: 'trending-up' },
    { id: 4, name: 'Calm', icon: 'self-improvement' },
    { id: 5, name: 'Focused', icon: 'center-focus-strong' },
    { id: 6, name: 'Distracted', icon: 'blur-on' },
    { id: 7, name: 'Engaged', icon: 'visibility' },
    { id: 8, name: 'Disengaged', icon: 'visibility-off' },
  ];

  const handleLabelPress = (labelId) => {
    setSelectedLabels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(labelId)) {
        newSet.delete(labelId);
      } else {
        newSet.add(labelId);
      }
      return newSet;
    });
  };

  const getLabelStyle = (labelId) => {
    const isSelected = selectedLabels.has(labelId);
    return [
      styles.labelContainer,
      {
        backgroundColor: isSelected ? '#F4542C' : '#FFFFFF',
        borderColor: isSelected ? '#F4542C' : '#E9C46A',
      },
    ];
  };

  const getLabelTextStyle = (labelId) => {
    const isSelected = selectedLabels.has(labelId);
    return [
      styles.labelText,
      {
        color: isSelected ? '#FFFFFF' : '#71717A',
      },
    ];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.title}>Observe+</Text>
        <Text style={styles.subtitle}>Part 5: Label Selection (onChange Events)</Text>
        <Text style={styles.description}>
          Tap on labels to select them. Selected labels will change color.
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {labels.map((label) => (
          <TouchableOpacity
            key={label.id}
            style={getLabelStyle(label.id)}
            onPress={() => handleLabelPress(label.id)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={label.icon}
              size={24}
              color={selectedLabels.has(label.id) ? '#FFFFFF' : '#71717A'}
            />
            <Text style={getLabelTextStyle(label.id)}>{label.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Selected: {selectedLabels.size} label{selectedLabels.size !== 1 ? 's' : ''}
        </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  labelText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    color: '#71717A',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9C46A',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#71717A',
    textAlign: 'center',
  },
});

