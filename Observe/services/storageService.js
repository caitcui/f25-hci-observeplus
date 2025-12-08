import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage Service
 * Provides robust, production-ready storage operations with:
 * - Error handling and retry logic
 * - Data validation
 * - Automatic cleanup of old data
 * - Storage health checks
 * - Migration support
 */

const STORAGE_VERSION_KEY = 'observeplus_storage_version';
const CURRENT_STORAGE_VERSION = 1;

// Storage keys
export const STORAGE_KEYS = {
  APPOINTMENTS: 'appointments',
  COMPLETED_SESSIONS: 'observeplus_completed_sessions',
  COMPLETED_APPOINTMENTS: 'completed_appointments',
  TAG_USAGE: 'observeplus_tag_usage',
  DRAFT_SESSION: (appointmentId) => `draft_session_${appointmentId || 'default'}`,
  DRAFT_TIMESTAMP: (appointmentId) => `draft_session_${appointmentId || 'default'}_timestamp`,
  DRAFT_SIGNATURE: (appointmentId) => `draft_session_${appointmentId || 'default'}_signature`,
  // NEW KEYS FOR PERSISTENT TAGS
  CUSTOM_PEOPLE_TAGS: 'custom_people_tags',
  CUSTOM_ACTIONS_TAGS: 'custom_actions_tags',
};

// Maximum retry attempts for storage operations
const MAX_RETRIES = 3;
const RETRY_DELAY = 100; // ms

// ... (rest of the file remains the same - `withRetry`, `safeJsonParse`, `safeJsonStringify`, `getItem`, `setItem`, `removeItem`, `getMultipleItems`, `setMultipleItems`, `initializeStorage`, `migrateStorage`, `cleanupOldDrafts`, `getStorageInfo`, `clearAllData`, `validateAndRepairData`, `saveDraftSession`, `loadDraftSession`, `clearDraftSession`)
// ... (Your original implementation of these functions will be used)

/**
 * Retry wrapper for storage operations
 */
const withRetry = async (operation, retries = MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
    }
  }
};

/**
 * Safe JSON parse with validation
 */
const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    if (!jsonString || jsonString === 'null') return defaultValue;
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (error) {
    // console.error('Failed to parse JSON:', error);
    // return defaultValue;
    return jsonString;
  }
};

/**
 * Safe JSON stringify
 */
const safeJsonStringify = (data) => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Failed to stringify JSON:', error);
    throw error;
  }
};

/**
 * Get item from storage with retry and validation
 */
