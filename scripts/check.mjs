#!/usr/bin/env node
/**
 * Sistema anti-erro do Controle de Coletores.
 * Roda automaticamente antes de `npm run dev` (hook predev).
 *
 * O que valida:
 *  1) Sintaxe real de todos os .ts/.tsx (parser do TypeScript, sem typecheck)
 *  2) Declarações duplicadas no nível superior (bug clássico: exportCSV/exportPDF 2x)
 *  3) Balanceamento de { } no index.css (comentários e strings ignorados)
 *
 * Uso manual: node scripts/check.mjs   |   npm run check (inclui tsc)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];

let ts = null;
try {
  ts = require('typescript');
} catch {
  console.error('✖ anti-erro: typescript não encontrado (rode: npm install)');
  process.exit(1);
}

// ── 1) Sintaxe TS/TSX de todos os fontes ──
const tsFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules') walk(p);
    } else if (/\.(ts|tsx)$/.test(e.name)) {
      tsFiles.push(p);
    }
  }
})(path.join(root, 'src'));

for (const file of tsFiles) {
  const rel = path.relative(root, file);
  const text = fs.readFileSync(file, 'utf8');
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  const diags = sf.parseDiagnostics || [];
  for (const d of diags) {
    const pos = d.start != null ? sf.getLineAndCharacterOfPosition(d.start) : { line: 0, character: 0 };
    problems.push(
      `${rel}:${pos.line + 1}:${pos.character + 1} — ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`
    );
  }

  // ── 2) Duplicatas no topo do arquivo (coluna 0) ──
  const topFns = [...text.matchAll(/^(?:export\s+)?function\s+([A-Za-z0-9_$]+)/gm)].map((m) => m[1]);
  const topConsts = [...text.matchAll(/^(?:export\s+)?(?:const|let)\s+([A-Za-z0-9_$]+)\s*(?::[^=\n]+)?=/gm)].map(
    (m) => m[1]
  );
  const counts = {};
  for (const n of [...topFns, ...topConsts]) counts[n] = (counts[n] || 0) + 1;
  for (const [n, c] of Object.entries(counts)) {
    if (c > 1) problems.push(`${rel} — declaração DUPLICADA no topo do arquivo: '${n}' (${c}x)`);
  }
}

// ── 3) CSS: chaves balanceadas ──
const cssFile = path.join(root, 'src/client/index.css');
if (fs.existsSync(cssFile)) {
  const css = fs
    .readFileSync(cssFile, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(["'])((?:\\.|(?!\1).)*)\1/g, '""');
  let depth = 0;
  let line = 1;
  let extraClose = null;
  for (const ch of css) {
    if (ch === '\n') line++;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth < 0 && extraClose == null) extraClose = line;
    }
  }
  if (extraClose != null) problems.push(`src/client/index.css:${extraClose} — '}' sem '{' correspondente`);
  else if (depth > 0) problems.push(`src/client/index.css — ${depth} '{' sem fechar no fim do arquivo`);
}

// ── Resultado ──
if (problems.length) {
  console.error('\n✖ CHECAGEM ANTI-ERRO FALHOU — corrija antes de continuar:\n');
  for (const p of problems) console.error('  • ' + p);
  console.error('');
  process.exit(1);
}
console.log(`✔ Anti-erro OK — ${tsFiles.length} arquivos TS/TSX válidos · declarações únicas · CSS balanceado`);
