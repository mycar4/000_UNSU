const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../fo/public/audio');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sampleRate = 8000;
const duration = 2.0; // 2 seconds
const frequency = 440; // 440Hz beep
const numSamples = sampleRate * duration;
const bitsPerSample = 8;
const subChunk2Size = numSamples;
const chunkSize = 36 + subChunk2Size;

const buffer = Buffer.alloc(44 + subChunk2Size);

// RIFF header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(chunkSize, 4);
buffer.write('WAVE', 8);

// fmt subchunk
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(1, 22); // Mono
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate, 28); // ByteRate
buffer.writeUInt16LE(1, 32); // BlockAlign
buffer.writeUInt16LE(bitsPerSample, 34);

// data subchunk
buffer.write('data', 36);
buffer.writeUInt32LE(subChunk2Size, 40);

// Sine wave samples
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const sample = Math.round(128 + 127 * Math.sin(2 * Math.PI * frequency * t));
  buffer.writeUInt8(sample, 44 + i);
}

fs.writeFileSync(path.join(dir, 'paid_service_guide.wav'), buffer);
console.log('Successfully generated paid_service_guide.wav at:', path.join(dir, 'paid_service_guide.wav'));
