#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const release = path.join(root, 'release');
fs.mkdirSync(release, { recursive: true });

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/index.html missing — run npm run build first');
  process.exit(1);
}

const out = path.join(release, 'neontron-yandex.zip');
if (fs.existsSync(out)) fs.unlinkSync(out);

execSync(`cd "${dist}" && zip -r "${out}" . -x "*.map"`, { stdio: 'inherit' });
const mb = fs.statSync(out).size / (1024 * 1024);
console.log(`packed ${out} (${mb.toFixed(2)} MB zip)`);
