#!/usr/bin/env node

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const orderIds = process.argv.slice(2);

if (orderIds.length === 0) {
  console.log('Usage: node generate-qr.js <order-id> [order-id2] [order-id3] ...');
  console.log('Example: node generate-qr.js 1 2 3 4 5');
  console.log('');
  console.log('QR codes will be saved to current directory');
  process.exit(1);
}

const outputDir = process.cwd();

console.log(`Generating ${orderIds.length} QR code(s)...\n`);

Promise.all(
  orderIds.map(async (orderId) => {
    const outputPath = path.join(outputDir, `order-${orderId}.png`);

    try {
      await QRCode.toFile(outputPath, orderId, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      console.log(`✓ Generated: order-${orderId}.png`);
    } catch (err) {
      console.error(`✗ Failed to generate QR for ${orderId}:`, err.message);
    }
  })
).then(() => {
  console.log(`\nDone! QR codes saved to: ${outputDir}`);
});
