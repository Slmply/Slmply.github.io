import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECTS_DIR = path.resolve(__dirname, '../src/pages/projects');

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')      // remove non-word chars
    .replace(/\s+/g, '-')          // spaces -> dashes
    .replace(/-+/g, '-');          // collapse multiple dashes
}

function today() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function escapeYaml(str = '') {
  return String(str).replace(/'/g, "''");
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) {
      const key = m[1];
      const val = m[2] !== undefined ? m[2] : argv[i + 1]?.startsWith('--') ? '' : argv[++i];
      args[key] = val ?? '';
    }
  }
  return args;
}

function topicsArrayStr(input) {
  if (!input) return '[]';
  const arr = String(input)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => `'${escapeYaml(s)}'`);
  return `[${arr.join(', ')}]`;
}

async function uniqueFilePath(dir, baseName) {
  let fp = path.join(dir, `${baseName}.md`);
  if (!(await exists(fp))) return fp;
  let i = 2;
  while (await exists(path.join(dir, `${baseName}-${i}.md`))) i++;
  return path.join(dir, `${baseName}-${i}.md`);
}

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

function buildContent({ title, date, description, topics, imageUrl, imageAlt }) {
  const fm = `---
layout: '../../layouts/project-layout.astro'
title: '${escapeYaml(title)}'
pubDate: ${date}
description: '${escapeYaml(description)}'
topics: ${topicsArrayStr(topics)}
image:
    url: '${escapeYaml(imageUrl)}'
    alt: '${escapeYaml(imageAlt)}'
---

## Goals:

1. <!-- Add goals -->

## Reflection:

<!-- Write your reflection here -->
`;
  return fm;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rl = (!args.title) ? readline.createInterface({ input, output }) : null;

  const title = args.title || (await rl.question('Title: '));
  const description = args.description ?? (await (rl?.question('Description (optional): ') ?? ''));
  const topics = args.topics ?? (await (rl?.question('Topics (comma-separated, optional): ') ?? ''));
  const imageUrl = args.image ?? (await (rl?.question('Image URL (optional): ') ?? ''));
  const imageAlt = args.alt ?? (await (rl?.question('Image alt text (optional): ') ?? ''));
  const date = args.date || today();

  rl?.close();

  const slug = args.slug || slugify(title || 'new-post');
  await fs.mkdir(PROJECTS_DIR, { recursive: true });
  const filePath = await uniqueFilePath(PROJECTS_DIR, slug);

  const content = buildContent({ title, date, description, topics, imageUrl, imageAlt });
  await fs.writeFile(filePath, content, 'utf8');

  const rel = path.relative(path.resolve(__dirname, '..'), filePath);
  console.log(`Created ${rel}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});