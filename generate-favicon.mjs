import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sizes = [16, 32, 48, 64, 180];

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // Document icon: white rounded rectangle with folded corner
  const pad = size * 0.18;
  const w = size - pad * 2;
  const h = size - pad * 2;
  const x = pad;
  const y = pad;
  const fold = w * 0.35;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w - fold, y);
  ctx.lineTo(x + w, y + fold);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();

  // Folded corner detail
  ctx.fillStyle = '#93c5fd';
  ctx.beginPath();
  ctx.moveTo(x + w - fold, y);
  ctx.lineTo(x + w, y + fold);
  ctx.lineTo(x + w - fold, y + fold);
  ctx.closePath();
  ctx.fill();

  // Text lines
  ctx.fillStyle = '#2563eb';
  const lineWidth = w * 0.6;
  const lineHeight = h * 0.12;
  const lineX = x + w * 0.15;
  let lineY = y + h * 0.32;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.roundRect(lineX, lineY, lineWidth, h * 0.08, h * 0.04);
    ctx.fill();
    lineY += lineHeight;
  }

  const buffer = canvas.toPNG();
  const fileName = size === 180 ? 'apple-touch-icon.png' : `favicon-${size}x${size}.png`;
  fs.writeFileSync(path.join(__dirname, fileName), buffer);
});

// Generate .ico (16+32+48)
const Jimp = (await import('jimp')).default;
const images = await Promise.all([
  Jimp.read(path.join(__dirname, 'favicon-16x16.png')),
  Jimp.read(path.join(__dirname, 'favicon-32x32.png')),
  Jimp.read(path.join(__dirname, 'favicon-48x48.png')),
]);

const icoBuffer = await Jimp.createMultiPageImage(images.map(img => ({ bitmap: img.bitmap, ...img })));
fs.writeFileSync(path.join(__dirname, 'favicon.ico'), icoBuffer);

console.log('Favicon files generated in', __dirname);
