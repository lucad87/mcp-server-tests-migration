/**
 * Tag extraction and manipulation utilities
 */

import { TAG_PATTERNS } from '../constants/mappings.js';

/**
 * Extract tags from a string (test description)
 * @param {string} str - The string to extract tags from
 * @returns {string[]} Array of extracted tags (lowercase)
 */
export function extractTagsFromString(str) {
  const tags = new Set();
  
  for (const pattern of TAG_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(str)) !== null) {
      tags.add(match[1].toLowerCase());
    }
  }
  
  return Array.from(tags);
}

/**
 * Remove tags from a string (clean test description)
 * @param {string} str - The string to remove tags from
 * @returns {string} Cleaned string without tags
 */
export function removeTagsFromString(str) {
  let result = str;
  for (const pattern of TAG_PATTERNS) {
    result = result.replace(new RegExp(pattern.source, 'g'), '');
  }
  return result.trim().replace(/\s+/g, ' ');
}
