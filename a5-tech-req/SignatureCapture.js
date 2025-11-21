import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import Signature from 'react-native-signature-canvas';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

/**
 * Part 9: Signature Capture - Standalone App
 * Demonstrates the ability to draw and capture signatures for the "sign-off" screen
 * Utilizes the react-native-signature-canvas library
 */
export default function App() {
  const signatureRef = useRef(null);
  const [signatureData, setSignatureData] = useState(null);
  const [hasSignature, setHasSignature] = useState(false);

  const handleSignature = async (signature) => {
    if (signature) {
      setSignatureData(signature);
      setHasSignature(true);
      
      // Save signature to AsyncStorage
      try {
        await AsyncStorage.setItem('observeplus_signature', signature);
        await AsyncStorage.setItem('observeplus_signature_timestamp', Date.now().toString());
        Alert.alert('Success', 'Signature saved successfully!');
      } catch (error) {
        console.error('Failed to save signature:', error);
        Alert.alert('Error', 'Failed to save signature');
      }
    }
  };

  const handleEmpty = () => {
    Alert.alert('Empty Signature', 'Please draw a signature before saving.');
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setSignatureData(null);
    setHasSignature(false);
  };

  const handleConfirm = () => {
    if (signatureRef.current) {
      signatureRef.current.readSignature();
    }
  };

  const webStyle = `
    .m-signature-pad {
      box-shadow: none;
      border: 2px solid #E9C46A;
      border-radius: 8px;
    }
    .m-signature-pad--body {
      border: none;
    }
    .m-signature-pad--body canvas {
      border-radius: 8px;
    }
    .m-signature-pad--footer {
      display: none;
    }
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.title}>Observe+</Text>
        <Text style={styles.subtitle}>Part 9: Signature Capture</Text>
        <Text style={styles.description}>
          Draw your signature below to complete the sign-off process
        </Text>
      </View>

      <View style={styles.signatureContainer}>
        <Signature
          ref={signatureRef}
          onOK={handleSignature}
          onEmpty={handleEmpty}
          descriptionText="Sign here"
          clearText="Clear"
          confirmText="Save"
          webStyle={webStyle}
          autoClear={false}
          imageType="image/png"
          style={styles.signature}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={handleClear}
        >
          <MaterialIcons name="clear" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleConfirm}
        >
          <MaterialIcons name="save" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Save Signature</Text>
        </TouchableOpacity>
      </View>

      {hasSignature && (
        <View style={styles.successContainer}>
          <MaterialIcons name="check-circle" size={24} color="#E9C46A" />
          <Text style={styles.successText}>Signature captured successfully!</Text>
        </View>
      )}
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
  signatureContainer: {
    flex: 1,
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E9C46A',
  },
  signature: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9C46A',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
  },
  clearButton: {
    backgroundColor: '#71717A',
  },
  saveButton: {
    backgroundColor: '#F4542C',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9C46A',
  },
  successText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#71717A',
    marginLeft: 8,
  },
});

