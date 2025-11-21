<<<<<<< HEAD
import React, { useState, useEffect, useRef, useMemo } from 'react';
=======
import React, { useState } from 'react';
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
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
<<<<<<< HEAD
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
=======
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
import { colors, fonts } from '../styles/theme';

export default function SessionNoteScreen({ appointment, onSubmit, onBack }) {
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
<<<<<<< HEAD
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [clientTags, setClientTags] = useState([]);
  const [showAddTagInput, setShowAddTagInput] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  
  // Add these new state variables after line 35
  const [customPeopleTags, setCustomPeopleTags] = useState([]);
  const [customActionTags, setCustomActionTags] = useState([]);
  const [tagUsageCount, setTagUsageCount] = useState({});
  
  const saveIntervalRef = useRef(null);
  const STORAGE_KEY = `draft_session_${appointment?.id || 'default'}`;
  const CLIENT_TAGS_KEY = `client_tags_${appointment?.clients || 'default'}`;
  const AUTOSAVE_INTERVAL = 3000; // 3 seconds

  // Function to get most recently used tags
  const getRecentlyUsedTags = () => {
    if (Object.keys(tagUsageCount).length === 0) {
      // No usage data yet, return defaults
      return [
        'The RBT',
        'Client',
        'pushed',
        'escaping',
        "followed BT's guidance",
        'had a tantrum episode',
      ];
    }

    // Sort by usage count, get top 6
    const sorted = Object.entries(tagUsageCount)
      .sort((a, b) => b[1] - a[1]) // Sort by count (highest first)
      .slice(0, 6) // Take top 6
      .map(([tag]) => tag); // Extract just the tag names

    // If we have at least 3 tags with usage, show them
    if (sorted.length >= 3) {
      return sorted;
    }

    // Otherwise, combine used tags with defaults
    const defaultTags = [
      'The RBT',
      'Client',
      'pushed',
      'escaping',
      "followed BT's guidance",
      'had a tantrum episode',
    ];

    // Merge, removing duplicates
    const combined = [...sorted, ...defaultTags];
    const unique = [...new Set(combined)];
    return unique.slice(0, 6);
  };

  // Use useMemo to recalculate when tagUsageCount changes
  const commonTags = useMemo(() => getRecentlyUsedTags(), [tagUsageCount]);

  // Merge with client-specific tags
  const allAvailableTags = [...new Set([...commonTags, ...clientTags])];

  // Load saved draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const savedDraft = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.notes) setNotes(parsed.notes);
          if (parsed.selectedTags) setSelectedTags(parsed.selectedTags);
          if (parsed.peopleCategory) setPeopleCategory(parsed.peopleCategory);
          if (parsed.actionsCategory) setActionsCategory(parsed.actionsCategory);
        }
        // Load timestamp
        const savedTimestamp = await AsyncStorage.getItem(STORAGE_KEY + '_timestamp');
        if (savedTimestamp) {
          setLastSaved(new Date(parseInt(savedTimestamp)));
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadDraft();
  }, [appointment?.id]);

  // Load client-specific tags on mount
  useEffect(() => {
    const loadClientTags = async () => {
      try {
        const savedTags = await AsyncStorage.getItem(CLIENT_TAGS_KEY);
        if (savedTags) {
          const parsed = JSON.parse(savedTags);
          setClientTags(parsed);
        }
      } catch (error) {
        console.error('Failed to load client tags:', error);
      }
    };

    if (appointment?.clients) {
      loadClientTags();
    }
  }, [appointment?.clients]);

  // Auto-save functionality (3-second interval pattern from AutoSave.js)
  useEffect(() => {
    if (!isInitialized) return;

    // Clear any existing interval
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }

    // Save function
    const saveData = async () => {
      // Only save if there's content
      if (notes.trim() === '' && selectedTags.length === 0 && !peopleCategory && !actionsCategory) {
        return;
      }

      try {
        console.log('Saving...', { notes: notes.substring(0, 20) + '...', selectedTags, peopleCategory, actionsCategory });
        setIsSaving(true);
        
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
          notes,
          selectedTags,
          peopleCategory,
          actionsCategory,
        }));
        
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

    // Set up interval for autosave (every 3 seconds)
    saveIntervalRef.current = setInterval(() => {
      saveData();
    }, AUTOSAVE_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [notes, selectedTags, peopleCategory, actionsCategory, isInitialized]);

  // Load custom tags and usage tracking
  useEffect(() => {
    loadCustomTags();
  }, []);

  const loadCustomTags = async () => {
    try {
      const savedPeople = await AsyncStorage.getItem('custom_people_tags');
      const savedActions = await AsyncStorage.getItem('custom_action_tags');
      const savedUsage = await AsyncStorage.getItem('tag_usage_count');
      
      if (savedPeople) {
        const parsed = JSON.parse(savedPeople);
        setCustomPeopleTags(parsed);
        console.log('Loaded custom people tags:', parsed.length);
      }
      if (savedActions) {
        const parsed = JSON.parse(savedActions);
        setCustomActionTags(parsed);
        console.log('Loaded custom action tags:', parsed.length);
      }
      if (savedUsage) {
        const parsed = JSON.parse(savedUsage);
        setTagUsageCount(parsed);
        console.log('Loaded tag usage counts:', Object.keys(parsed).length);
      }
    } catch (error) {
      console.error('Failed to load custom tags:', error);
    }
  };

  const trackTagUsage = async (tag) => {
    try {
      const updated = { ...tagUsageCount };
      updated[tag] = (updated[tag] || 0) + 1;
      setTagUsageCount(updated);
      await AsyncStorage.setItem('tag_usage_count', JSON.stringify(updated));
      console.log(`Tag "${tag}" used ${updated[tag]} times`);
    } catch (error) {
      console.error('Failed to track tag usage:', error);
    }
  };

  // Handle back button with immediate save
  const handleBack = async () => {
    // Save immediately before navigating
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        notes,
        selectedTags,
        peopleCategory,
        actionsCategory,
      }));
      const timestamp = Date.now();
      await AsyncStorage.setItem(STORAGE_KEY + '_timestamp', timestamp.toString());
    } catch (error) {
      console.error('Failed to save before navigation:', error);
    }
    onBack();
  };

  // Default options (separated from custom tags)
  const defaultPeopleOptions = ['The RBT', 'Client', 'Supervisor', 'Parent', 'Peer'];
  const defaultActionsOptions = ['escaping', 'pushed', 'followed guidance', 'had tantrum', 'engaged', 'refused'];

  // Combine default and custom tags
  const peopleOptions = [
    ...defaultPeopleOptions,
    ...customPeopleTags,
  ];

  const actionsOptions = [
    ...defaultActionsOptions,
    ...customActionTags,
  ];

  // Filter options and always add "+ Add Custom Tag" at the end
  const filteredPeopleOptions = peopleOptions
    .filter(option => option.toLowerCase().includes(peopleSearchText.toLowerCase()))
    .concat(['+ Add Custom Tag']);

  const filteredActionsOptions = actionsOptions
    .filter(option => option.toLowerCase().includes(actionsSearchText.toLowerCase()))
    .concat(['+ Add Custom Tag']);
