import AsyncStorage from '@react-native-async-storage/async-storage';
import { getItem, setItem, STORAGE_KEYS } from './storageService';

const COMPLETED_SESSIONS_KEY = STORAGE_KEYS.COMPLETED_SESSIONS;
const TAG_USAGE_KEY = STORAGE_KEYS.TAG_USAGE;

/**
 * Tag Suggestion Service
 * 
 * Algorithm for suggesting recently used and common tags:
 * 
 * 1. Frequency Score: Based on how many times a tag has been used
 * 2. Recency Score: Based on how recently a tag was used (exponential decay)
 * 3. Combined Score: Weighted combination of frequency and recency
 * 
 * Scoring Formula:
 * - Frequency Score: log(count + 1) to prevent very frequent tags from dominating
 * - Recency Score: e^(-days_ago / decay_factor) where decay_factor = 7 (half-life of 7 days)
 * - Combined Score: (0.4 * frequency_score) + (0.6 * recency_score)
 * 
 * This ensures:
 * - Frequently used tags appear in suggestions
 * - Recently used tags are prioritized
 * - Balance between common and recent usage
 */

/**
 * Track tag usage when a session is completed
 * @param {Object} sessionData - Session data with tags, peopleCategory, actionsCategory
 */
export const trackTagUsage = async (sessionData) => {
  try {
    const { tags = [], peopleCategory = '', actionsCategory = '' } = sessionData;
    const timestamp = Date.now();
    
    // Get existing tag usage data
    let tagUsage = await getItem(TAG_USAGE_KEY, {});
    
    // Track all tags from the session
    const allTags = [
      ...tags,
      ...(peopleCategory ? [peopleCategory] : []),
      ...(actionsCategory ? [actionsCategory] : []),
    ];
    
    // Update usage for each tag
    allTags.forEach(tag => {
      if (!tag || tag.trim() === '') return;
      
      const tagKey = tag.trim().toLowerCase();
      
      if (!tagUsage[tagKey]) {
        tagUsage[tagKey] = {
          tag: tag.trim(), // Store original case
          count: 0,
          lastUsed: null,
          firstUsed: timestamp,
        };
      }
      
      tagUsage[tagKey].count += 1;
      tagUsage[tagKey].lastUsed = timestamp;
    });
    
    // Save updated usage data
    await setItem(TAG_USAGE_KEY, tagUsage);
    
    console.log('✅ Tag usage tracked for', allTags.length, 'tags');
  } catch (error) {
    console.error('❌ Failed to track tag usage:', error);
  }
};

/**
 * Load tag usage data from completed sessions (for migration/initialization)
 */
export const initializeTagUsageFromSessions = async () => {
  try {
    const sessions = await getItem(COMPLETED_SESSIONS_KEY, []);
    if (!Array.isArray(sessions) || sessions.length === 0) return;
    
    let tagUsage = {};
    
    // Process all sessions
    sessions.forEach(session => {
      const { tags = [], peopleCategory = '', actionsCategory = '' } = session;
      const timestamp = session.timestamp || Date.now();
      
      const allTags = [
        ...tags,
        ...(peopleCategory ? [peopleCategory] : []),
        ...(actionsCategory ? [actionsCategory] : []),
      ];
      
      allTags.forEach(tag => {
        if (!tag || tag.trim() === '') return;
        
        const tagKey = tag.trim().toLowerCase();
        
        if (!tagUsage[tagKey]) {
          tagUsage[tagKey] = {
            tag: tag.trim(),
            count: 0,
            lastUsed: null,
            firstUsed: timestamp,
          };
        }
        
        tagUsage[tagKey].count += 1;
        
        // Update lastUsed if this session is more recent
        if (!tagUsage[tagKey].lastUsed || timestamp > tagUsage[tagKey].lastUsed) {
          tagUsage[tagKey].lastUsed = timestamp;
        }
        
        // Update firstUsed if this session is older
        if (timestamp < tagUsage[tagKey].firstUsed) {
          tagUsage[tagKey].firstUsed = timestamp;
        }
      });
    });
    
    // Save initialized usage data
    await setItem(TAG_USAGE_KEY, tagUsage);
    
    console.log('✅ Initialized tag usage from', sessions.length, 'sessions');
  } catch (error) {
    console.error('❌ Failed to initialize tag usage:', error);
  }
};

/**
 * Calculate frequency score for a tag
 * Uses logarithmic scaling to prevent very frequent tags from dominating
 * @param {number} count - Number of times tag was used
 * @returns {number} Frequency score (0-1)
 */
const calculateFrequencyScore = (count) => {
  // Use log scale: log(count + 1) / log(max_count + 1)
  // Normalize to 0-1 range
  return Math.log(count + 1) / Math.log(100); // Assuming max 100 uses
};

/**
 * Calculate recency score for a tag
 * Uses exponential decay: more recent = higher score
 * @param {number} lastUsedTimestamp - Timestamp when tag was last used
 * @returns {number} Recency score (0-1)
 */
const calculateRecencyScore = (lastUsedTimestamp) => {
  if (!lastUsedTimestamp) return 0;
  
  const now = Date.now();
  const daysAgo = (now - lastUsedTimestamp) / (1000 * 60 * 60 * 24);
  
  // Exponential decay with half-life of 7 days
  // e^(-days_ago / 7)
  const decayFactor = 7;
  const recencyScore = Math.exp(-daysAgo / decayFactor);
  
  return Math.max(0, Math.min(1, recencyScore)); // Clamp to 0-1
};

