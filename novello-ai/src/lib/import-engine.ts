import mammoth from 'mammoth';

export interface ParsedChapter {
    title: string;
    content: string;
}

export interface ParsedManuscript {
    title: string;
    chapters: ParsedChapter[];
    fullText: string;
}

/**
 * Parses a manuscript file (.docx, .txt, .md) into text and chapters.
 */
export async function parseManuscript(file: File): Promise<ParsedManuscript> {
    let fullText = '';
    const fileType = file.name.split('.').pop()?.toLowerCase();

    try {
        if (fileType === 'docx') {
            const arrayBuffer = await file.arrayBuffer();
            // @ts-ignore: mammoth might lack types in this environment
            const result = await mammoth.extractRawText({ arrayBuffer });
            fullText = result.value;
        } else if (fileType === 'txt' || fileType === 'md') {
            fullText = await file.text();
        } else {
            throw new Error(`Unsupported file type: .${fileType}`);
        }
    } catch (error) {
        console.error('Error reading file:', error);
        throw new Error('Failed to read file content.');
    }

    // Basic Chapter Parsing Logic
    // Looks for lines starting with "Chapter", "Part", "Prologue", "Epilogue" followed by optional number
    const chapterRegex = /(?:^|\n)\s*(Chapter|Part|Prologue|Epilogue)\s*(\d+|One|Two|Three|I|II|III)?.*(?:\r?\n|$)/gi;

    // If no chapters found, treat whole text as one chapter
    // We can also split by double newlines if no headers found? No, that's too aggressive.

    const chapters: ParsedChapter[] = [];

    // Reset regex state
    chapterRegex.lastIndex = 0;

    // Find all matches
    const matches = Array.from(fullText.matchAll(chapterRegex));

    if (matches.length === 0) {
        // No chapters detected, return whole text as one chapter
        chapters.push({
            title: file.name.replace(/\.[^/.]+$/, ""),
            content: fullText.trim()
        });
    } else {
        for (let i = 0; i < matches.length; i++) {
            const currentMatch = matches[i];
            const nextMatch = matches[i + 1];

            const startIndex = currentMatch.index! + currentMatch[0].length;
            const endIndex = nextMatch ? nextMatch.index! : fullText.length;

            const title = currentMatch[0].trim();
            const content = fullText.slice(startIndex, endIndex).trim();

            if (content.length > 0) {
                chapters.push({ title, content });
            }
        }

        // Handle prologue text if it exists before the first chapter?
        if (matches[0].index! > 0) {
            const prologueContent = fullText.slice(0, matches[0].index!).trim();
            if (prologueContent.length > 0) {
                chapters.unshift({
                    title: 'Front Matter',
                    content: prologueContent
                });
            }
        }
    }

    return {
        title: file.name.replace(/\.[^/.]+$/, ""),
        fullText,
        chapters
    };
}