=======

  const commonTags = [
    'The RBT',
    'Client',
    'pushed',
    'escaping',
    "followed BT's guidance",
    'had a tantrum episode',
  ];

  const peopleOptions = ['The RBT', 'Client', 'Supervisor', 'Parent', 'Peer'];
  const actionsOptions = ['escaping', 'pushed', 'followed guidance', 'had tantrum', 'engaged', 'refused'];

  const filteredPeopleOptions = peopleOptions.filter(option =>
    option.toLowerCase().includes(peopleSearchText.toLowerCase())
  );
  const filteredActionsOptions = actionsOptions.filter(option =>
    option.toLowerCase().includes(actionsSearchText.toLowerCase())
  );
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3

  const insertIntoNotes = (value) => {
    const blankIndex = notes.indexOf('__________');

    if (blankIndex !== -1) {
      const before = notes.substring(0, blankIndex);
      const after = notes.substring(blankIndex + 10);
      setNotes(before + value + after);
    } else {
      setNotes(notes + ' ' + value);
    }
  };

<<<<<<< HEAD
  const handleAddCustomTag = async (text, type) => {
    if (!text || text.trim() === '') {
      Alert.alert('Error', 'Tag name cannot be empty');
      return;
    }

    const newTag = text.trim();
    
    // Check for duplicates
    if (type === 'people' && [...defaultPeopleOptions, ...customPeopleTags].includes(newTag)) {
      Alert.alert('Error', 'This tag already exists');
      return;
    }
    if (type === 'actions' && [...defaultActionsOptions, ...customActionTags].includes(newTag)) {
      Alert.alert('Error', 'This tag already exists');
      return;
    }

    try {
      if (type === 'people') {
        const updated = [...customPeopleTags, newTag];
        setCustomPeopleTags(updated);
        await AsyncStorage.setItem('custom_people_tags', JSON.stringify(updated));
        setPeopleCategory(newTag);
        setShowPeopleDropdown(false);
        setPeopleSearchText('');
        console.log('Added custom people tag:', newTag);
      } else {
        const updated = [...customActionTags, newTag];
        setCustomActionTags(updated);
        await AsyncStorage.setItem('custom_action_tags', JSON.stringify(updated));
        setActionsCategory(newTag);
        setShowActionsDropdown(false);
        setActionsSearchText('');
        console.log('Added custom action tag:', newTag);
      }
      
      insertIntoNotes(newTag);
      Alert.alert('Success', 'Custom tag added!');
    } catch (error) {
      console.error('Failed to save custom tag:', error);
      Alert.alert('Error', 'Failed to save custom tag');
    }
  };

  const handleTagPress = (tag) => {
    insertIntoNotes(tag);
    trackTagUsage(tag);
=======
  const handleTagPress = (tag) => {
    insertIntoNotes(tag);
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3

    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleDropdownSelect = (category, value, type) => {
<<<<<<< HEAD
    // Handle add custom tag
    if (value === '+ Add Custom Tag') {
      Alert.prompt(
        `Add Custom ${type === 'people' ? 'Person' : 'Action'}`,
        `Enter a new ${type === 'people' ? 'person' : 'action'} tag:`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add',
            onPress: (text) => handleAddCustomTag(text, type)
          }
        ],
        'plain-text'
      );
      return;
    }

    // Existing selection logic
=======
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
    if (type === 'people') {
      setPeopleCategory(value);
      setShowPeopleDropdown(false);
      setPeopleSearchText('');
    } else {
      setActionsCategory(value);
      setShowActionsDropdown(false);
      setActionsSearchText('');
    }

    insertIntoNotes(value);
<<<<<<< HEAD
    trackTagUsage(value);
=======
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
  };

  const handleSubmit = () => {
    if (!notes.trim() || notes.includes('__________')) {
      Alert.alert('Incomplete', 'Please fill in all blanks in your session notes');
      return;
    }

<<<<<<< HEAD
    // Save selected tags for this client
    const saveClientTags = async () => {
      try {
        const existingTags = await AsyncStorage.getItem(CLIENT_TAGS_KEY);
        const existing = existingTags ? JSON.parse(existingTags) : [];
        const updated = [...new Set([...existing, ...selectedTags])];
        await AsyncStorage.setItem(CLIENT_TAGS_KEY, JSON.stringify(updated));
        setClientTags(updated);
      } catch (error) {
        console.error('Failed to save client tags:', error);
      }
    };

    saveClientTags();

    // Clear saved draft before submitting
    AsyncStorage.removeItem(STORAGE_KEY).catch(err => 
      console.error('Failed to clear draft:', err)
    );
    AsyncStorage.removeItem(STORAGE_KEY + '_timestamp').catch(err => 
      console.error('Failed to clear timestamp:', err)
    );

=======
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
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

<<<<<<< HEAD
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView} 
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <MaterialIcons name="arrow-back" size={24} color={colors.accent3} />
            </TouchableOpacity>
            <View style={styles.titleBadge}>
              <Text style={styles.title}>Session Note</Text>
            </View>
            <View style={styles.backButton} />
          </View>

          {/* Auto-save status bar (Figma-style) */}
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
            {lastSaved && !isSaving && (
              <Text style={styles.timestampText}>
                Last saved: {lastSaved.toLocaleTimeString()}
              </Text>
            )}
          </View>

          <View style={styles.content}>
            
            <Text style={styles.instructions}>
              Include any updates, programs or comments on specific goals addressed during supervision.
            </Text>

            {/* COMMON TAGS */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>RECENTLY USED</Text>

              <View style={styles.tagsContainer}>
                {allAvailableTags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.tag,
                      selectedTags.includes(tag) && styles.tagSelected,
                    ]}
                    onPress={() => handleTagPress(tag)}
                  >
                    <Text
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
                  <View style={styles.categoryLabelRow}>
                    <Text style={styles.dropdownCategoryLabel}>PEOPLE</Text>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          'People Category',
                          'Select who was involved in the session (e.g., The RBT, Client, Supervisor, Parent, Peer). This helps identify the participants in the session notes.',
                          [{ text: 'OK' }]
                        );
                      }}
                      style={styles.helpIconButton}
                    >
                      <MaterialIcons name="help-outline" size={20} color={colors.secondary} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      setShowPeopleDropdown(!showPeopleDropdown);
                      setShowActionsDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>
                      {peopleCategory || 'Select Person'}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color={colors.accent1} />
                  </TouchableOpacity>

                  {showPeopleDropdown && (
                    <View style={styles.dropdownMenu}>
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

                      <ScrollView 
                        style={styles.dropdownScroll}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                      >
                        {filteredPeopleOptions.map((option, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.dropdownItem,
                              option === '+ Add Custom Tag' && styles.dropdownItemAddTag
                            ]}
                            onPress={() => handleDropdownSelect('people', option, 'people')}
                          >
                            <Text style={[
                              styles.dropdownItemText,
                              option === '+ Add Custom Tag' && styles.dropdownItemAddTagText
                            ]}>
                              {option}
                            </Text>
                            {option === '+ Add Custom Tag' && (
                              <MaterialIcons name="add-circle-outline" size={16} color={colors.secondary} />
                            )}
                          </TouchableOpacity>
                        ))}
                        {filteredPeopleOptions.length === 0 && (
                          <View style={styles.dropdownItem}>
                            <Text style={styles.dropdownItemText}>No results found</Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* ACTIONS */}
                <View style={styles.dropdownContainer}>
                  <View style={styles.categoryLabelRow}>
                    <Text style={styles.dropdownCategoryLabel}>ACTIONS</Text>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          'Actions Category',
                          'Select what action or behavior occurred during the session (e.g., escaping, pushed, followed guidance, had tantrum). This helps categorize the behaviors observed.',
                          [{ text: 'OK' }]
                        );
                      }}
                      style={styles.helpIconButton}
                    >
                      <MaterialIcons name="help-outline" size={20} color={colors.secondary} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      setShowActionsDropdown(!showActionsDropdown);
                      setShowPeopleDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>
                      {actionsCategory || 'Select Action'}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color={colors.accent1} />
                  </TouchableOpacity>

                  {showActionsDropdown && (
                    <View style={styles.dropdownMenu}>
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

                      <ScrollView 
                        style={styles.dropdownScroll}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                      >
                        {filteredActionsOptions.map((option, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.dropdownItem,
                              option === '+ Add Custom Tag' && styles.dropdownItemAddTag
                            ]}
                            onPress={() => handleDropdownSelect('actions', option, 'actions')}
                          >
                            <Text style={[
                              styles.dropdownItemText,
                              option === '+ Add Custom Tag' && styles.dropdownItemAddTagText
                            ]}>
                              {option}
                            </Text>
                            {option === '+ Add Custom Tag' && (
                              <MaterialIcons name="add-circle-outline" size={16} color={colors.secondary} />
                            )}
                          </TouchableOpacity>
                        ))}
                        {filteredActionsOptions.length === 0 && (
                          <View style={styles.dropdownItem}>
                            <Text style={styles.dropdownItemText}>No results found</Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

              </View>
            </View>

            <TouchableOpacity
              style={styles.addSentenceButton}
              onPress={() => {
                setNotes(prev => prev + '\nThe client was __________ because __________.');
              }}
            >
              <MaterialIcons name="add" size={20} color={colors.primary} />
              <Text style={styles.addSentenceText}>Add Sentence Template</Text>
            </TouchableOpacity>

            {/* NOTES */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>NOTES</Text>
              
              {/* Auto-save indicator below NOTES label */}
              <View style={styles.autosaveIndicator}>
                <MaterialIcons
                  name={isSaving ? 'save' : 'cloud-done'}
                  size={16}
                  color={isSaving ? '#F4542C' : '#71717A'}
                />
                <Text style={styles.autosaveText}>
                  {isSaving ? 'Saving...' : 'Autosave: ON'}
                </Text>
                {lastSaved && !isSaving && (
                  <Text style={styles.lastSavedText}>
                    • Last saved: {lastSaved.toLocaleTimeString()}
                  </Text>
                )}
              </View>
              
              <Text style={styles.tapToType}>Tap to enable typing.</Text>

              <View style={styles.notesBox}>
                <TextInput
                  style={styles.notesInput}
                  multiline
                  value={notes}
                  onChangeText={setNotes}
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
        </ScrollView>
      </KeyboardAvoidingView>
=======
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        
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
                  style={[
                    styles.tag,
                    selectedTags.includes(tag) && styles.tagSelected,
                  ]}
                  onPress={() => handleTagPress(tag)}
                >
                  <Text
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

                {showPeopleDropdown && (
                  <View style={styles.dropdownMenu}>
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
                  </View>
                )}
              </View>

              <View style={styles.dropdownContainer}>
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

                {showActionsDropdown && (
                  <View style={styles.dropdownMenu}>
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
                  </View>
                )}
              </View>

            </View>
          </View>

          <TouchableOpacity
            style={styles.addSentenceButton}
            onPress={() => {
              setNotes(prev => prev + '\nThe client was __________ because __________.');
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
      </ScrollView>
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
<<<<<<< HEAD
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingBottom: 100, // Extra padding at bottom for keyboard
  },
=======
  scrollView: { flex: 1 },

>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
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
<<<<<<< HEAD
  
  // Figma-style status bar
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
    fontWeight: fonts.medium,
    color: '#71717A',
    marginLeft: 8,
  },
  timestampText: {
    fontSize: 12,
    color: '#71717A',
  },
=======
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3

  content: { padding: 20 },
  instructions: {
    fontSize: 14,
    fontWeight: fonts.medium,
    color: colors.accent3,
    lineHeight: 20,
    marginBottom: 24,
  },

  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    letterSpacing: 0.5,
    marginBottom: 12,
  },

<<<<<<< HEAD
  // Auto-save indicator below NOTES label
  autosaveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 6,
  },
  autosaveText: {
    fontSize: 12,
    fontWeight: fonts.medium,
    color: '#71717A',
    marginLeft: 6,
  },
  lastSavedText: {
    fontSize: 11,
    color: '#71717A',
    marginLeft: 8,
  },

=======
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: 'rgba(239, 92, 0, 0.3)',
    borderWidth: 2,
    borderColor: '#EF5C00',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tagSelected: { backgroundColor: 'rgba(2, 62, 138, 0.3)', borderColor: '#023E8A' },
  tagText: { fontSize: 13, fontWeight: fonts.medium, color: '#F4542C' },
  tagTextSelected: { color: '#023E8A' },

  dropdownRow: { flexDirection: 'row', gap: 12 },
  dropdownContainer: { flex: 1, position: 'relative' },
<<<<<<< HEAD
  categoryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  helpIconButton: {
    padding: 4,
    marginLeft: 4,
  },
  dropdownCategoryLabel: {
    fontSize: 13,
    fontWeight: fonts.semiBold,
    color: colors.accent3,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
=======

>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.accent3,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownText: { fontSize: 14, fontWeight: fonts.medium, color: colors.accent3 },
  dropdownMenu: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.accent1,
    borderRadius: 6,
    zIndex: 1000,
<<<<<<< HEAD
    maxHeight: 250,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
=======
    elevation: 5,
    maxHeight: 200,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent2,
    backgroundColor: colors.accent2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: fonts.medium,
    color: colors.accent3,
    marginLeft: 8,
    paddingVertical: 4,
  },

>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent2,
  },
  dropdownItemText: { fontSize: 14, fontWeight: fonts.medium, color: colors.accent3 },
