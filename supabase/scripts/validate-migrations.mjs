import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql'));
const entries = files.map((file) => {
  const match = /^(\d{3})_[a-z0-9][a-z0-9_-]*\.sql$/.exec(file);
  if (!match) throw new Error(`Invalid migration filename: ${file}`);
  return { file, number: Number(match[1]) };
}).sort((a, b) => a.number - b.number);

const seen = new Set();
for (const entry of entries) {
  if (seen.has(entry.number)) {
    throw new Error(`Duplicate migration number: ${String(entry.number).padStart(3, '0')}`);
  }
  seen.add(entry.number);
  const source = await readFile(join(migrationsDir, entry.file), 'utf8');
  if (source.includes('\u0000')) throw new Error(`NUL byte in migration: ${entry.file}`);
  if (!source.trim()) throw new Error(`Empty migration: ${entry.file}`);
}

const gaps = [];
for (let i = 1; i < entries.length; i++) {
  const previous = entries[i - 1].number;
  const current = entries[i].number;
  if (current > previous + 1) gaps.push(`${String(previous).padStart(3, '0')}..${String(current - 1).padStart(3, '0')}`);
}

if (gaps.length) {
  console.warn(`Migration numbering gaps (allowed for removed historical migrations): ${gaps.join(', ')}`);
}
console.log(`Validated ${entries.length} Supabase migrations in deterministic numeric order.`);
