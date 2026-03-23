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

async function generateChapter(title, index) {
    console.log(`Starting generation for: ${title}`);
    const prompt = `Write a very long, high-quality non-fiction chapter for the book 'Titan Inc. – The Rise of the 100x Human'.
Title: ${title}
Context: Part of the DREAM framework (Direction, Relevance, Emotional Control, Agency, Meaning).
Instructions: Focus on luxurious professional narrative, deep market insights, and the thesis that human leverage shifts to timeless principles.
Target Length: Aim for 1500-2000 words. Be exhaustive and detailed.
Paragraph rhythm: Story -> Insight -> Structural analysis -> Punchline.`;

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
                    const filename = `chapter_${index}.txt`;
                    fs.writeFileSync(filename, data.response);
                    console.log(`Saved ${filename}`);
                    resolve();
                } catch (e) {
                    console.error(`Error in ${title}:`, e);
                    resolve(); // Continue anyway
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with ${title}: ${e.message}`);
            resolve();
        });

        req.write(postData);
        req.end();
    });
}

async function runAll() {
    for (let i = 0; i < TITLES.length; i++) {
        await generateChapter(TITLES[i], i);
    }
    console.log("All generations requested.");
}

runAll();
