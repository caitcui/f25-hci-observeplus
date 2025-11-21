import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import Signature from 'react-native-signature-canvas';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts } from '../styles/theme';

export default function ReviewSignScreen({ appointment, sessionData, onSubmit, onBack }) {
  const signatureRef = useRef(null);
  const [signatureData, setSignatureData] = useState(null);

  const [scrollEnabled, setScrollEnabled] = useState(true);

  const handleSignature = (signature) => {
    setSignatureData(signature);
<<<<<<< HEAD
    Alert.alert('Signature Saved', 'Your signature has been saved successfully.');
=======
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
  };

  const handleEmpty = () => {
    Alert.alert('Empty Signature', 'Please draw a signature before saving.');
  };

  const handleClearSignature = () => {
    signatureRef.current?.clearSignature();
    setSignatureData(null);
  };

  const handleConfirm = () => {
    if (signatureRef.current) {
      signatureRef.current.readSignature();
    }
  };

  const webStyle = `
    .m-signature-pad {
      box-shadow: none;
      border: none;
    }
    .m-signature-pad--body {
      border: none;
    }
    .m-signature-pad--body canvas {
      border-radius: 12px;
    }
    .m-signature-pad--footer {
      display: none;
    }
  `;

  const handleSubmit = () => {
    if (!signatureData) {
      Alert.alert('Missing Signature', 'Please add your signature before submitting');
      return;
    }

    Alert.alert(
      'Success',
<<<<<<< HEAD
      'Entry submitted successfully! You can view your session notes in the "Past Sessions" section.',
      [
        {
          text: 'OK',
          onPress: () => onSubmit(signatureData), // Pass signature data
=======
      'Entry submitted successfully!',
      [
        {
          text: 'OK',
          onPress: onSubmit,
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView 
        style={styles.scrollView}
        scrollEnabled={scrollEnabled}   // NEW
      >
        {/* header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color={colors.accent3} />
          </TouchableOpacity>
          <View style={styles.titleBadge}>
            <Text style={styles.title}>Review Entry</Text>
          </View>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          
          {/* session basic info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>BASIC INFORMATION</Text>
              <Text style={styles.tapToType}>Tap to enable typing.</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.labelBox}>
                <Text style={styles.labelText}>DATE</Text>
              </View>
              <Text style={styles.infoValue}>{appointment?.date || '09/25/2025'}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.labelBox}>
                <Text style={styles.labelText}>TIME</Text>
              </View>
              <Text style={styles.infoValue}>{appointment?.time || '12:30 PM - 2:30 PM'}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.labelBox}>
                <Text style={styles.labelText}>CLIENT</Text>
              </View>
              <Text style={styles.infoValue}>{appointment?.clients || 'Aldrin, Lily'}</Text>
            </View>
          </View>

          {/* Signature section */}
          <View style={styles.section}>
            <View style={styles.signatureHeader}>
              <Text style={styles.sectionLabel}>TECHNICIAN SIGNATURE</Text>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearSignature}
              >
                <Text style={styles.clearButtonText}>CLEAR</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.signatureBox}>
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

                // NEW: Disable scroll while drawing
                onBegin={() => setScrollEnabled(false)}
                onEnd={() => setScrollEnabled(true)}
              />
            </View>

            <TouchableOpacity
              style={styles.saveSignatureButton}
              onPress={handleConfirm}
            >
              <MaterialIcons name="check" size={20} color={colors.primary} />
              <Text style={styles.saveSignatureText}>Save Signature</Text>
            </TouchableOpacity>
          </View>

          {/* submit */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>SUBMIT</Text>
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
  titleBadge: { backgroundColor: colors.secondary, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  title: { fontSize: 18, fontWeight: fonts.bold, color: colors.primary },
  content: { padding: 20 },
  section: { marginBottom: 32 },
  sectionHeader: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tapToType: { fontSize: 12, fontWeight: fonts.medium, color: colors.accent3 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  labelBox: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 80,
    marginRight: 16,
  },
  labelText: { fontSize: 13, fontWeight: fonts.bold, color: colors.secondary, textAlign: 'center' },
  infoValue: { fontSize: 14, fontWeight: fonts.medium, color: colors.accent3, flex: 1 },

  signatureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  clearButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  clearButtonText: { fontSize: 13, fontWeight: fonts.bold, color: colors.primary },

  signatureBox: {
    backgroundColor: '#E5E5E5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.accent1,
    height: 200,
    overflow: 'hidden',
  },

  saveSignatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent1,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  saveSignatureText: { fontSize: 14, fontWeight: fonts.semiBold, color: colors.primary, marginLeft: 8 },

  submitButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: { fontSize: 16, fontWeight: fonts.bold, color: colors.primary },
});
