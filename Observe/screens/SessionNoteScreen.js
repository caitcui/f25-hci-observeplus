import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Alert,
  Keyboard,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts } from '../styles/theme';
import { getSuggestedTags, initializeTagUsageFromSessions } from '../services/tagSuggestionService';
import { 
  STORAGE_KEYS, 
  saveDraftSession as saveDraftToStorage, 
  loadDraftSession,
  clearDraftSession,
} from '../services/storageService';

export default function SessionNoteScreen({ appointment, onSubmit, onBack, onDataChange }) {
  const [notes, setNotes] = useState(
    'The client was __________ because __________.\nThe client was __________ because __________.\nThe client was __________ because __________.'
  );

  const [selectedTags, setSelectedTags] = useState([]);
  const [peopleCategory, setPeopleCategory] = useState('');
  const [actionsCategory, setActionsCategory] = useState('');
  const [showPeopleDropdown, setShowPeopleDropdown] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [peopleSearchText, setPeopleSearchText] = useState('');
  const [actionsSearchText, setActionsSearchText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  const [addTagType, setAddTagType] = useState(null); // 'people' or 'actions'
  const [cursorPosition, setCursorPosition] = useState(null);
  const saveIntervalRef = useRef(null);

  const AUTOSAVE_INTERVAL = 3000; // 3 seconds

  // Default tags (fallback)
  const defaultCommonTags = [
    'The RBT',
    'Client',
    'pushed',
    'escaping',
    "followed BT's guidance",
    'had a tantrum episode',
  ];

  const [commonTags, setCommonTags] = useState(defaultCommonTags);

  const [peopleOptions, setPeopleOptions] = useState(['The RBT', 'Client', 'Supervisor', 'Parent', 'Peer']);
  const [actionsOptions, setActionsOptions] = useState(['escaping', 'pushed', 'followed guidance', 'had a tantrum episode', 'engaged', 'refused']);

  const filteredPeopleOptions = peopleOptions.filter(option =>
    option.toLowerCase().includes(peopleSearchText.toLowerCase())
  );
  const filteredActionsOptions = actionsOptions.filter(option =>
    option.toLowerCase().includes(actionsSearchText.toLowerCase())
  );

  // Load saved draft and suggested tags on mount and when appointment changes
  useEffect(() => {
    const loadSavedDraftAndTags = async () => {
      try {
        // Initialize tag usage from existing sessions (one-time, check if already initialized)
        const initKey = 'tag_usage_initialized';
        const isInitialized = await AsyncStorage.getItem(initKey);
        if (!isInitialized) {
          await initializeTagUsageFromSessions();
          await AsyncStorage.setItem(initKey, 'true');
        }
        
        // Load saved draft using storage service
        const { draft, timestamp } = await loadDraftSession(appointment?.id);
        if (draft) {
          setNotes(draft.notes || notes);
          setSelectedTags(draft.tags || []);
          setPeopleCategory(draft.peopleCategory || '');
          setActionsCategory(draft.actionsCategory || '');
          
          if (timestamp) {
            setLastSaved(new Date(timestamp));
          }
          
          console.log('✅ Loaded saved draft for session:', appointment?.id);
        } else {
          // Reset to defaults if no saved draft
          setNotes('The client was __________ because __________.\nThe client was __________ because __________.\nThe client was __________ because __________.');
          setSelectedTags([]);
          setPeopleCategory('');
          setActionsCategory('');
        }
        
        // Load suggested tags based on usage history
        // Get current options (they may have been updated)
        const currentPeopleOptions = ['The RBT', 'Client', 'Supervisor', 'Parent', 'Peer'];
        const currentActionsOptions = ['escaping', 'pushed', 'followed guidance', 'had a tantrum episode', 'engaged', 'refused'];
        
        const allAvailableTags = [
          ...defaultCommonTags,
          ...currentPeopleOptions,
          ...currentActionsOptions,
        ];
        const suggested = await getSuggestedTags(allAvailableTags, 6);
        
        // Merge suggested tags with default tags, prioritizing suggestions
        const mergedTags = [
          ...suggested.filter(tag => !defaultCommonTags.includes(tag)),
          ...defaultCommonTags.filter(tag => !suggested.includes(tag)),
        ].slice(0, 6);
        
        setCommonTags(mergedTags.length > 0 ? mergedTags : defaultCommonTags);
      } catch (error) {
        console.error('Failed to load saved draft:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadSavedDraftAndTags();
  }, [appointment?.id]); // Reload when appointment changes

  // Notify parent of data changes
  useEffect(() => {
    if (onDataChange && isInitialized) {
      onDataChange({
        notes,
        tags: selectedTags,
        peopleCategory,
        actionsCategory,
      });
    }
  }, [notes, selectedTags, peopleCategory, actionsCategory, isInitialized]);

  // Autosave functionality
  useEffect(() => {
    if (!isInitialized) return;

    // Clear any existing interval
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }

    // Save function using storage service
    const saveDraft = async () => {
      try {
        setIsSaving(true);
        const draftData = {
          notes,
          tags: selectedTags,
          peopleCategory,
          actionsCategory,
        };
        await saveDraftToStorage(appointment?.id, draftData);
        setLastSaved(new Date());
        
        setTimeout(() => {
          setIsSaving(false);
        }, 500);
      } catch (error) {
        console.error('Failed to save draft:', error);
        setIsSaving(false);
      }
    };

    // Set up interval for autosave
    saveIntervalRef.current = setInterval(() => {
      if (notes.trim() !== '') {
        saveDraft();
      }
    }, AUTOSAVE_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [notes, selectedTags, peopleCategory, actionsCategory, isInitialized]);
  
  const insertIntoNotes = (value) => {
    // if cursor present, insert after
    if (cursorPosition !== null && cursorPosition > 0) {
      const before = notes.substring(0, cursorPosition);
      const after = notes.substring(cursorPosition);
      setNotes(before + value + after);
      // Update cursor position to after inserted value
      setCursorPosition(cursorPosition + value.length);
      return;
    }

    // find next blank ow
    const blankIndex = notes.indexOf('__________');

    if (blankIndex !== -1) {
      const before = notes.substring(0, blankIndex);
      const after = notes.substring(blankIndex + 10);
      setNotes(before + value + after);
    } else {
      setNotes(notes + ' ' + value);
    }
  };

  const handleTagPress = (tag) => {
    insertIntoNotes(tag);

    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleDropdownSelect = (category, value, type) => {
    if (type === 'people') {
      setPeopleCategory(''); // reset to placeholder
      setShowPeopleDropdown(false);
      setPeopleSearchText('');
    } else {
      setActionsCategory(''); // reset to placeholder
      setShowActionsDropdown(false);
      setActionsSearchText('');
    }

    insertIntoNotes(value);
    if (!selectedTags.includes(value)) {
      setSelectedTags([...selectedTags, value]);
    }
  };

  const handleAddTagClick = (type) => {
    setAddTagType(type);
    setNewTagText('');
    setShowAddTagModal(true);
    if (type === 'people') {
      setShowPeopleDropdown(false);
    } else {
      setShowActionsDropdown(false);
    }
  };

  const handleSaveNewTag = async () => {
    if (!newTagText.trim()) {
      Alert.alert('Error', 'Please enter a tag name');
      return;
    }

    const trimmedTag = newTagText.trim();
    
    // Add to the appropriate options array
    if (addTagType === 'people') {
      if (!peopleOptions.includes(trimmedTag)) {
        setPeopleOptions([...peopleOptions, trimmedTag]);
      }
      // Clear search to show the new tag
      setPeopleSearchText('');
      setPeopleCategory(''); // reset to placeholder
    } else {
      if (!actionsOptions.includes(trimmedTag)) {
        setActionsOptions([...actionsOptions, trimmedTag]);
      }
      // Clear search to show the new tag
      setActionsSearchText('');
      setActionsCategory(''); // reset to placeholder
    }

    // Add to common tags if not already there
    if (!commonTags.includes(trimmedTag)) {
      // Add to the beginning of common tags (most recent)
      setCommonTags([trimmedTag, ...commonTags].slice(0, 6));
    }

    // Auto-select the new tag
    if (addTagType === 'people') {
      setPeopleCategory(trimmedTag);
      insertIntoNotes(trimmedTag);
      if (!selectedTags.includes(trimmedTag)) {
        setSelectedTags([...selectedTags, trimmedTag]);
      }
      // Reopen the dropdown to show the new tag
      setShowPeopleDropdown(true);
    } else {
      setActionsCategory(trimmedTag);
      insertIntoNotes(trimmedTag);
      if (!selectedTags.includes(trimmedTag)) {
        setSelectedTags([...selectedTags, trimmedTag]);
      }
      // Reopen the dropdown to show the new tag
      setShowActionsDropdown(true);
    }

    setShowAddTagModal(false);
    setNewTagText('');
    setAddTagType(null);
  };

  const handleSubmit = async () => {
    if (!notes.trim() || notes.includes('__________')) {
      console.log('Submitting with tags:', selectedTags);
      Alert.alert('Incomplete', 'Please fill in all blanks in your session notes');
      return;
    }

    // Ensure final save before submitting
    try {
      await saveDraftToStorage(appointment?.id, {
        notes,
        tags: selectedTags,
        peopleCategory,
        actionsCategory,
      });
      console.log('✅ Final save before submit');
    } catch (error) {
      console.error('Failed to save before submit:', error);
    }

    onSubmit({
      notes,
      tags: selectedTags,
      peopleCategory,
      actionsCategory,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >

      <ScrollView 
        style={styles.scrollView} 
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color={colors.accent3} />
          </TouchableOpacity>
          <View style={styles.titleBadge}>
            <Text style={styles.title}>Session Note</Text>
          </View>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          
          {/* Autosave status indicator */}
          <View style={styles.autosaveStatus}>
            <MaterialIcons
              name={isSaving ? 'save' : 'cloud-done'}
              size={16}
              color={isSaving ? colors.secondary : colors.accent3}
            />
            <Text style={styles.autosaveText}>
              {isSaving ? 'Saving...' : 'Autosave: ON'}
            </Text>
            {lastSaved && (
              <Text style={styles.autosaveTimestamp}>
                Last saved: {lastSaved.toLocaleTimeString()}
              </Text>
            )}
          </View>

          <Text style={styles.instructions}>
            Include any updates, programs or comments on specific goals addressed during supervision.
          </Text>

          {/* COMMON TAGS */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>COMMON TAGS / RECENTLY USED</Text>

            <View style={styles.tagsContainer}>
              {commonTags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  // styles={styles.tag}
                  style={[
                    styles.tag,
                    selectedTags.includes(tag) && styles.tagSelected,
                  ]}
                  onPress={() => handleTagPress(tag)}
                >
                  <Text
                    // style={styles.tagText} 
                    style={[
                      styles.tagText,
                      selectedTags.includes(tag) && styles.tagTextSelected,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* CATEGORY DROPDOWNS */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CATEGORIES</Text>

            <View style={styles.dropdownRow}>

              {/* PEOPLE */}
              <View style={styles.dropdownContainer}>
                <Text style={styles.categorySubtitle}>People</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    setShowPeopleDropdown(!showPeopleDropdown);
                    setShowActionsDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownText}>
                    {peopleCategory || 'People'}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color={colors.accent1} />
                </TouchableOpacity>
                <Text style={styles.dropdownSubtitle}>Who was involved</Text>

                {showPeopleDropdown && (
                  <View style={styles.dropdownMenu}>
                    <ScrollView 
                      style={styles.dropdownScrollView}
                      nestedScrollEnabled={true}
                      keyboardShouldPersistTaps="handled"
                    >
                      <View style={styles.searchContainer}>
                        <MaterialIcons name="search" size={20} color={colors.accent3} />
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Type to search..."
                          placeholderTextColor={colors.accent3}
                          value={peopleSearchText}
                          onChangeText={setPeopleSearchText}
                        />
                      </View>

                      {filteredPeopleOptions.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.dropdownItem}
                          onPress={() => handleDropdownSelect('people', option, 'people')}
                        >
                          <Text style={styles.dropdownItemText}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                      {filteredPeopleOptions.length === 0 && (
                        <View style={styles.dropdownItem}>
                          <Text style={styles.dropdownItemText}>No results found</Text>
                        </View>
                      )}
                    </ScrollView>
                    <TouchableOpacity
                      style={styles.addTagButton}
                      onPress={() => handleAddTagClick('people')}
                    >
                      <MaterialIcons name="add" size={18} color={colors.secondary} />
                      <Text style={styles.addTagButtonText}>Add Tag</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.dropdownContainer}>
                <Text style={styles.categorySubtitle}>Actions</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    setShowActionsDropdown(!showActionsDropdown);
                    setShowPeopleDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownText}>
                    {actionsCategory || 'Actions'}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color={colors.accent1} />
                </TouchableOpacity>
                <Text style={styles.dropdownSubtitle}>What happened</Text>

                {showActionsDropdown && (
                  <View style={styles.dropdownMenu}>
                    <ScrollView 
                      style={styles.dropdownScrollView}
                      nestedScrollEnabled={true}
                      keyboardShouldPersistTaps="handled"
                    >
                      <View style={styles.searchContainer}>
                        <MaterialIcons name="search" size={20} color={colors.accent3} />
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Type to search..."
                          placeholderTextColor={colors.accent3}
                          value={actionsSearchText}
                          onChangeText={setActionsSearchText}
                        />
                      </View>

                      {filteredActionsOptions.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.dropdownItem}
                          onPress={() => handleDropdownSelect('actions', option, 'actions')}
                        >
                          <Text style={styles.dropdownItemText}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                      {filteredActionsOptions.length === 0 && (
                        <View style={styles.dropdownItem}>
                          <Text style={styles.dropdownItemText}>No results found</Text>
                        </View>
                      )}
                    </ScrollView>
                    <TouchableOpacity
                      style={styles.addTagButton}
                      onPress={() => handleAddTagClick('actions')}
                    >
                      <MaterialIcons name="add" size={18} color={colors.secondary} />
                      <Text style={styles.addTagButtonText}>Add Tag</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

            </View>
          </View>

          <TouchableOpacity
            style={styles.addSentenceButton}
            onPress={() => {
              setNotes(prev => prev + 'The client was __________ because __________.');
            }}
          >
            <MaterialIcons name="add" size={20} color={colors.primary} />
            <Text style={styles.addSentenceText}>Add Sentence Template</Text>
          </TouchableOpacity>

          {/* NOTES */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTES</Text>
            <Text style={styles.tapToType}>Tap to enable typing.</Text>

            <View style={styles.notesBox}>
              <TextInput
                style={styles.notesInput}
                multiline
                value={notes}
                onChangeText={setNotes}
                onSelectionChange={(e) => setCursorPosition(e.nativeEvent.selection.start)}
                textAlignVertical="top"

                // NEW: keyboard "Done" behavior
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>
          </View>

          {/* SUBMIT */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>SUBMIT</Text>
          </TouchableOpacity>

        </View>
      </ScrollView></KeyboardAvoidingView>

      {/* Add Tag Modal */}
      <Modal
        visible={showAddTagModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowAddTagModal(false);
          setNewTagText('');
          setAddTagType(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add New {addTagType === 'people' ? 'People' : 'Actions'} Tag
              </Text>
              <TouchableOpacity onPress={() => {
                setShowAddTagModal(false);
                setNewTagText('');
                setAddTagType(null);
              }}>
                <MaterialIcons name="close" size={24} color={colors.accent3} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Tag Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter tag name..."
                placeholderTextColor={colors.accent3}
                value={newTagText}
                onChangeText={setNewTagText}
                autoFocus
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowAddTagModal(false);
                    setNewTagText('');
                    setAddTagType(null);
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleSaveNewTag}
                >
                  <Text style={styles.modalSaveButtonText}>Add Tag</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  titleBadge: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  title: { fontSize: 18, fontWeight: fonts.bold, color: colors.primary },

  content: { padding: 20 },
  instructions: {
    fontSize: 16,
    fontWeight: fonts.medium,
    color: colors.accent3,
    lineHeight: 24,
    marginBottom: 24,
  },

  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: {
    backgroundColor: 'rgba(239, 92, 0, 0.3)',
    borderWidth: 2,
    borderColor: '#EF5C00',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },

  tagText: { fontSize: 16, fontWeight: fonts.medium, color: '#F4542C' },

  dropdownRow: { flexDirection: 'row', gap: 12 },
  dropdownContainer: { flex: 1, position: 'relative' },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.accent3,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dropdownText: { fontSize: 16, fontWeight: fonts.medium, color: colors.accent3 },
  dropdownMenu: {
    position: 'absolute',
    top: 80, // Account for larger dropdown + subtitle
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.accent1,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 250,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent2,
    backgroundColor: colors.accent2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: fonts.medium,
    color: colors.accent3,
    marginLeft: 8,
    paddingVertical: 4,
  },

  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent2,
  },
  dropdownItemText: { fontSize: 16, fontWeight: fonts.medium, color: colors.accent3 },

  tapToType: { fontSize: 13, fontWeight: fonts.medium, color: colors.accent3, marginBottom: 12 },

  notesBox: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.accent3,
    borderRadius: 8,
    padding: 16,
    minHeight: 250,
  },
  notesInput: {
    fontSize: 16,
    fontWeight: fonts.medium,
    color: colors.accent3,
    lineHeight: 24,
    minHeight: 220,
  },

  submitButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: fonts.bold,
    color: colors.primary,
    letterSpacing: 0.5,
  },

  // add-sentence button
  addSentenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent1,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addSentenceText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.primary,
  },
  autosaveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.accent2,
    borderRadius: 6,
  },
  autosaveText: {
    fontSize: 13,
    fontWeight: fonts.medium,
    color: colors.accent3,
  },
  autosaveTimestamp: {
    fontSize: 12,
    color: colors.accent3,
    marginLeft: 'auto',
  },
  categorySubtitle: {
    fontSize: 13,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownSubtitle: {
    fontSize: 12,
    fontWeight: fonts.medium,
    color: colors.accent3,
    marginTop: 4,
    fontStyle: 'italic',
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.accent2,
    backgroundColor: colors.accent2,
    gap: 6,
  },
  addTagButtonText: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.secondary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: '85%',
    maxWidth: 400,
    padding: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: fonts.bold,
    color: colors.accent3,
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.accent3,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: colors.accent3,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.accent3,
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
  },
  modalSaveButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: colors.secondary,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: fonts.semiBold,
    color: colors.primary,
  },
});
