// =============================================
// Novello AI v19 — Prompt Templates
// Centralized, versioned prompts for all AI features.
// =============================================

export const SYSTEM_PROMPT = `You are Novello, an expert fiction writing assistant. You help authors craft compelling narratives with vivid prose, strong character development, and engaging plots. Always maintain the author's voice and style. Be creative but respectful of the author's intent.`;

export interface StyleProfile {
  avgSentenceLength: number;
  vocabularyLevel: 'simple' | 'moderate' | 'literary';
  povConsistency: string;
  tenseUsage: string;
  dialogueRatio: number;
}

export function OUTLINE_PROMPT(premise: string, genre: string): string {
  return `You are a master story architect. Based on the following premise and genre, generate a structured chapter outline for a novel.

**Genre:** ${genre || 'General Fiction'}
**Premise:** ${premise}

Generate a JSON response with exactly this structure:
{
  "chapters": [
    {
      "title": "Chapter title",
      "synopsis": "A 2-3 sentence description of what happens in this chapter"
    }
  ]
}

Guidelines:
- Generate 8-12 chapters for a well-paced novel
- Each chapter should advance the plot meaningfully
- Include rising action, climax, and resolution
- Make titles evocative and intriguing
- Synopses should be specific, not vague

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no extra text.`;
}

export function REWRITE_PROMPT(text: string, instruction: string, context?: string): string {
  const contextBlock = context
    ? `\n**Story Context (for continuity):**\n${context}\n`
    : '';
  return `Rewrite the following passage according to the instruction. Maintain the same general meaning and length, but improve the prose quality.
${contextBlock}
**Instruction:** ${instruction || 'Improve clarity, flow, and vivid imagery'}

**Original text:**
${text}

Write ONLY the rewritten passage. No explanations, no preamble.`;
}

export function EXPAND_PROMPT(text: string, context?: string): string {
  const contextBlock = context
    ? `\n**Story Context (for continuity):**\n${context}\n`
    : '';
  return `Expand the following passage with richer detail, sensory descriptions, and deeper character interiority. Roughly double the length while maintaining the same narrative direction and voice.
${contextBlock}
**Original text:**
${text}

Write ONLY the expanded passage. No explanations, no preamble.`;
}

export function SUMMARIZE_PROMPT(chapterContent: string): string {
  return `Summarize the following chapter in exactly 150-200 words. Focus on: key plot events, character actions and motivations, and any world-building details introduced. Write in present tense, third person.

**Chapter Content:**
${chapterContent}

Write ONLY the summary. No labels, no preamble.`;
}

export function WRITE_CHAPTER_PROMPT(title: string, synopsis: string, context?: string, style?: StyleProfile | null): string {
  const contextBlock = context
    ? `\n**Overall Story Context & Premise:**\n${context}\n`
    : '';

  let styleBlock = '';
  if (style) {
    styleBlock = `\n**Style & Voice Guidelines (Strictly Follow):**
- **Sentence Structure:** Target average sentence length of ~${style.avgSentenceLength} words.
- **Vocabulary:** Use a ${style.vocabularyLevel} vocabulary.
- **POV:** Write in ${style.povConsistency}.
- **Tense:** Write in ${style.tenseUsage}.
- **Dialogue:** Aim for approximately ${Math.round(style.dialogueRatio * 100)}% dialogue content.`;
  }

  return `You are a master novelist. Your task is to write a full-length, immersive chapter based on the title and synopsis provided.

${contextBlock}${styleBlock}

**Chapter Title:** ${title}
**Chapter Synopsis:** ${synopsis}

Guidelines:
- Write in a professional, engaging novelistic style.
- Use vivid sensory details and "show, don't tell".
- Develop characters through dialogue and interiority.
- The chapter should be roughly 1500-2000 words (or as much as possible in one go).
- Keep the narrative consistent with the provided synopsis.

Write ONLY the chapter content in HTML format (using <p>, <h2>, <em>, <strong> tags). No preamble, no chapter title in the body.`;
}

export function CONTINUITY_PROMPT(chapterContent: string, entities: string, previousContext: string): string {
  return `You are The Archivist, an expert story continuity editor.
Your task is to analyze the following chapter content for contradictions, timeline errors, and character inconsistencies.

**Known Context (Facts):**
${previousContext}

**Entities (Characters/Settings):**
${entities}

**Chapter Content to Analyze:**
${chapterContent}

Identify potential continuity errors. Focus on:
1. Contradictions with established facts (e.g., eye color, past events).
2. Timeline/chronology errors.
3. Out-of-character behavior without explanation.
4. Setting details that contradict previous descriptions.

Return a JSON object with a list of alerts:
{
  "alerts": [
    {
      "type": "contradiction" | "timeline" | "character" | "setting",
      "severity": "warning" | "critical",
      "message": "Brief description of the error",
      "quote": "Exact quote from the chapter content that is problematic",
      "fix": "Optional suggestion to fix it"
    }
  ]
}

If no errors are found, return { "alerts": [] }.
Return ONLY valid JSON.`;
}

