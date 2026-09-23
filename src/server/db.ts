import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../../database.sqlite');

let db: Database;
let _autoSave = true;

export function setAutoSave(v: boolean) { _autoSave = v; }

export async function getDb(): Promise<Database> {
  if (!db) {
    const SQL = await initSqlJs();
    if (fs.existsSync(DB_PATH)) {
      db = new SQL.Database(fs.readFileSync(DB_PATH));
    } else {
      db = new SQL.Database();
    }
    db.run(`CREATE TABLE IF NOT EXISTS coletores (
      id TEXT PRIMARY KEY, nome TEXT NOT NULL, modelo TEXT NOT NULL, numero_serie TEXT UNIQUE NOT NULL,
      responsavel TEXT NOT NULL, departamento TEXT, status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo','inativo','manutencao')),
      bateria INTEGER DEFAULT 100, localizacao TEXT, imagem TEXT, contrato TEXT, created_at TEXT, updated_at TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS observacoes (
      id TEXT PRIMARY KEY, coletor_id TEXT NOT NULL, titulo TEXT NOT NULL, descricao TEXT NOT NULL,
      causas TEXT, solucao TEXT, gravidade TEXT DEFAULT 'media' CHECK(gravidade IN ('alta','media','baixa')),
      created_at TEXT, FOREIGN KEY (coletor_id) REFERENCES coletores(id) ON DELETE CASCADE
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY, nome TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      cargo TEXT DEFAULT 'Operador', status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo','inativo')),
      departamento TEXT, senha TEXT, foto TEXT, created_at TEXT, updated_at TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS historico (
      id TEXT PRIMARY KEY, coletor_id TEXT NOT NULL, acao TEXT NOT NULL,
      campo TEXT, valor_antigo TEXT, valor_novo TEXT, created_at TEXT,
      FOREIGN KEY (coletor_id) REFERENCES coletores(id) ON DELETE CASCADE
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS user_config (
      user_id TEXT PRIMARY KEY, config TEXT NOT NULL, updated_at TEXT,
      FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS sessoes (
      token TEXT PRIMARY KEY, user_id TEXT NOT NULL, exp INTEGER NOT NULL
    )`);
    // Migração: adiciona coluna senha se não existir (banco antigo)
    try {
      const cols = db.exec("PRAGMA table_info(usuarios)");
      const hasSenha = cols.length && cols[0].columns.includes('senha');
      if (!hasSenha) db.run("ALTER TABLE usuarios ADD COLUMN senha TEXT");
    } catch { /* ignore */ }
    // Migração: contrato PDF no coletor
    try {
      const cols = db.exec("PRAGMA table_info(coletores)");
      const hasContrato = cols.length && cols[0].columns.includes('contrato');
      if (!hasContrato) db.run("ALTER TABLE coletores ADD COLUMN contrato TEXT");
    } catch { /* ignore */ }
    // Migração: foto de perfil do usuário
    try {
      const cols = db.exec("PRAGMA table_info(usuarios)");
      const hasFoto = cols.length && cols[0].columns.includes('foto');
      if (!hasFoto) db.run("ALTER TABLE usuarios ADD COLUMN foto TEXT");
    } catch { /* ignore */ }
    save();
  }
  return db;
}

export function save() {
  if (db) fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

export function query<T = any>(sql: string, params: any[] = []): T[] {
  const result = db.exec(sql, params);
  if (!result.length) return [];
  const cols = result[0].columns;
  return result[0].values.map((row: any[]) => {
    const obj: any = {};
    cols.forEach((c: any, i: number) => { obj[c] = row[i]; });
    return obj as T;
  });
}

export function run(sql: string, params: any[] = []) {
  db.run(sql, params);
  if (_autoSave) save();
}
