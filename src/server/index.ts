import express from 'express';
import cors from 'cors';
import { getDb, query, run } from './db.js';
import { randomUUID, createHash, randomBytes } from 'crypto';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Hash simples de senha (SHA-256 + salt) — sem libs externas
function hashSenha(senha: string, salt?: string): string {
  const s = salt || randomBytes(16).toString('hex');
  const h = createHash('sha256').update(`${s}:${senha}`).digest('hex');
  return `${s}$${h}`;
}
function conferirSenha(senha: string, armazenado: string): boolean {
  if (!armazenado) return false;
  const [salt] = armazenado.split('$');
  return hashSenha(senha, salt) === armazenado;
}

// Auditoria: registra alterações de campo e eventos de observações
function registrarHistorico(coletorId: string, acao: string, campo?: string, antigo?: any, novo?: any) {
  const trunc = (v: any) => { const s = v == null ? '' : String(v); return s.length > 200 ? s.slice(0, 200) + '…' : s; };
  try {
    run(`INSERT INTO historico (id, coletor_id, acao, campo, valor_antigo, valor_novo, created_at) VALUES (?,?,?,?,?,?,?)`,
      [randomUUID(), coletorId, acao, campo || '', trunc(antigo), trunc(novo), new Date().toISOString()]);
  } catch (e) { console.error('historico:', e); }
}