/**
 * Calculate combined score for tag suggestion
 * @param {Object} tagData - Tag usage data
 * @returns {number} Combined score
 */
const calculateCombinedScore = (tagData) => {
  const frequencyScore = calculateFrequencyScore(tagData.count);
  const recencyScore = calculateRecencyScore(tagData.lastUsed);
  
  // Weighted combination: 40% frequency, 60% recency
  // This prioritizes recent usage while still considering frequency
  const combinedScore = (0.4 * frequencyScore) + (0.6 * recencyScore);
  
  return combinedScore;
};

/**
 * Get suggested tags based on usage history
 * @param {Array} availableTags - List of all available tags
 * @param {number} limit - Maximum number of suggestions (default: 6)
 * @returns {Array} Array of suggested tags sorted by score
 */
export const getSuggestedTags = async (availableTags = [], limit = 6) => {
  try {
    // Initialize from sessions if no usage data exists
    let usage = await getItem(TAG_USAGE_KEY, null);
    if (!usage || Object.keys(usage).length === 0) {
      await initializeTagUsageFromSessions();
      usage = await getItem(TAG_USAGE_KEY, {});
    }
    
    if (!usage || Object.keys(usage).length === 0) {
      return availableTags.slice(0, limit);
    }
    
    // Calculate scores for each available tag
    const tagsWithScores = availableTags.map(tag => {
      const tagKey = tag.toLowerCase();
      const usageData = usage[tagKey];
      
      if (!usageData) {
        // New tags get a small default score
        return {
          tag,
          score: 0.1,
          count: 0,
          lastUsed: null,
        };
      }
      
      return {
        tag: usageData.tag, // Use original case from storage
        score: calculateCombinedScore(usageData),
        count: usageData.count,
        lastUsed: usageData.lastUsed,
      };
    });
    
    // Sort by score (descending) and return top suggestions
    const sorted = tagsWithScores.sort((a, b) => b.score - a.score);
    
    return sorted.slice(0, limit).map(item => item.tag);
  } catch (error) {
    console.error('❌ Failed to get suggested tags:', error);
    return availableTags.slice(0, limit);
  }
};

/**
 * Get recently used tags (based on recency only)
 * @param {Array} availableTags - List of all available tags
 * @param {number} limit - Maximum number of suggestions (default: 6)
 * @returns {Array} Array of recently used tags
 */
export const getRecentlyUsedTags = async (availableTags = [], limit = 6) => {
  try {
    const usage = await getItem(TAG_USAGE_KEY, {});
    if (!usage || Object.keys(usage).length === 0) {
      return availableTags.slice(0, limit);
    }
    
    // Get tags with recency data
    const tagsWithRecency = availableTags
      .map(tag => {
        const tagKey = tag.toLowerCase();
        const usageData = usage[tagKey];
        
        if (!usageData || !usageData.lastUsed) {
          return null;
        }
        
        return {
          tag: usageData.tag,
          lastUsed: usageData.lastUsed,
          recencyScore: calculateRecencyScore(usageData.lastUsed),
        };
      })
      .filter(item => item !== null);
    
    // Sort by recency (most recent first)
    const sorted = tagsWithRecency.sort((a, b) => b.lastUsed - a.lastUsed);
    
    return sorted.slice(0, limit).map(item => item.tag);
  } catch (error) {
    console.error('❌ Failed to get recently used tags:', error);
    return availableTags.slice(0, limit);
  }
};

/**
 * Get most common tags (based on frequency only)
 * @param {Array} availableTags - List of all available tags
 * @param {number} limit - Maximum number of suggestions (default: 6)
 * @returns {Array} Array of most common tags
 */
export const getMostCommonTags = async (availableTags = [], limit = 6) => {
  try {
    const usage = await getItem(TAG_USAGE_KEY, {});
    if (!usage || Object.keys(usage).length === 0) {
      return availableTags.slice(0, limit);
    }
    
    // Get tags with frequency data
    const tagsWithFrequency = availableTags
      .map(tag => {
        const tagKey = tag.toLowerCase();
        const usageData = usage[tagKey];
        
        if (!usageData || usageData.count === 0) {
          return null;
        }
        
        return {
          tag: usageData.tag,
          count: usageData.count,
          frequencyScore: calculateFrequencyScore(usageData.count),
        };
      })
      .filter(item => item !== null);
    
    // Sort by count (most frequent first)
    const sorted = tagsWithFrequency.sort((a, b) => b.count - a.count);
    
    return sorted.slice(0, limit).map(item => item.tag);
  } catch (error) {
    console.error('❌ Failed to get most common tags:', error);
    return availableTags.slice(0, limit);
  }
};

/**
 * Clear all tag usage data (for testing/reset)
 */
export const clearTagUsage = async () => {
  try {
    const { removeItem } = await import('./storageService');
    await removeItem(TAG_USAGE_KEY);
    console.log('✅ Tag usage data cleared');
  } catch (error) {
    console.error('❌ Failed to clear tag usage:', error);
  }
};

