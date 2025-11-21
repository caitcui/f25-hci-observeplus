import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import Signature from 'react-native-signature-canvas';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts } from '../styles/theme';
import { 
  STORAGE_KEYS, 
  getItem, 
  setItem, 
  removeItem,
  loadDraftSession,
} from '../services/storageService';

export default function ReviewSignScreen({ appointment, sessionData, onSubmit, onBack }) {
  const signatureRef = useRef(null);
  const [signatureData, setSignatureData] = useState(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved signature on mount
  useEffect(() => {
    const loadSavedSignature = async () => {
      try {
        const { signature } = await loadDraftSession(appointment?.id);
        if (signature) {
          setSignatureData(signature);
          console.log('✅ Loaded saved signature');
        }
      } catch (error) {
        console.error('Failed to load saved signature:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadSavedSignature();
  }, [appointment?.id]);

  const handleSignature = async (signature) => {
    if (signature) {
      await handleSignatureCapture(signature);
    }
  };

  const handleEmpty = () => {
    Alert.alert('Empty Signature', 'Please draw a signature before saving.');
  };

  const handleClearSignature = async () => {
    signatureRef.current?.clearSignature();
    setSignatureData(null);
    
    // Remove saved signature
    try {
      const signatureKey = STORAGE_KEYS.DRAFT_SIGNATURE(appointment?.id);
      await removeItem(signatureKey);
      console.log('✅ Signature cleared');
    } catch (error) {
      console.error('Failed to clear signature:', error);
    }
  };

  // Handle signature capture - save immediately
  const handleSignatureCapture = async (signature) => {
    if (signature) {
      setSignatureData(signature);
      
      // Save signature immediately when captured
      try {
        const signatureKey = STORAGE_KEYS.DRAFT_SIGNATURE(appointment?.id);
        await setItem(signatureKey, signature);
        console.log('✅ Signature saved');
      } catch (error) {
        console.error('Failed to save signature:', error);
      }
    }
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
      'Entry submitted successfully!',
      [
        {
          text: 'OK',
          onPress: () => onSubmit(signatureData),
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
              <View style={styles.signatureHeaderRight}>
                {signatureData && (
                  <View style={styles.signatureSavedIndicator}>
                    <MaterialIcons name="check-circle" size={16} color={colors.secondary} />
                    <Text style={styles.signatureSavedText}>Saved</Text>
                  </View>
                )}
                {signatureData && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClearSignature}
                  >
                    <Text style={styles.clearButtonText}>CLEAR</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Show saved signature preview if exists */}
            {signatureData && isInitialized && (
              <View style={styles.signaturePreviewContainer}>
                <Text style={styles.signaturePreviewLabel}>Current Signature (tap canvas below to edit)</Text>
                <View style={styles.signaturePreviewBox}>
                  <Image
                    source={{ uri: signatureData }}
                    style={styles.signaturePreviewImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            )}

            <View style={styles.signatureBox}>
              {isInitialized && (
                <Signature
                  ref={signatureRef}
                  onOK={handleSignature}
                  onEmpty={handleEmpty}
                  descriptionText={signatureData ? "Draw to update signature" : "Sign here"}
                  clearText="Clear"
                  confirmText="Save"
                  webStyle={webStyle}
                  autoClear={false}
                  imageType="image/png"
                  // Disable scroll while drawing
                  onBegin={() => setScrollEnabled(false)}
                  onEnd={() => setScrollEnabled(true)}
                />
              )}
            </View>

            <TouchableOpacity
              style={[styles.saveSignatureButton, signatureData && styles.saveSignatureButtonSaved]}
              onPress={handleConfirm}
            >
              <MaterialIcons name={signatureData ? "check-circle" : "check"} size={20} color={colors.primary} />
              <Text style={styles.saveSignatureText}>
                {signatureData ? 'Update Signature' : 'Save Signature'}
              </Text>
            </TouchableOpacity>
            
            {signatureData && (
              <Text style={styles.signatureNote}>
                You can edit your signature until you click SUBMIT
              </Text>
            )}
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

  signatureHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16,
  },
  signatureHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signatureSavedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  signatureSavedText: {
    fontSize: 11,
    fontWeight: fonts.semiBold,
    color: colors.secondary,
  },
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
  saveSignatureButtonSaved: {
    backgroundColor: colors.accent2,
  },
  saveSignatureText: { fontSize: 14, fontWeight: fonts.semiBold, color: colors.primary, marginLeft: 8 },
  signaturePreviewContainer: {
    marginBottom: 16,
  },
  signaturePreviewLabel: {
    fontSize: 11,
    fontWeight: fonts.medium,
    color: colors.accent3,
    marginBottom: 8,
  },
  signaturePreviewBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent1,
    padding: 8,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signaturePreviewImage: {
    width: '100%',
    height: '100%',
  },
  signatureNote: {
    fontSize: 11,
    fontWeight: fonts.medium,
    color: colors.accent3,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },

  submitButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: { fontSize: 16, fontWeight: fonts.bold, color: colors.primary },
});