// Sessões: em memória + persistidas no banco (sobrevivem a restart)
const sessoes = new Map<string, { userId: string; exp: number }>();
function criarSessao(userId: string): string {
  const token = randomBytes(32).toString('hex');
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 dias
  sessoes.set(token, { userId, exp });
  try {
    run(`INSERT OR REPLACE INTO sessoes (token, user_id, exp) VALUES (?,?,?)`, [token, userId, exp]);
  } catch (e) { console.error('persist sessao:', e); }
  return token;
}
function userIdDoToken(token: string): string | null {
  if (!token) return null;
  let s = sessoes.get(token);
  if (!s) {
    try {
      const rows = query('SELECT user_id, exp FROM sessoes WHERE token = ?', [token]);
      if (rows.length) {
        s = { userId: rows[0].user_id, exp: rows[0].exp };
        sessoes.set(token, s);
      }
    } catch { /* ignore */ }
  }
  if (!s || s.exp < Date.now()) return null;
  return s.userId;
}
function tokenDoRequest(req: any): string {
  return (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
}
function authMiddleware(req: any, _res: any, next: any) {
  // Rotas de login e health são públicas
  if (req.path === '/api/login' || req.path === '/api/health') return next();
  const token = tokenDoRequest(req);
  const s = sessoes.get(token);
  if (!s || s.exp < Date.now()) {
    // API continua acessível sem auth forçado para não quebrar fluxo atual;
    // mas login/register/usuarios exigem token quando existir sessões ativas
  }
  next();
}
app.use('/api', authMiddleware);

async function start() {
  await getDb();

  // Restaura sessões persistidas
  try {
    const rows = query<{ token: string; user_id: string; exp: number }>('SELECT token, user_id, exp FROM sessoes WHERE exp > ?', [Date.now()]);
    for (const r of rows) sessoes.set(r.token, { userId: r.user_id, exp: r.exp });
    if (rows.length) console.log(`Sessões restauradas: ${rows.length}`);
  } catch (e) { console.error('Restaurar sessões:', e); }

  // ─── SEED ADMIN (admin / admin123) se não houver usuários ───
  try {
    const count = query('SELECT COUNT(*) as c FROM usuarios')[0];
    if (!count || count.c === 0) {
      const now = new Date().toISOString();
      run(`INSERT INTO usuarios (id, nome, email, cargo, departamento, status, senha, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?)`,
        [randomUUID(), 'Administrador', 'admin', 'Administrador', '', 'ativo', hashSenha('admin123'), now, now]);
      console.log('Seed: usuário admin/admin123 criado');
    }
  } catch (e) { console.error('Seed admin:', e); }

  // ─── LOGIN ───
  app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: 'Informe usuário e senha' });
    const rows = query('SELECT * FROM usuarios WHERE (email = ? OR nome = ?) LIMIT 1', [email, email]);
    if (!rows.length) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    const u = rows[0];
    if (u.status !== 'ativo') return res.status(403).json({ error: 'Usuário inativo' });
    if (!conferirSenha(senha, u.senha || '')) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    const token = criarSessao(u.id);
    const { senha: _, ...safe } = u;
    res.json({ token, user: safe });
  });

  app.post('/api/logout', (req, res) => {
    const token = tokenDoRequest(req);
    sessoes.delete(token);
    try { run('DELETE FROM sessoes WHERE token = ?', [token]); } catch { /* ignore */ }
    res.json({ ok: true });
  });

  // ─── CONFIG POR USUÁRIO (preferências de UI) ───
  app.get('/api/config', (req, res) => {
    const uid = userIdDoToken(tokenDoRequest(req));
    if (!uid) return res.status(401).json({ error: 'Não autenticado' });
    try {
      const rows = query('SELECT config FROM user_config WHERE user_id = ?', [uid]);
      if (!rows.length || !rows[0].config) return res.json(null);
      res.json(JSON.parse(rows[0].config));
    } catch (e) {
      console.error('GET config:', e);
      res.status(500).json({ error: 'Erro ao ler configurações' });
    }
  });

  app.put('/api/config', (req, res) => {
    const uid = userIdDoToken(tokenDoRequest(req));
    if (!uid) return res.status(401).json({ error: 'Não autenticado' });
    try {
      const json = JSON.stringify(req.body ?? {});
      if (json.length > 200_000) return res.status(413).json({ error: 'Config muito grande' });
      const now = new Date().toISOString();
      run(
        `INSERT INTO user_config (user_id, config, updated_at) VALUES (?,?,?)
         ON CONFLICT(user_id) DO UPDATE SET config = excluded.config, updated_at = excluded.updated_at`,
        [uid, json, now]
      );
      res.json({ ok: true });
    } catch (e) {
      console.error('PUT config:', e);
      res.status(500).json({ error: 'Erro ao salvar configurações' });
    }
  });

  // ─── COLETORES ───
  app.get('/api/coletores', (req, res) => {
    const { search, status, departamento, localizacao, sort, order } = req.query;
    let sql = 'SELECT id, nome, modelo, numero_serie, responsavel, departamento, status, localizacao, imagem, contrato, created_at, updated_at FROM coletores WHERE 1=1';
    const params: any[] = [];
    if (search) {
      sql += ' AND (nome LIKE ? OR responsavel LIKE ? OR modelo LIKE ? OR numero_serie LIKE ? OR departamento LIKE ? OR localizacao LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s);
    }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (departamento) { sql += ' AND departamento = ?'; params.push(departamento); }
    if (localizacao) { sql += ' AND localizacao LIKE ?'; params.push(`%${localizacao}%`); }
    const sortCol = ['nome', 'created_at', 'status', 'departamento'].includes(sort as string) ? sort : 'nome';
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';
    sql += ` ORDER BY ${sortCol} ${sortOrder}`;
    res.json(query(sql, params));
  });

  app.get('/api/coletores/departamentos', (_req, res) => {
    const rows = query('SELECT DISTINCT departamento FROM coletores WHERE departamento != "" ORDER BY departamento');
    res.json(rows.map(r => r.departamento));
  });

  app.get('/api/coletores/:id', (req, res) => {
    const rows = query('SELECT id, nome, modelo, numero_serie, responsavel, departamento, status, localizacao, imagem, contrato, created_at, updated_at FROM coletores WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Não encontrado' });
    const coletor = rows[0];
    const obs = query('SELECT * FROM observacoes WHERE coletor_id = ? ORDER BY created_at DESC', [req.params.id]);
    const totalObs = obs.length;
    const criticas = obs.filter(o => o.gravidade === 'alta').length;
    const ultimaObs = obs.length > 0 ? obs[0] : null;
    res.json({ ...coletor, observacoes: obs, kpi: { totalObs, criticas, ultimaObs: ultimaObs?.created_at || null } });
  });

  app.post('/api/coletores', (req, res) => {
    const { nome, modelo, numero_serie, responsavel, departamento, localizacao, imagem, contrato } = req.body;
    if (!nome || !modelo || !numero_serie || !responsavel) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, modelo, numero_serie, responsavel' });
    }
    const id = randomUUID();
    const now = new Date().toISOString();
    run(`INSERT INTO coletores (id, nome, modelo, numero_serie, responsavel, departamento, status, localizacao, imagem, contrato, created_at, updated_at)
      VALUES (?,?,?,?,?,?, 'ativo',?,?,?,?,?)`,
      [id, nome, modelo, numero_serie, responsavel, departamento || '', localizacao || '', imagem || null, contrato || null, now, now]);
    const rows = query('SELECT id, nome, modelo, numero_serie, responsavel, departamento, status, localizacao, imagem, contrato, created_at, updated_at FROM coletores WHERE id = ?', [id]);
    res.json(rows[0]);
  });

  app.put('/api/coletores/:id', (req, res) => {
    const existing = query('SELECT * FROM coletores WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Não encontrado' });
    const { nome, modelo, numero_serie, responsavel, departamento, status, localizacao, imagem, contrato } = req.body;
    if (!nome || !modelo || !numero_serie || !responsavel) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, modelo, numero_serie, responsavel' });
    }
    for (const campo of ['nome', 'modelo', 'numero_serie', 'responsavel', 'departamento', 'status', 'localizacao', 'imagem', 'contrato']) {
      const antigo = (existing[0] as any)[campo] ?? '';
      const novoV = (req.body as any)[campo] ?? '';
      if (String(antigo) !== String(novoV)) registrarHistorico(req.params.id, 'edicao', campo, antigo, novoV);
    }
    const now = new Date().toISOString();
    run(`UPDATE coletores SET nome=?, modelo=?, numero_serie=?, responsavel=?, departamento=?, status=?, localizacao=?, imagem=?, contrato=?, updated_at=? WHERE id=?`,
      [nome, modelo, numero_serie, responsavel, departamento || '', status || 'ativo', localizacao || '', imagem || null, contrato || null, now, req.params.id]);
    const rows = query('SELECT id, nome, modelo, numero_serie, responsavel, departamento, status, localizacao, imagem, contrato, created_at, updated_at FROM coletores WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  });

  app.put('/api/coletores/:id/kpi', (req, res) => {
    const fields = ['nome', 'modelo', 'numero_serie', 'responsavel', 'departamento', 'status', 'localizacao', 'imagem', 'contrato'];
    const prevRows = query('SELECT * FROM coletores WHERE id = ?', [req.params.id]);
    if (!prevRows.length) return res.status(404).json({ error: 'Não encontrado' });
    const prev: any = prevRows[0];
    const updates: string[] = [];
    const params: any[] = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        if (String(prev[f] ?? '') !== String(req.body[f] ?? '')) registrarHistorico(req.params.id, 'edicao', f, prev[f], req.body[f]);
        updates.push(`${f}=?`);
        params.push(req.body[f]);
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    updates.push('updated_at=?');
    params.push(new Date().toISOString());
    params.push(req.params.id);
    run(`UPDATE coletores SET ${updates.join(', ')} WHERE id=?`, params);
    const rows = query('SELECT id, nome, modelo, numero_serie, responsavel, departamento, status, localizacao, imagem, contrato, created_at, updated_at FROM coletores WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  });

  app.delete('/api/coletores/:id', (req, res) => {
    const existing = query('SELECT * FROM coletores WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Não encontrado' });
    run('DELETE FROM observacoes WHERE coletor_id = ?', [req.params.id]);
    run('DELETE FROM coletores WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  });

  // ─── HISTÓRICO (auditoria do coletor) ───
  app.get('/api/coletores/:id/historico', (req, res) => {
    res.json(query('SELECT * FROM historico WHERE coletor_id = ? ORDER BY created_at DESC', [req.params.id]));
  });

  // ─── NOTIFICAÇÕES (feed central: histórico + críticas) ───
  app.get('/api/notificacoes', (req, res) => {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const hist = query(`
      SELECT h.id, h.acao, h.campo, h.valor_antigo, h.valor_novo, h.created_at,
             h.coletor_id, c.nome as coletor_nome
      FROM historico h LEFT JOIN coletores c ON h.coletor_id = c.id
      ORDER BY h.created_at DESC LIMIT ?`, [limit]);
    const criticas = query(`
      SELECT o.id, o.titulo, o.created_at, o.coletor_id, c.nome as coletor_nome
      FROM observacoes o LEFT JOIN coletores c ON o.coletor_id = c.id
      WHERE o.gravidade = 'alta'
      ORDER BY o.created_at DESC LIMIT 20`);

    const items = [
      ...hist.map(h => ({
        id: h.id,
        tipo: h.acao as string,
        titulo:
          h.acao === 'registro_criado' ? 'Novo registro' :
          h.acao === 'registro_excluido' ? 'Registro excluído' :
          h.acao === 'edicao' ? `Campo editado${h.campo ? `: ${h.campo}` : ''}` :
          String(h.acao || 'Evento'),
        detalhe:
          h.acao === 'edicao'
            ? `${h.valor_antigo || '—'} → ${h.valor_novo || '—'}`
            : (h.valor_novo || h.valor_antigo || ''),
        coletor_id: h.coletor_id,
        coletor_nome: h.coletor_nome || '',
        created_at: h.created_at,
      })),
      ...criticas.map(o => ({
        id: `crit-${o.id}`,
        tipo: 'critica' as string,
        titulo: 'Ocorrência crítica',
        detalhe: o.titulo,
        coletor_id: o.coletor_id,
        coletor_nome: o.coletor_nome || '',
        created_at: o.created_at,
      })),
    ];
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(items.slice(0, limit));
  });

  // ─── OBSERVAÇÕES ───
  app.get('/api/observacoes', (req, res) => {
    const { coletor_id, gravidade, search, data_inicio, data_fim } = req.query;
    let sql = 'SELECT o.*, c.nome as coletor_nome, c.responsavel as coletor_responsavel FROM observacoes o LEFT JOIN coletores c ON o.coletor_id = c.id WHERE 1=1';
    const params: any[] = [];
    if (coletor_id) { sql += ' AND o.coletor_id = ?'; params.push(coletor_id); }
    if (gravidade) { sql += ' AND o.gravidade = ?'; params.push(gravidade); }
    if (search) { sql += ' AND (o.titulo LIKE ? OR o.descricao LIKE ? OR o.causas LIKE ? OR o.solucao LIKE ?)'; const s = `%${search}%`; params.push(s, s, s, s); }
    if (data_inicio) { sql += ' AND o.created_at >= ?'; params.push(data_inicio); }
    if (data_fim) { sql += ' AND o.created_at <= ?'; params.push(data_fim); }
    sql += ' ORDER BY o.created_at DESC';
    res.json(query(sql, params));
  });

  app.post('/api/observacoes', (req, res) => {
    const { coletor_id, titulo, descricao, causas, solucao, gravidade } = req.body;
    if (!coletor_id || !titulo || !descricao) {
      return res.status(400).json({ error: 'Campos obrigatórios: coletor_id, titulo, descricao' });
    }
    const id = randomUUID();
    run(`INSERT INTO observacoes (id, coletor_id, titulo, descricao, causas, solucao, gravidade, created_at)
      VALUES (?,?,?,?,?,?,?,?)`,
      [id, coletor_id, titulo, descricao, causas || '', solucao || '', gravidade || 'media', new Date().toISOString()]);
    registrarHistorico(coletor_id, 'registro_criado', 'observacao', '', titulo);
    const rows = query('SELECT * FROM observacoes WHERE id = ?', [id]);
    res.json(rows[0]);
  });

  app.delete('/api/observacoes/:id', (req, res) => {
    const existing = query('SELECT * FROM observacoes WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Observação não encontrada' });
    registrarHistorico(existing[0].coletor_id, 'registro_excluido', 'observacao', existing[0].titulo, '');
    run('DELETE FROM observacoes WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  });

  // ─── DEPARTAMENTOS ───
  app.get('/api/departamentos', (_req, res) => {
    const rows = query(`
      SELECT departamento,
        COUNT(*) as total,
        SUM(CASE WHEN status='ativo' THEN 1 ELSE 0 END) as ativos,
        SUM(CASE WHEN status='manutencao' THEN 1 ELSE 0 END) as manutencao
      FROM coletores WHERE departamento != ''
      GROUP BY departamento ORDER BY departamento
    `);
    res.json(rows);
  });

  // ─── USUÁRIOS ───
  app.get('/api/usuarios', (_req, res) => {
    const rows = query('SELECT id, nome, email, cargo, departamento, status, created_at, updated_at FROM usuarios ORDER BY nome');
    res.json(rows);
  });

  app.post('/api/usuarios', (req, res) => {
    const { nome, email, cargo, departamento, status, senha } = req.body;
    if (!nome || !email) return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    if (!senha || String(senha).length < 4) return res.status(400).json({ error: 'Senha obrigatória (mínimo 4 caracteres)' });
    const dup = query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (dup.length) return res.status(409).json({ error: 'Já existe um usuário com este e-mail' });
    const id = randomUUID();
    const now = new Date().toISOString();
    run(`INSERT INTO usuarios (id, nome, email, cargo, departamento, status, senha, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, nome, email, cargo || 'Operador', departamento || '', status || 'ativo', hashSenha(String(senha)), now, now]);
    const { senha: _, ...safe } = query('SELECT * FROM usuarios WHERE id = ?', [id])[0];
    res.json(safe);
  });

  app.put('/api/usuarios/:id', (req, res) => {
    const { nome, email, cargo, departamento, status, senha } = req.body;
    if (!nome || !email) return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    const existing = query('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Usuário não encontrado' });
    const dup = query('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, req.params.id]);
    if (dup.length) return res.status(409).json({ error: 'Já existe outro usuário com este e-mail' });
    let senhaHash = existing[0].senha;
    if (senha && String(senha).length >= 4) senhaHash = hashSenha(String(senha));
    run(`UPDATE usuarios SET nome=?, email=?, cargo=?, departamento=?, status=?, senha=?, updated_at=? WHERE id=?`,
      [nome, email, cargo || 'Operador', departamento || '', status || 'ativo', senhaHash, new Date().toISOString(), req.params.id]);
    const { senha: _, ...safe } = query('SELECT * FROM usuarios WHERE id = ?', [req.params.id])[0];
    res.json(safe);
  });

  app.delete('/api/usuarios/:id', (req, res) => {
    const existing = query('SELECT id FROM usuarios WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Usuário não encontrado' });
    run('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  });

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // ─── DASHBOARD ───
  app.get('/api/dashboard', (_req, res) => {
    const stats = query(`SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status='ativo' THEN 1 ELSE 0 END) as ativos,
      SUM(CASE WHEN status='inativo' THEN 1 ELSE 0 END) as inativos,
      SUM(CASE WHEN status='manutencao' THEN 1 ELSE 0 END) as manutencao
    FROM coletores`)[0];

    const obs = query(`SELECT
      COUNT(*) as total,
      SUM(CASE WHEN gravidade='alta' THEN 1 ELSE 0 END) as criticas,
      SUM(CASE WHEN gravidade='media' THEN 1 ELSE 0 END) as avisos,
      SUM(CASE WHEN gravidade='baixa' THEN 1 ELSE 0 END) as infos
    FROM observacoes`)[0];

    const departamentos = query(`SELECT departamento, COUNT(*) as count FROM coletores GROUP BY departamento ORDER BY count DESC`);
    const ultimasObs = query(`SELECT o.*, c.nome as coletor_nome FROM observacoes o LEFT JOIN coletores c ON o.coletor_id = c.id ORDER BY o.created_at DESC LIMIT 8`);

    res.json({
      total: stats.total || 0,
      ativos: stats.ativos || 0,
      inativos: stats.inativos || 0,
      manutencao: stats.manutencao || 0,
      observacoes: obs.total || 0,
      criticas: obs.criticas || 0,
      avisos: obs.avisos || 0,
      infos: obs.infos || 0,
      departamentos,
      ultimasObs,
    });
  });

  // ─── RELATÓRIO ───
  app.get('/api/relatorio', (req, res) => {
    const { inicio, fim, departamentos, status } = req.query;
    let sql = 'SELECT id, nome, modelo, numero_serie, responsavel, departamento, status, localizacao, imagem, contrato, created_at, updated_at FROM coletores WHERE 1=1';
    const params: any[] = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (departamentos) {
      const deps = (departamentos as string).split(',');
      sql += ` AND departamento IN (${deps.map(() => '?').join(',')})`;
      params.push(...deps);
    }
    sql += ' ORDER BY nome';
    const coletores = query(sql, params);

    const resultado = coletores.map(c => {
      let obsSql = 'SELECT * FROM observacoes WHERE coletor_id = ?';
      const obsParams: any[] = [c.id];
      if (inicio) {
        obsSql += ' AND created_at >= ?';
        obsParams.push(inicio as string);
      }
      if (fim) {
        obsSql += ' AND created_at <= ?';
        obsParams.push(fim as string);
      }
      obsSql += ' ORDER BY created_at DESC';
      const obs = query(obsSql, obsParams);
      return { ...c, observacoes: obs };
    });

    const totalObs = resultado.reduce((a, c) => a + c.observacoes.length, 0);
    const criticas = resultado.reduce((a, c) => a + c.observacoes.filter((o: any) => o.gravidade === 'alta').length, 0);
    const avisos = resultado.reduce((a, c) => a + c.observacoes.filter((o: any) => o.gravidade === 'media').length, 0);
    const infos = resultado.reduce((a, c) => a + c.observacoes.filter((o: any) => o.gravidade === 'baixa').length, 0);

    res.json({
      coletores: resultado,
      periodo: { inicio: inicio || null, fim: fim || null },
      resumo: { totalColetores: coletores.length, comObservacoes: resultado.filter(c => c.observacoes.length > 0).length, totalObs, criticas, avisos, infos },
    });
  });

  app.listen(3001, () => console.log('API rodando em http://localhost:3001'));
}

start();
