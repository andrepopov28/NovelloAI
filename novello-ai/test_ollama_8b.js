const http = require('http');
const fs = require('fs');

const postData = JSON.stringify({
    model: 'martain7r/finance-llama-8b:fp16',
    prompt: "Hello",
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
            fs.writeFileSync('test_ollama_8b.txt', data.response);
            console.log('Successfully generated test 8b.');
        } catch (e) {
            console.error('Error parsing response:', e);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