export const getItem = async (key, defaultValue = null) => {
  try {
    const value = await withRetry(async () => {
      return await AsyncStorage.getItem(key);
    });
    
    if (value === null) return defaultValue;
    
    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error(`Failed to get item ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Set item in storage with retry
 */
export const setItem = async (key, value) => {
  try {
    const stringValue = typeof value === 'string' ? value : safeJsonStringify(value);
    
    await withRetry(async () => {
      await AsyncStorage.setItem(key, stringValue);
    });
    
    return true;
  } catch (error) {
    console.error(`Failed to set item ${key}:`, error);
    throw error;
  }
};

/**
 * Remove item from storage with retry
 */
export const removeItem = async (key) => {
  try {
    await withRetry(async () => {
      await AsyncStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error(`Failed to remove item ${key}:`, error);
    return false;
  }
};

/**
 * Get multiple items at once
 */
export const getMultipleItems = async (keys) => {
  try {
    const values = await withRetry(async () => {
      return await AsyncStorage.multiGet(keys);
    });
    
    const result = {};
    values.forEach(([key, value]) => {
      result[key] = value !== null ? safeJsonParse(value) : null;
    });
    
    return result;
  } catch (error) {
    console.error('Failed to get multiple items:', error);
    return {};
  }
};

/**
 * Set multiple items at once
 */
export const setMultipleItems = async (items) => {
  try {
    const entries = Object.entries(items).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : safeJsonStringify(value)
    ]);
    
    await withRetry(async () => {
      await AsyncStorage.multiSet(entries);
    });
    
    return true;
  } catch (error) {
    console.error('Failed to set multiple items:', error);
    throw error;
  }
};

/**
 * Initialize storage and check version
 */
export const initializeStorage = async () => {
  try {
    const version = await getItem(STORAGE_VERSION_KEY, 0);
    
    if (version < CURRENT_STORAGE_VERSION) {
      console.log(`Migrating storage from version ${version} to ${CURRENT_STORAGE_VERSION}`);
      await migrateStorage(version, CURRENT_STORAGE_VERSION);
      await setItem(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION);
    }
    
    // Cleanup old draft data on initialization
    await cleanupOldDrafts();
    
    return true;
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    return false;
  }
};

/**
 * Migrate storage data between versions
 */
const migrateStorage = async (fromVersion, toVersion) => {
  // Add migration logic here as storage schema evolves
  console.log(`Storage migration: ${fromVersion} -> ${toVersion}`);
  
  // Example: If migrating from version 0 to 1, you might need to:
  // - Rename keys
  // - Transform data structure
  // - Clean up old data
};

/**
 * Cleanup old draft sessions (older than 7 days)
 */
export const cleanupOldDrafts = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const draftKeys = allKeys.filter(key => key.startsWith('draft_session_'));
    
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    for (const key of draftKeys) {
      if (key.endsWith('_timestamp')) {
        const timestamp = await getItem(key);
        if (timestamp && (now - parseInt(timestamp)) > maxAge) {
          // Extract appointment ID from key
          const baseKey = key.replace('_timestamp', '');
          await removeItem(baseKey);
          await removeItem(key);
          await removeItem(baseKey + '_signature');
          console.log(`Cleaned up old draft: ${baseKey}`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to cleanup old drafts:', error);
  }
};

/**
 * Get storage size estimate (approximate)
 */
export const getStorageInfo = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    let totalSize = 0;
    
    for (const key of allKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    }
    
    return {
      keyCount: allKeys.length,
      estimatedSize: totalSize,
      estimatedSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return null;
  }
};

/**
 * Clear all app data (use with caution)
 */
export const clearAllData = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const appKeys = allKeys.filter(key => 
      key.startsWith('observeplus_') || 
      key.startsWith('draft_session_') ||
      key === 'appointments' ||
      key === 'completed_appointments'
    );
    
    await AsyncStorage.multiRemove(appKeys);
    console.log(`Cleared ${appKeys.length} storage keys`);
    return true;
  } catch (error) {
    console.error('Failed to clear all data:', error);
    return false;
  }
};

/**
 * Validate and repair corrupted data
 */
export const validateAndRepairData = async () => {
  try {
    // Validate appointments
    const appointments = await getItem(STORAGE_KEYS.APPOINTMENTS, []);
    if (!Array.isArray(appointments)) {
      console.warn('Appointments data corrupted, resetting');
      await removeItem(STORAGE_KEYS.APPOINTMENTS);
    }
    
    // Validate completed sessions
    const sessions = await getItem(STORAGE_KEYS.COMPLETED_SESSIONS, []);
    if (!Array.isArray(sessions)) {
      console.warn('Sessions data corrupted, resetting');
      await removeItem(STORAGE_KEYS.COMPLETED_SESSIONS);
    }
    
    // Validate completed appointments
    const completed = await getItem(STORAGE_KEYS.COMPLETED_APPOINTMENTS, []);
    if (!Array.isArray(completed)) {
      console.warn('Completed appointments data corrupted, resetting');
      await removeItem(STORAGE_KEYS.COMPLETED_APPOINTMENTS);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to validate data:', error);
    return false;
  }
};

/**
 * Save draft session data atomically
 */
export const saveDraftSession = async (appointmentId, draftData) => {
  try {
    const baseKey = STORAGE_KEYS.DRAFT_SESSION(appointmentId);
    const timestampKey = STORAGE_KEYS.DRAFT_TIMESTAMP(appointmentId);
    
    await setMultipleItems({
      [baseKey]: draftData,
      [timestampKey]: Date.now().toString(),
    });
    
    return true;
  } catch (error) {
    console.error('Failed to save draft session:', error);
    throw error;
  }
};

/**
 * Load draft session data
 */
export const loadDraftSession = async (appointmentId) => {
  try {
    const baseKey = STORAGE_KEYS.DRAFT_SESSION(appointmentId);
    const timestampKey = STORAGE_KEYS.DRAFT_TIMESTAMP(appointmentId);
    const signatureKey = STORAGE_KEYS.DRAFT_SIGNATURE(appointmentId);
    
    const items = await getMultipleItems([
      baseKey,
      timestampKey,
      signatureKey,
    ]);
    
    return {
      draft: items[baseKey] || null,
      timestamp: items[timestampKey] ? parseInt(items[timestampKey]) : null,
      signature: items[signatureKey] || null,
    };
  } catch (error) {
    console.error('Failed to load draft session:', error);
    return { draft: null, timestamp: null, signature: null };
  }
};

/**
 * Clear draft session data
 */
export const clearDraftSession = async (appointmentId) => {
  try {
    const baseKey = STORAGE_KEYS.DRAFT_SESSION(appointmentId);
    const timestampKey = STORAGE_KEYS.DRAFT_TIMESTAMP(appointmentId);
    const signatureKey = STORAGE_KEYS.DRAFT_SIGNATURE(appointmentId);
    
    await AsyncStorage.multiRemove([baseKey, timestampKey, signatureKey]);
    return true;
  } catch (error) {
    console.error('Failed to clear draft session:', error);
    return false;
  }
};