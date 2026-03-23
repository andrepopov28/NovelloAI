const http = require('http');
const fs = require('fs');

const TITLES = [
    "Introduction – The Day Intelligence Became Cheap",
    "Chapter 1 – The Death of Smart",
    "Chapter 2 – Direction in an Age of Infinite Options (D)",
    "Chapter 3 – Relevance Is Power (R)",
    "Chapter 4 – Emotional Control as Alpha (E)",
    "Chapter 5 – Agency Over Automation (A)",
    "Chapter 6 – Meaning as the Ultimate Moat (M)",
    "Chapter 7 – Building Your Personal Flywheel",
    "Chapter 8 – The Human Premium"
];

const SECTIONS = ["The Story and Hook", "Structural Analysis", "Historical and Modern Examples", "The Principle Applied", "Summary and Key Takeaways"];

async function callOllama(prompt) {
    const postData = JSON.stringify({
        model: 'martain7r/finance-llama-8b:fp16',
        prompt: prompt,
        stream: false
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 11434,
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    resolve(data.response);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

async function generateChapter(title, index) {
    console.log(`Starting multi-stage generation for: ${title}`);
    let fullChapter = `# ${title}\n\n`;

    for (const section of SECTIONS) {
        console.log(`  - Generating section: ${section}`);
        const prompt = `You are writing a premium non-fiction book 'Titan Inc. – The Rise of the 100x Human'.
Current Chapter: ${title}
Focus Section: ${section}

Instruction: Write 400-500 words for this specific section. Use a luxurious, professional, and narrative-driven style. 
Do not repeat yourself. Connect this specifically to the core thesis of human leverage in the age of AI.
Be exhaustive.`;

        try {
            const content = await callOllama(prompt);
            fullChapter += `## ${section}\n\n${content}\n\n`;
        } catch (e) {
            console.error(`Error in ${title} - ${section}:`, e);
        }
    }

    const filename = `chapter_${index}_long.txt`;
    fs.writeFileSync(filename, fullChapter);
    console.log(`Saved ${filename}`);
}

async function runAll() {
    for (let i = 0; i < TITLES.length; i++) {
        await generateChapter(TITLES[i], i);
    }
    console.log("All long chapters generated.");
}

runAll();
