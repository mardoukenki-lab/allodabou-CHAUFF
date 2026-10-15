const fs = require('fs');
const zlib = require('zlib');

function createPng(width, height, r, g, b) {
  // Simple PNG encoder
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with filter type 0 for each scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);
  
  const cx = width / 2;
  const cy = height / 2;
  const outerR = width * 0.35;
  const innerR = width * 0.28;
  const hubR = width * 0.10;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // No filter

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check if inside steering wheel circle
      const isWheelRim = dist >= innerR && dist <= outerR;
      const isHub = dist <= hubR;
      const isHorizontalSpoke = Math.abs(dy) <= width * 0.03 && dist <= outerR;
      const isVerticalSpoke = Math.abs(dx) <= width * 0.03 && dy >= 0 && dy <= outerR;

      if (isWheelRim || isHub || isHorizontalSpoke || isVerticalSpoke) {
        // Gold / White steering wheel
        if (isHub && dist <= hubR * 0.5) {
          rawData[pxOffset] = 255;     // Gold R
          rawData[pxOffset + 1] = 215; // Gold G
          rawData[pxOffset + 2] = 0;   // Gold B
          rawData[pxOffset + 3] = 255; // Alpha
        } else {
          rawData[pxOffset] = 255;     // White R
          rawData[pxOffset + 1] = 255; // White G
          rawData[pxOffset + 2] = 255; // White B
          rawData[pxOffset + 3] = 255; // Alpha
        }
      } else {
        // Deep Green #0D631B
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(12 + length);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = calculateCrc(Buffer.concat([Buffer.from(type, 'ascii'), data]));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function calculateCrc(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public');
}

// Green #0D631B = 13, 99, 27
fs.writeFileSync('./public/pwa-192x192.png', createPng(192, 192, 13, 99, 27));
fs.writeFileSync('./public/pwa-512x512.png', createPng(512, 512, 13, 99, 27));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createPng(512, 512, 13, 99, 27));
fs.writeFileSync('./public/apple-touch-icon.png', createPng(180, 180, 13, 99, 27));
fs.writeFileSync('./public/favicon.ico', createPng(32, 32, 13, 99, 27));

console.log('Icons generated successfully!');
