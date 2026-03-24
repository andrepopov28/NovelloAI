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
