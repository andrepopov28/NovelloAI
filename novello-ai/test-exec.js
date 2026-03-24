const { execFile } = require('child_process');
const piperBin = '/Users/andrepopov/Documents/NovelloAI/novello-ai/bin/piper/piper';
const modelPath = '/Users/andrepopov/Documents/NovelloAI/novello-ai/voices/en_US-lessac-high.onnx';
const wavPath = '/Users/andrepopov/Documents/NovelloAI/novello-ai/tmp/test.wav';

execFile(piperBin, ['--model', modelPath, '--output_file', wavPath], {
    input: "Hello this is a test.",
}, (error, stdout, stderr) => {
    if (error) {
        console.error("ERROR:", error);
    }
    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);
});
