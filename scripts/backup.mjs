#!/usr/bin/env node
/**
 * Backup dos dados do site (database.sqlite) para a pasta backups/.
 * Uso: npm run backup  |  node scripts/backup.mjs
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = path.join(root, 'database.sqlite');
const outDir = path.join(root, 'backups');

if (!fs.existsSync(dbPath)) {
  console.error('✖ database.sqlite não encontrado em', dbPath);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const pad = (n) => String(n).padStart(2, '0');
const d = new Date();
const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

const sqliteCopy = path.join(outDir, `database-${stamp}.sqlite`);
fs.copyFileSync(dbPath, sqliteCopy);
fs.copyFileSync(dbPath, path.join(outDir, 'latest.sqlite'));

// Dump JSON legível (todas as tabelas)
let jsonPath = null;
let rowsInfo = {};
try {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(dbPath));
  const dump = { exported_at: new Date().toISOString(), source: 'database.sqlite', tables: {} };
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  const names = tables.length ? tables[0].values.map((r) => String(r[0])) : [];
  for (const t of names) {
    const res = db.exec(`SELECT * FROM "${t}"`);
    if (!res.length) {
      dump.tables[t] = [];
      rowsInfo[t] = 0;
      continue;
    }
    const cols = res[0].columns;
    dump.tables[t] = res[0].values.map((row) => {
      const o = {};
      cols.forEach((c, i) => { o[c] = row[i]; });
      return o;
    });
    rowsInfo[t] = dump.tables[t].length;
  }
  jsonPath = path.join(outDir, `dump-${stamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(dump, null, 2), 'utf8');
  fs.writeFileSync(path.join(outDir, 'latest.json'), JSON.stringify(dump, null, 2), 'utf8');
  db.close();
} catch (e) {
  console.warn('⚠ dump JSON falhou (cópia .sqlite ainda foi feita):', e.message);
}

const kb = (p) => Math.round(fs.statSync(p).size / 1024);
console.log('✔ Backup concluído');
console.log('  SQLite:', path.relative(root, sqliteCopy), `(${kb(sqliteCopy)} KB)`);
console.log('  latest:', path.relative(root, path.join(outDir, 'latest.sqlite')));
if (jsonPath) {
  console.log('  JSON:  ', path.relative(root, jsonPath), `(${kb(jsonPath)} KB)`);
  console.log('  Linhas:', Object.entries(rowsInfo).map(([t, n]) => `${t}=${n}`).join(', '));
}
