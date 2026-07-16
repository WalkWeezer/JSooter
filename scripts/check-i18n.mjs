#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ruPath = path.join(root, 'public/i18n/ru.json');
const enPath = path.join(root, 'public/i18n/en.json');

function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, p, out);
    else out[p] = value;
  }
  return out;
}

const ru = flatten(JSON.parse(fs.readFileSync(ruPath, 'utf8')));
const en = flatten(JSON.parse(fs.readFileSync(enPath, 'utf8')));
const ruKeys = new Set(Object.keys(ru));
const enKeys = new Set(Object.keys(en));

const missingInEn = [...ruKeys].filter((k) => !enKeys.has(k));
const missingInRu = [...enKeys].filter((k) => !ruKeys.has(k));

if (missingInEn.length || missingInRu.length) {
  console.error('i18n key mismatch');
  if (missingInEn.length) console.error('Missing in EN:', missingInEn.join(', '));
  if (missingInRu.length) console.error('Missing in RU:', missingInRu.join(', '));
  process.exit(1);
}

console.log(`i18n OK: ${ruKeys.size} keys match in RU and EN`);
