import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [sessionNotes, setSessionNotes] = useState('');

  // req 1 & 2
  const HomeScreen = () => (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Observe+</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Colors</Text>
          <View style={styles.colorGrid}>
            <View style={[styles.colorBlock, styles.primaryColor]}>
              <Text style={styles.colorLabel}>Primary</Text>
            </View>
            <View style={[styles.colorBlock, styles.secondaryColor]}>
              <Text style={[styles.colorLabel, styles.whiteText]}>Secondary</Text>
            </View>
            <View style={[styles.colorBlock, styles.accentColor1]}>
              <Text style={styles.colorLabel}>Accent 1</Text>
            </View>
            <View style={[styles.colorBlock, styles.accentColor2]}>
              <Text style={styles.colorLabel}>Accent 2</Text>
            </View>
            <View style={[styles.colorBlock, styles.accentColor3]}>
              <Text style={[styles.colorLabel, styles.whiteText]}>Accent 3</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Typography</Text>
          <Text style={styles.mediumText}>
            Inter Medium (500) - used for general text display
          </Text>
          <Text style={styles.semiBoldText}>
            Inter Semi-Bold (600) - used for subtitles and instructions
          </Text>
          <Text style={styles.boldText}>
            Inter Bold (700) - used for titles
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Icons (Material UI Style)</Text>
          <View style={styles.iconRow}>
            <MaterialIcons name="check-box" size={32} color="#E9C46A" />
            <MaterialIcons name="check-box-outline-blank" size={32} color="#E9C46A" />
            <MaterialIcons name="done-all" size={32} color="#F4542C" />
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setCurrentScreen('input')}
        >
          <Text style={styles.buttonText}>Test Input</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // req3
  const InputScreen = () => {
    let currentText = '';

    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.screenTitle}>Session Notes</Text>

          <View style={styles.section}>
            <Text style={styles.inputLabel}>Enter your session notes:</Text>
            <TextInput
              style={styles.textInput}
              multiline={true}
              placeholder="Type your notes here..."
              placeholderTextColor="#71717A"
              textAlignVertical="top"
              onChangeText={(text) => {
                currentText = text;
              }}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                console.log('Notes:', currentText);
                setCurrentScreen('home');
              }}
            >
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <>
      {currentScreen === 'home' && <HomeScreen />}
      {currentScreen === 'input' && <InputScreen />}
    </>
  );
}

// styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: StatusBar.currentHeight || 44,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: '#F4542C',
    marginBottom: 40,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F4542C',
    marginBottom: 30,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  colorBlock: {
    width: 150,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 10,
  },
  primaryColor: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#71717A',
  },
  secondaryColor: {
    backgroundColor: '#F4542C',
  },
  accentColor1: {
    backgroundColor: '#E9C46A',
  },
  accentColor2: {
    backgroundColor: '#EFF6FF',
  },
  accentColor3: {
    backgroundColor: '#71717A',
  },
  colorLabel: {
    fontWeight: '500',
    fontSize: 14,
  },
  whiteText: {
    color: '#FFFFFF',
  },
  mediumText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
  semiBoldText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  boldText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 30,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: '#F4542C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  secondaryButton: {
    backgroundColor: '#71717A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
  },
  buttonSpacing: {
    marginRight: 5,
    flex: 1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#71717A',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
    minHeight: 200,
    textAlignVertical: 'top',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#71717A',
  },
});