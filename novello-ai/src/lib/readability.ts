export interface ReadabilityMetrics {
  fleschKincaid: number;
  gradeLevel: string;
  readingTimeMinutes: number;
  wordCount: number;
  sentenceCount: number;
}

// Simple syllable counter
function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const match = word.match(/[aeiouy]{1,2}/g);
  return match ? match.length : 1;
}

export function analyzeReadability(htmlContent: string): ReadabilityMetrics {
  if (!htmlContent) {
    return {
      fleschKincaid: 0,
      gradeLevel: 'N/A',
      readingTimeMinutes: 0,
      wordCount: 0,
      sentenceCount: 0,
    };
  }

  // Strip HTML
  const text = htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  // Count sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  let sentenceCount = sentences.length;
  if (sentenceCount === 0 && text.length > 0) sentenceCount = 1;

  // Count words
  const words = text.match(/\b[-?a-zA-Z0-9_]+\b/g) || [];
  const wordCount = words.length;

  // Count syllables
  let syllableCount = 0;
  for (const word of words) {
    syllableCount += countSyllables(word);
  }

  // Flesch Reading Ease Formula
  let fleschKincaid = 0;
  let gradeLevel = 'N/A';

  if (wordCount > 0 && sentenceCount > 0) {
    fleschKincaid = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);

    if (fleschKincaid >= 90) gradeLevel = '5th Grade';
    else if (fleschKincaid >= 80) gradeLevel = '6th Grade';
    else if (fleschKincaid >= 70) gradeLevel = '7th Grade';
    else if (fleschKincaid >= 60) gradeLevel = '8th-9th Grade';
    else if (fleschKincaid >= 50) gradeLevel = '10th-12th Grade';
    else if (fleschKincaid >= 30) gradeLevel = 'College';
    else gradeLevel = 'College Graduate';
  }

  // Avg reading speed: 250 wpm
  const readingTimeMinutes = Math.ceil(wordCount / 250);

  return {
    fleschKincaid: Math.max(0, Math.min(100, Math.round(fleschKincaid))),
    gradeLevel,
    readingTimeMinutes,
    wordCount,
    sentenceCount,
  };
}
