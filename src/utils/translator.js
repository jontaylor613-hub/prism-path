// Universal Translator Utility
// Translates content using AI for parent communication

import { GeminiService } from '../utils';

/**
 * Translates text to a target language using AI
 * @param {string} text - The text to translate
 * @param {string} targetLanguage - Target language (e.g., "Spanish", "French", "Mandarin")
 * @returns {Promise<string>} - Translated text
 */
export async function translateContent(text, targetLanguage) {
  if (!text || !text.trim()) {
    return '';
  }

  if (!targetLanguage || targetLanguage === 'English') {
    return text; // No translation needed
  }

  try {
    // Use the translator mode (will be added to API)
    const result = await GeminiService.generate(
      {
        text: text,
        targetLanguage: targetLanguage
      },
      'translator'
    );

    return result || text; // Fallback to original if translation fails
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text on error
  }
}

