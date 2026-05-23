import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const iconDir = join(process.cwd(), "public", "icons");
const sizes = [16, 48, 128];

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

const crcTable = makeCrcTable();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function setPixel(buffer, size, x, y, rgba) {
  if (x < 0 || y < 0 || x >= size || y >= size) {
    return;
  }

  const index = (y * size + x) * 4;
  buffer[index] = rgba[0];
  buffer[index + 1] = rgba[1];
  buffer[index + 2] = rgba[2];
  buffer[index + 3] = rgba[3];
}

function drawCircle(buffer, size, centerX, centerY, radius, rgba) {
  const radiusSquared = radius * radius;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy <= radiusSquared) {
        setPixel(buffer, size, x, y, rgba);
      }
    }
  }
}

function drawLine(buffer, size, startX, startY, endX, endY, thickness, rgba) {
  const steps = Math.max(Math.abs(endX - startX), Math.abs(endY - startY)) * 2;
  for (let step = 0; step <= steps; step += 1) {
    const ratio = steps === 0 ? 0 : step / steps;
    const x = Math.round(startX + (endX - startX) * ratio);
    const y = Math.round(startY + (endY - startY) * ratio);
    drawCircle(buffer, size, x, y, thickness, rgba);
  }
}

function createPng(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const background = [20, 83, 45, 255];
  const white = [255, 255, 255, 255];
  const accent = [250, 204, 21, 255];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      setPixel(pixels, size, x, y, background);
    }
  }

  drawCircle(pixels, size, size * 0.5, size * 0.5, size * 0.35, white);
  drawLine(pixels, size, size * 0.32, size * 0.52, size * 0.45, size * 0.65, size * 0.04, accent);
  drawLine(pixels, size, size * 0.45, size * 0.65, size * 0.7, size * 0.38, size * 0.04, accent);

  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

mkdirSync(iconDir, { recursive: true });
for (const size of sizes) {
  writeFileSync(join(iconDir, `icon${size}.png`), createPng(size));
}