export function STYLE_PROMPT(chaptersContent: string): string {
  return `You are an expert literary critic and editor.
Analyze the following text to determine the author's unique writing style profile.

**Text to Analyze:**
${chaptersContent}

Determine the following:
1. Average sentence length (estimate).
2. Vocabulary level (choose exactly one: "simple", "moderate", "literary").
3. Point of View consistency (e.g., "First Person past", "Third Person Intimate", etc.).
4. Tense usage (e.g., "Past tense", "Present tense").
5. Dialogue ratio (estimate the percentage of text that is dialogue, from 0.0 to 1.0).

Return ONLY a valid JSON object matching this structure exactly:
{
  "avgSentenceLength": 12,
  "vocabularyLevel": "moderate",
  "povConsistency": "Third Person Limited",
  "tenseUsage": "Past tense",
  "dialogueRatio": 0.45
}`;
}

export function COVER_PROMPT(title: string, synopsis: string, genre: string): string {
  return `You are an expert Midjourney and Stable Diffusion prompt engineer.
Create a highly detailed, comma-separated image generation prompt for a book cover based on the following details:

**Title:** ${title}
**Genre:** ${genre}
**Synopsis:** ${synopsis}

Include specific aesthetic keywords, lighting, atmosphere, style (e.g., hyper-realistic, digital illustration, cinematic lighting), and composition.
Keep it under 60 words. Do NOT include any preamble, explanations, or quotes. Just output the raw image generation prompt string.`;
}

export function CRITIQUE_PROMPT(chapterTitle: string, chapterContent: string, context?: string): string {
  const contextBlock = context ? `\n**Story Context:**\n${context}\n` : '';
  return `You are an expert beta reader and developmental editor with 20 years of experience in fiction.
Please provide a structured critique of the following chapter.

**Chapter:** ${chapterTitle}
${contextBlock}
**Chapter Content:**
${chapterContent.slice(0, 8000)}

Analyze the following dimensions and return a JSON response:
{
  "overallScore": 7,
  "pacing": { "score": 7, "feedback": "Specific feedback on pacing..." },
  "tension": { "score": 8, "feedback": "Specific feedback on tension..." },
  "characterVoice": { "score": 6, "feedback": "Specific feedback on character voice..." },
  "hookStrength": { "score": 9, "feedback": "Specific feedback on hook/opening..." },
  "highlights": ["What worked really well...", "Another strong point..."],
  "suggestions": ["Most important improvement...", "Second suggestion...", "Third suggestion..."]
}

Scoring: 1-4 needs work, 5-6 solid, 7-8 strong, 9-10 excellent.
Be specific — quote directly from the text when possible.
Return ONLY valid JSON.`;
}

export function PLOT_HOLE_PROMPT(chaptersJson: string, entitiesJson: string): string {
  return `You are The Archivist, an expert story continuity analyst.
Analyze the following chapters and entity codex for open plot threads, unresolved setups, and character inconsistencies.

**Chapter Summaries (JSON):**
${chaptersJson}

**Entity Codex (JSON):**
${entitiesJson}

Identify:
1. Plot threads introduced but never resolved (setups without payoffs)
2. Characters who appear early but disappear without explanation
3. Objects or MacGuffins mentioned but forgotten
4. Timeline inconsistencies across chapters
5. Promise-breaking (author promised something to reader that was never delivered)

Return a JSON object:
{
  "openThreads": [
    {
      "id": "unique-id",
      "title": "Thread name",
      "introducedInChapter": "Chapter 2",
      "lastMentionedInChapter": "Chapter 4",
      "status": "dangling",
      "description": "What was introduced and what was expected",
      "characters": ["CharacterName"]
    }
  ],
  "summary": "Brief overall assessment"
}

If no issues found, return { "openThreads": [], "summary": "No open threads detected. Good narrative cohesion." }
Return ONLY valid JSON.`;
}

export function GHOST_WRITER_PROMPT(title: string, synopsis: string, context: string, style: StyleProfile | null, wordTarget = 1500): string {
  let styleBlock = '';
  if (style) {
    styleBlock = `\n**Voice & Style (Must Match):**
- Sentence length: ~${style.avgSentenceLength} words avg
- Vocabulary: ${style.vocabularyLevel}
- POV: ${style.povConsistency}
- Tense: ${style.tenseUsage}
- Dialogue ratio: ~${Math.round(style.dialogueRatio * 100)}%`;
  }
  return `You are a ghostwriter writing in the established voice of this novel.

**Story Context:**
${context}${styleBlock}

**This Chapter:**
Title: ${title}
Synopsis: ${synopsis}

Write approximately ${wordTarget} words. Write ONLY the chapter content in HTML (using <p>, <em>, <strong> tags).
No chapter titles, no preamble, no meta-commentary.`;
}
