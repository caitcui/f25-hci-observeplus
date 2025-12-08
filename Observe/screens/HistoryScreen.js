import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { colors, fonts } from '../styles/theme';
import { getItem, setItem, STORAGE_KEYS } from '../services/storageService';

const COMPLETED_SESSIONS_KEY = STORAGE_KEYS.COMPLETED_SESSIONS;

export default function HistoryScreen({ onBack, onViewSession, onDeleteSession, initialSession }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Load completed sessions from AsyncStorage
  useEffect(() => {
    loadSessions();
  }, []);

  // Set initial session if provided
  useEffect(() => {
    if (initialSession) {
      setSelectedSession(initialSession);
    }
  }, [initialSession]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const savedSessions = await getItem(COMPLETED_SESSIONS_KEY, []);
      if (Array.isArray(savedSessions) && savedSessions.length > 0) {
        // Sort by timestamp (newest first - reverse chronological)
        const sorted = savedSessions.sort((a, b) =>  {
          // Parse dates (MM/DD/YY format)
          const dateA = new Date('20' + a.date.split('/')[2], a.date.split('/')[0] - 1, a.date.split('/')[1]);
          const dateB = new Date('20' + b.date.split('/')[2], b.date.split('/')[0] - 1, b.date.split('/')[1]);
          return dateB - dateA; // Newest first
        });
        setSessions(sorted);
        console.log('✅ Loaded', sorted.length, 'completed sessions');
      } else {
        setSessions([]);
        console.log('📝 No completed sessions found');
      }
    } catch (error) {
      console.error('❌ Failed to load sessions:', error);
      Alert.alert('Error', 'Failed to load session history');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter sessions based on search text and date range
  const filteredSessions = useMemo(() => {
    let filtered = [...sessions];

    // Filter by search text (case-insensitive, client name)
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(session => {
        const clientName = (session.client || '').toLowerCase();
        return clientName.includes(searchLower);
      });
    }

    // Filter by date range
    if (dateFilter !== 'All Time') {
      const now = Date.now();
      let cutoffDate;

      switch (dateFilter) {
        case 'Last Week':
          cutoffDate = now - (7 * 24 * 60 * 60 * 1000);
          break;
        case 'Last Month':
          cutoffDate = now - (30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(session => {
        const sessionDate = new Date('20' + session.date.split('/')[2], session.date.split('/')[0] - 1, session.date.split('/')[1]);
        return sessionDate >= cutoffDate;
      });
    }

    return filtered;
  }, [sessions, searchText, dateFilter]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getNotesPreview = (notes) => {
    if (!notes) return 'No notes';
    if (notes.length <= 50) return notes;
    return notes.substring(0, 50) + '...';
  };

  // Format session data for export
  const formatSessionForExport = (session) => {
    const date = new Date(session.timestamp);
    const formattedDate = date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    let content = `SESSION REPORT\n`;
    content += `${'='.repeat(50)}\n\n`;
    content += `Date: ${session.date}\n`;
    content += `Client: ${session.client}\n`;
    content += `Completed: ${formattedDate}\n`;
    content += `Session ID: ${session.id}\n`;
    content += `Appointment ID: ${session.appointmentId}\n\n`;
    
    content += `NOTES\n`;
    content += `${'-'.repeat(50)}\n`;
    content += `${session.notes || 'No notes recorded'}\n\n`;
    
    if (session.tags && session.tags.length > 0) {
      content += `TAGS\n`;
      content += `${'-'.repeat(50)}\n`;
      session.tags.forEach(tag => {
        content += `• ${tag}\n`;
      });
      content += `\n`;
    }
    
    if (session.peopleCategory || session.actionsCategory) {
      content += `CATEGORIES\n`;
      content += `${'-'.repeat(50)}\n`;
      if (session.peopleCategory) {
        content += `People: ${session.peopleCategory}\n`;
      }
      if (session.actionsCategory) {
        content += `Actions: ${session.actionsCategory}\n`;
      }
      content += `\n`;
    }
    
    content += `SIGNATURE\n`;
    content += `${'-'.repeat(50)}\n`;
    content += `${session.signature ? 'Signature captured' : 'No signature'}\n\n`;
    
    content += `${'='.repeat(50)}\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    
    return content;
  };

  // Export single session
  const handleExportSession = async () => {
    if (!selectedSession) return;

    try {
      setIsExporting(true);
      
      const content = formatSessionForExport(selectedSession);
      const fileName = `session_${selectedSession.id}_${Date.now()}.txt`;
      // Use cacheDirectory which is more reliably shareable
      const fileUri = FileSystem.cacheDirectory + fileName;

      console.log('Writing file to:', fileUri);
      
      // Write file - remove encoding parameter or use string
      await FileSystem.writeAsStringAsync(fileUri, content);

      console.log('File written successfully');

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      console.log('Sharing available:', isAvailable);
      
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Export Session',
        });
        Alert.alert('Success', 'Session exported successfully!');
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', `Failed to export session: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Export all sessions (bulk export)
  const handleExportAllSessions = async () => {
    try {
      setIsExporting(true);
      
      let content = `OBSERVEPLUS - ALL SESSIONS REPORT\n`;
      content += `${'='.repeat(50)}\n`;
      content += `Total Sessions: ${sessions.length}\n`;
      content += `Generated: ${new Date().toLocaleString()}\n`;
      content += `${'='.repeat(50)}\n\n\n`;

      sessions.forEach((session, index) => {
        content += formatSessionForExport(session);
        if (index < sessions.length - 1) {
          content += `\n\n${'='.repeat(50)}\n\n\n`;
        }
      });

      const fileName = `all_sessions_${Date.now()}.txt`;
      // Use cacheDirectory which is more reliably shareable
      const fileUri = FileSystem.cacheDirectory + fileName;

      console.log('Writing file to:', fileUri);

      // Write file - remove encoding parameter or use string
      await FileSystem.writeAsStringAsync(fileUri, content);

      console.log('File written successfully');

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      console.log('Sharing available:', isAvailable);
      
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Export All Sessions',
        });
        Alert.alert('Success', `Exported ${sessions.length} sessions successfully!`);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', `Failed to export sessions: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSessionPress = (session) => {
    setSelectedSession(session);
    if (onViewSession) {
      onViewSession(session);
    }
  };

  const handleBackFromDetail = () => {
    // setSelectedSession(null);
    // navigate back to calendar
    if (onBack) {
      onBack();
    } else{
      setSelectedSession(null);
    }
  };

  const handleClearSearch = () => {
    setSearchText('');
  };

  const handleDateFilterSelect = (filter) => {
    setDateFilter(filter);
    setShowDateFilter(false);
  };

  const dateFilterOptions = ['All Time', 'Last Week', 'Last Month'];

  const handleDeleteSession = async (sessionId, sessionClient, appointmentId) => {
    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete the session for ${sessionClient || 'this client'}? This will also remove the appointment from the calendar. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call the parent's delete handler which will delete both session and appointment
              if (onDeleteSession) {
                await onDeleteSession(sessionId, appointmentId);
              }
              
              // Update local state
              const updatedSessions = sessions.filter(s => s.id !== sessionId);
              setSessions(updatedSessions);
              
              // If we're viewing the deleted session, go back to list
              if (selectedSession && selectedSession.id === sessionId) {
                setSelectedSession(null);
              }
              
              console.log('✅ Session deleted successfully');
            } catch (error) {
              console.error('❌ Failed to delete session:', error);
              Alert.alert('Error', 'Failed to delete session. Please try again.');
              // Reload sessions on error
              loadSessions();
            }
          }
        }
      ]
    );
  };

  // Detail View
  if (selectedSession) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackFromDetail}>
            <MaterialIcons name="arrow-back" size={24} color={colors.accent3} />
          </TouchableOpacity>
          <View style={styles.titleBadge}>
            <Text style={styles.title}>Session Details</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => handleDeleteSession(
                selectedSession.id, 
                selectedSession.client,
                selectedSession.appointmentId
              )}
            >
              <MaterialIcons name="delete-outline" size={24} color="#DC2626" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.exportButton} 
              onPress={handleExportSession}
              disabled={isExporting}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <MaterialIcons name="file-download" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.detailContent}>
            {/* Basic Info */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>BASIC INFORMATION</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{selectedSession.date}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Client:</Text>
                <Text style={styles.detailValue}>{selectedSession.client}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Completed:</Text>
                <Text style={styles.detailValue}>{formatDate(selectedSession.timestamp)}</Text>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>NOTES</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>
                  {selectedSession.notes || 'No notes recorded'}
                </Text>
              </View>
            </View>

            {/* Tags */}
            {selectedSession.tags && selectedSession.tags.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>TAGS</Text>
                <View style={styles.tagsContainer}>
                  {selectedSession.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Categories */}
            {(selectedSession.peopleCategory || selectedSession.actionsCategory) && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>CATEGORIES</Text>
                {selectedSession.peopleCategory && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>People:</Text>
                    <Text style={styles.detailValue}>{selectedSession.peopleCategory}</Text>
                  </View>
                )}
                {selectedSession.actionsCategory && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Actions:</Text>
                    <Text style={styles.detailValue}>{selectedSession.actionsCategory}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Signature */}
            {selectedSession.signature && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>TECHNICIAN SIGNATURE</Text>
                <View style={styles.signatureContainer}>
                  <Image
                    source={{ uri: selectedSession.signature }}
                    style={styles.signatureImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // List View
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Navigation Bar - Go Back to Schedule */}
      <View style={styles.navigationBar}>
        <TouchableOpacity 
          style={styles.backToScheduleButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={16} color={colors.primary} />
          <Text style={styles.backToScheduleText}>Go Back to Schedule</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filter Section */}
      <View style={styles.searchSection}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={colors.accent3} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by client name..."
            placeholderTextColor={colors.accent3}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearSearch}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={20} color={colors.accent3} />
            </TouchableOpacity>
          )}
        </View>

        {/* Date Filter */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={styles.dateFilterButton}
            onPress={() => setShowDateFilter(!showDateFilter)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="calendar-today" size={18} color={colors.accent3} />
            <Text style={styles.dateFilterText}>{dateFilter}</Text>
            <MaterialIcons 
              name={showDateFilter ? "arrow-drop-up" : "arrow-drop-down"} 
              size={20} 
              color={colors.accent3} 
            />
          </TouchableOpacity>

          {showDateFilter && (
            <View style={styles.dateFilterDropdown}>
              {dateFilterOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dateFilterOption,
                    dateFilter === option && styles.dateFilterOptionActive
                  ]}
                  onPress={() => handleDateFilterSelect(option)}
                >
                  <Text style={[
                    styles.dateFilterOptionText,
                    dateFilter === option && styles.dateFilterOptionTextActive
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Result Count */}
        <View style={styles.resultCountContainer}>
          <Text style={styles.resultCountText}>
            Showing {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Loading...</Text>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons 
              name={searchText || dateFilter !== 'All Time' ? "search-off" : "history"} 
              size={64} 
              color={colors.accent3} 
            />
            <Text style={styles.emptyStateText}>
              {searchText || dateFilter !== 'All Time' 
                ? 'No sessions found' 
                : 'No completed sessions yet'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchText || dateFilter !== 'All Time'
                ? 'Try adjusting your search or filter'
                : 'Completed sessions will appear here'}
            </Text>
            {(searchText || dateFilter !== 'All Time') && (
              <TouchableOpacity
                style={styles.resetFiltersButton}
                onPress={() => {
                  setSearchText('');
                  setDateFilter('All Time');
                }}
              >
                <Text style={styles.resetFiltersText}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionItem}
                onPress={() => handleSessionPress(session)}
                activeOpacity={0.7}
              >
                <View style={styles.sessionItemHeader}>
                  <View style={styles.sessionItemLeft}>
                    <Text style={styles.sessionDate}>{session.date}</Text>
                    <Text style={styles.sessionClient}>{session.client}</Text>
                  </View>
                  <MaterialIcons 
                    name="chevron-right" 
                    size={24} 
                    color={colors.accent3} 
                  />
                </View>
                
                <View style={styles.sessionItemBody}>
                  <Text style={styles.sessionNotesPreview}>
                    {getNotesPreview(session.notes)}
                  </Text>
                </View>

                {session.tags && session.tags.length > 0 && (
                  <View style={styles.sessionTags}>
                    {session.tags.slice(0, 3).map((tag, index) => (
                      <View key={index} style={styles.sessionTag}>
                        <Text style={styles.sessionTagText}>{tag}</Text>
                      </View>
                    ))}
                    {session.tags.length > 3 && (
                      <Text style={styles.moreTagsText}>+{session.tags.length - 3} more</Text>
                    )}
                  </View>
                )}
                <TouchableOpacity
                  style={styles.deleteIconButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id, session.client, session.appointmentId);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons 
                    name="delete-outline" 
                    size={24} 
                    color="#DC2626" 
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBadge: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: fonts.bold,
    color: colors.primary,
  },
  exportButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 8,
  },
  exportAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  exportAllText: {
    fontSize: 14,
    fontWeight: fonts.semiBold,
    color: colors.primary,
  },
  // Search and Filter Styles
  searchSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent2,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.accent3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: fonts.medium,
    color: colors.accent3,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  filterContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent2,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.accent3,
    gap: 8,
  },
  dateFilterText: {
    flex: 1,
    fontSize: 15,
    fontWeight: fonts.medium,
    color: colors.accent3,
  },
  dateFilterDropdown: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.accent1,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dateFilterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent2,
  },
  dateFilterOptionActive: {
    backgroundColor: colors.accent2,
  },
  dateFilterOptionText: {
    fontSize: 15,
    fontWeight: fonts.medium,
    color: colors.accent3,
  },
  dateFilterOptionTextActive: {
    fontWeight: fonts.semiBold,
    color: colors.accent1,
  },
  resultCountContainer: {
    paddingVertical: 8,
  },
  resultCountText: {
    fontSize: 15,
    fontWeight: fonts.medium,
    color: colors.accent3,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  sessionItem: {
    backgroundColor: colors.accent2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.accent3,
    position: 'relative',
  },
  sessionItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionItemLeft: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    marginBottom: 4,
  },
  sessionClient: {
    fontSize: 18,
    fontWeight: fonts.bold,
    color: colors.accent3,
  },
  sessionItemBody: {
    marginBottom: 8,
  },
  sessionNotesPreview: {
    fontSize: 15,
    fontWeight: fonts.medium,
    color: colors.accent3,
    lineHeight: 20,
  },
  sessionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  sessionTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent1,
  },
  sessionTagText: {
    fontSize: 12,
    fontWeight: fonts.medium,
    color: colors.accent1,
  },
  moreTagsText: {
    fontSize: 11,
    fontWeight: fonts.medium,
    color: colors.accent3,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontWeight: fonts.medium,
    color: colors.accent3,
    marginTop: 8,
    textAlign: 'center',
  },
  resetFiltersButton: {
    marginTop: 20,
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  resetFiltersText: {
    fontSize: 14,
    fontWeight: fonts.semiBold,
    color: colors.primary,
  },
  // Detail view styles
  detailContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 32,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    width: 100,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: fonts.medium,
    color: colors.accent3,
    flex: 1,
  },
  notesBox: {
    backgroundColor: colors.accent2,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.accent3,
  },
  notesText: {
    fontSize: 16,
    fontWeight: fonts.medium,
    color: colors.accent3,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(239, 92, 0, 0.3)',
    borderWidth: 2,
    borderColor: '#EF5C00',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tagText: {
    fontSize: 16,
    fontWeight: fonts.medium,
    color: '#F4542C',
  },
  signatureContainer: {
    backgroundColor: colors.accent2,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  signatureImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  deleteIconButton: {
    padding: 8,
    position: 'absolute',
    bottom: 10, 
    right: 12, 
    zIndex: 10,
  },
  navigationBar: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent1,
  },
  backToScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backToScheduleText: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.primary,
  },
});
