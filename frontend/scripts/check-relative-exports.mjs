import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const files = [];
const exportMap = new Map();
const issues = [];
const exts = ['.ts', '.tsx'];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function parseExports(code) {
  const named = new Set();
  const hasDefault = /export\s+default\s+/m.test(code);

  for (const match of code.matchAll(/export\s+(?:type\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/g)) named.add(match[1]);
  for (const match of code.matchAll(/export\s+(?:type\s+)?(?:type|const|let|var|class|interface|enum)\s+([A-Za-z0-9_]+)/g)) named.add(match[1]);
  for (const match of code.matchAll(/export\s+(?:type\s+)?\{([\s\S]*?)\}/g)) {
    for (const part of match[1].split(',')) {
      const clean = part.trim();
      if (!clean) continue;
      const alias = clean.match(/([A-Za-z0-9_]+)\s+as\s+([A-Za-z0-9_]+)/);
      named.add(alias ? alias[2] : clean);
    }
  }

  return { named, hasDefault };
}

function resolveImport(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    ...exts.map((ext) => `${base}${ext}`),
    ...exts.map((ext) => path.join(base, `index${ext}`)),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function extractImportStatements(code) {
  return code.match(/(^|\n)\s*import[\s\S]*?;(?=\s*(\n|$))/g) ?? [];
}

function parseImports(code) {
  const imports = [];

  for (const statement of extractImportStatements(code)) {
    const fromMatch = statement.match(/from\s+['"](\.[^'"]+)['"]/);
    if (!fromMatch) continue;

    const specifier = fromMatch[1];
    const clause = statement
      .replace(/^\s*import\s+/, '')
      .replace(/\s+from\s+['"][^'"]+['"];?\s*$/, '')
      .replace(/^type\s+/, '')
      .trim();

    let defaultImport = null;
    const namedImports = [];

    if (clause.startsWith('{')) {
      namedImports.push(...clause.slice(1, -1).split(',').map((part) => part.trim()).filter(Boolean));
    } else if (clause.includes('{')) {
      const braceIndex = clause.indexOf('{');
      defaultImport = clause.slice(0, braceIndex).replace(',', '').trim();
      namedImports.push(...clause.slice(braceIndex + 1, clause.lastIndexOf('}')).split(',').map((part) => part.trim()).filter(Boolean));
    } else if (!clause.startsWith('*')) {
      defaultImport = clause.trim();
    }

    imports.push({ defaultImport, namedImports, specifier });
  }

  return imports;
}

walk(root);
for (const file of files) exportMap.set(file, parseExports(read(file)));

for (const file of files) {
  const imports = parseImports(read(file));

  for (const item of imports) {
    const target = resolveImport(file, item.specifier);
    if (!target) {
      issues.push(`${path.relative(root, file)} -> ${item.specifier}: module introuvable`);
      continue;
    }

    const targetExports = exportMap.get(target);
    if (!targetExports) continue;

    if (item.defaultImport && !targetExports.hasDefault) {
      issues.push(`${path.relative(root, file)} -> ${item.specifier}: export default manquant`);
    }

    for (const raw of item.namedImports) {
      const clean = raw.replace(/^type\s+/, '').trim();
      if (!clean) continue;
      const alias = clean.match(/([A-Za-z0-9_]+)\s+as\s+([A-Za-z0-9_]+)/);
      const importedName = alias ? alias[1] : clean;
      if (!targetExports.named.has(importedName)) {
        issues.push(`${path.relative(root, file)} -> ${item.specifier}: export nommé manquant '${importedName}'`);
      }
    }
  }
}

if (issues.length > 0) {
  console.error('Verification imports/exports echouee:\n');
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`Verification imports/exports OK (${files.length} fichiers).`);