<<<<<<< HEAD
  dropdownItemAddTag: {
    backgroundColor: colors.accent2,
    borderTopWidth: 2,
    borderTopColor: colors.accent1,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemAddTagText: {
    color: colors.secondary,
    fontWeight: fonts.bold,
    fontSize: 14,
  },
=======
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3

  tapToType: { fontSize: 12, fontWeight: fonts.medium, color: colors.accent3, marginBottom: 12 },

  notesBox: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.accent3,
    borderRadius: 8,
    padding: 16,
    minHeight: 250,
  },
  notesInput: {
    fontSize: 14,
    fontWeight: fonts.medium,
    color: colors.accent3,
    lineHeight: 22,
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

<<<<<<< HEAD
=======
  // NEW: add-sentence button
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
  addSentenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent1,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  addSentenceText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: fonts.semiBold,
    color: colors.primary,
  },
<<<<<<< HEAD
  
  // Add new tag styles
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent2,
    borderWidth: 2,
    borderColor: colors.accent1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderStyle: 'dashed',
  },
  addTagText: {
    fontSize: 13,
    fontWeight: fonts.medium,
    color: colors.accent1,
    marginLeft: 4,
  },
  addTagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.accent1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addTagInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: fonts.medium,
    color: colors.accent3,
    minWidth: 100,
  },
=======
>>>>>>> 7dff76bb20e18925ef9ac6916f76fe04b0a2e3d3
});
