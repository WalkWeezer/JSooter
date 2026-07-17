#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

function sizeOf(dir) {
  let total = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) total += sizeOf(p);
    else total += fs.statSync(p).size;
  }
  return total;
}

const bytes = sizeOf(dist);
const mb = bytes / (1024 * 1024);
const limit = 100;
console.log(`dist size: ${mb.toFixed(2)} MB`);
if (mb >= limit) {
  console.error(`FAIL: exceeds ${limit} MB unzipped limit`);
  process.exit(1);
}
console.log('budget OK');
