import { StyleSheet, StatusBar } from 'react-native';

// Observe+ Style Guide
export const colors = {
  primary: '#FFFFFF',
  secondary: '#F4542C',
  accent1: '#E9C46A',
  accent2: '#EFF6FF',
  accent3: '#71717A',
};

export const fonts = {
  medium: '500',
  semiBold: '600',
  bold: '700',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingTop: StatusBar.currentHeight || 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: fonts.bold,
    color: colors.secondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: fonts.bold,
    color: colors.secondary,
    marginBottom: 30,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: fonts.semiBold,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  secondaryButton: {
    backgroundColor: colors.accent3,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.primary,
    fontWeight: fonts.semiBold,
    fontSize: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 2,
    borderColor: colors.accent3,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontWeight: fonts.medium,
    minHeight: 200,
    textAlignVertical: 'top',
  },
});

export default { colors, fonts, commonStyles };
