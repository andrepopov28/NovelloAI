import { Chapter, Project } from './types';

export function analyzeText(text: string) {
    // Basic sanitization
    const plainText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plainText) return null;

    // Sentence metrics
    const sentences = plainText.match(/[.!?]+(\s|$)/g) || [];
    const sentenceCount = sentences.length || 1;
    const wordCount = plainText.split(' ').length;
    const avgSentenceLength = wordCount / sentenceCount;

    // Vocabulary metrics
    const words = plainText.toLowerCase().split(/\W+/).filter(w => w.length > 0);
    const complexWords = words.filter(w => w.length > 6).length;
    const complexRatio = complexWords / words.length;
    let vocabularyLevel: 'simple' | 'moderate' | 'literary' = 'moderate';
    if (complexRatio < 0.1) vocabularyLevel = 'simple';
    else if (complexRatio > 0.25) vocabularyLevel = 'literary';

    // Dialogue metrics
    const dialogueMatches = plainText.match(/["“].*?["”]/g) || [];
    const dialogueLength = dialogueMatches.reduce((acc, match) => acc + match.length, 0);
    const dialogueRatio = dialogueLength / plainText.length;

    // POV Heuristics (rough approximation)
    const firstPersonPronouns = (plainText.match(/\b(I|me|my|mine|we|us|our)\b/gi) || []).length;
    const thirdPersonPronouns = (plainText.match(/\b(he|him|his|she|her|hers|they|them|their)\b/gi) || []).length;
    const pov = firstPersonPronouns > thirdPersonPronouns ? 'First Person' : 'Third Person';

    // Tense Heuristics (rough approximation)
    const pastTenseVerbs = (plainText.match(/\b\w+ed\b/g) || []).length; // very rough
    const presentTenseVerbs = (plainText.match(/\b(is|am|are|has|have|says|walks|looks)\b/g) || []).length; // very rough
    const tense = pastTenseVerbs > presentTenseVerbs ? 'Past Tense' : 'Present Tense';

    return {
        avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
        vocabularyLevel,
        pov,
        tense,
        dialogueRatio: Math.round(dialogueRatio * 100) / 100,
    };
}

export function computeProjectStyle(chapters: Chapter[]): Project['styleProfile'] {
    if (chapters.length === 0) return null;

    let totalSentenceLength = 0;
    let totalDialogueRatio = 0;
    let simpleCount = 0, moderateCount = 0, literaryCount = 0;
    let firstPersonCount = 0, thirdPersonCount = 0;
    let pastTenseCount = 0, presentTenseCount = 0;

    let validChapters = 0;

    for (const chapter of chapters) {
        const metrics = analyzeText(chapter.content);
        if (!metrics) continue;

        validChapters++;
        totalSentenceLength += metrics.avgSentenceLength;
        totalDialogueRatio += metrics.dialogueRatio;

        if (metrics.vocabularyLevel === 'simple') simpleCount++;
        else if (metrics.vocabularyLevel === 'moderate') moderateCount++;
        else literaryCount++;

        if (metrics.pov === 'First Person') firstPersonCount++; else thirdPersonCount++;
        if (metrics.tense === 'Past Tense') pastTenseCount++; else presentTenseCount++;
    }

    if (validChapters === 0) return null;

    // Determine aggregate values
    const avgSentenceLength = Math.round((totalSentenceLength / validChapters) * 10) / 10;
    const dialogueRatio = Math.round((totalDialogueRatio / validChapters) * 100) / 100;

    let vocabularyLevel: 'simple' | 'moderate' | 'literary' = 'moderate';
    if (simpleCount > moderateCount && simpleCount > literaryCount) vocabularyLevel = 'simple';
    else if (literaryCount > moderateCount && literaryCount > simpleCount) vocabularyLevel = 'literary';

    const povConsistency = firstPersonCount > thirdPersonCount ? 'First Person' : 'Third Person';
    const tenseUsage = pastTenseCount > presentTenseCount ? 'Past Tense' : 'Present Tense';

    return {
        avgSentenceLength,
        vocabularyLevel,
        povConsistency,
        tenseUsage,
        dialogueRatio,
    };
}
