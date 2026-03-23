const http = require('http');
const fs = require('fs');

const postData = JSON.stringify({
    model: 'llama3:latest',
    prompt: "Write a 1000-word non-fiction intro for a book titled Titan Inc. – The Rise of the 100x Human. \nChapter Title: Introduction – The Day Intelligence Became Cheap. \nFocus: A brilliant engineer loses leverage not because she lacks skill, but because her skill becomes automated overnight. Evolution of skill to principle. \nTone: Narrative Curiosity, Sharp Market Realism.",
    stream: false
});

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
            fs.writeFileSync('intro_content.txt', data.response);
            console.log('Successfully generated intro.');
        } catch (e) {
            console.error('Error parsing response:', e);
            console.error('Body:', body);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
