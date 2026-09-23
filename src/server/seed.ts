import { getDb, run, query, setAutoSave, save } from './db.js';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const zebraImg = readFileSync(join(__dirname, '../../public/zebra-tc52.png')).toString('base64');
const zebraDataUri = `data:image/png;base64,${zebraImg}`;

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 12) + 7, Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
}

const OBS_TEMPLATES = [
  { titulo: 'Leitor de barcode lento', causas: 'Software - engine de decodificação antigo', solucao: 'Atualizar Zebra DataWedge', gravidade: 'media' },
  { titulo: 'GPS com precisão baixa', causas: 'Hardware - antena GPS com mau contato', solucao: 'Reposicionar antena e verificar cabo', gravidade: 'media' },
  { titulo: 'Vibração anormal', causas: 'Hardware - motor de vibração solto', solucao: 'Reapertar ou substituir motor', gravidade: 'media' },
  { titulo: 'Cinto rasgado', causas: 'Hardware - desgaste natural', solucao: 'Substituir cinto de segurança', gravidade: 'baixa' },
  { titulo: 'Software lento na inicialização', causas: 'Software - muitos apps em background', solucao: 'Desinstalar apps desnecessários', gravidade: 'baixa' },
  { titulo: 'Limpeza de contatos', causas: 'Hardware - oxidação nos contatos', solucao: 'Limpeza realizada com álcool isopropílico', gravidade: 'baixa' },
  { titulo: 'Reparo na antena', causas: 'Conexão - mau contato', solucao: 'Sinal Wi-Fi restaurado', gravidade: 'media' },
  { titulo: 'Tela não responde ao toque', causas: 'Hardware - digitizer com defeito', solucao: 'Substituir módulo de touch screen', gravidade: 'alta' },
  { titulo: 'Manutenção preventiva', causas: 'Preventiva - agendada', solucao: 'Próxima revisão em 90 dias', gravidade: 'baixa' },
  { titulo: 'Leitura lenta de código', causas: 'Software - firmware desatualizado', solucao: 'Atualizar firmware para versão mais recente', gravidade: 'media' },
  { titulo: 'NFC não detecta tags', causas: 'Software - driver NFC desabilitado', solucao: 'Reativar módulo NFC no sistema', gravidade: 'media' },
  { titulo: 'Carregador não funciona', causas: 'Hardware - porta USB com oxidação', solucao: 'Limpar porta USB com álcool isopropílico', gravidade: 'media' },
  { titulo: 'Não conecta Wi-Fi', causas: 'Conexão - driver de placa de rede incompatível', solucao: 'Reverter driver ou substituir placa de rede', gravidade: 'alta' },
  { titulo: 'Scanner não lê código 2D', causas: 'Software - módulo de leitura 2D desabilitado', solucao: 'Reativar módulo via configuração', gravidade: 'alta' },
  { titulo: 'Superaquecimento', causas: 'Hardware - ventilação obstruída por poeira', solucao: 'Limpar ventilador e verificar pasta térmica', gravidade: 'alta' },
  { titulo: 'Tecla não responde', causas: 'Hardware - contato interno oxidado', solucao: 'Limpar contatos ou substituir teclado', gravidade: 'media' },
  { titulo: 'Display com manchas escuras', causas: 'Hardware - pressão excessiva no display', solucao: 'Substituir módulo de display completo', gravidade: 'media' },
  { titulo: 'Erro 0x4F no boot', causas: 'Software - corrompimento do sistema', solucao: 'Reinstalar firmware via Zebra DNA', gravidade: 'alta' },
  { titulo: 'Aplicativo trava frequentemente', causas: 'Software - memória RAM insuficiente', solucao: 'Atualizar firmware e limpar cache', gravidade: 'media' },
  { titulo: 'Queda de conexão Wi-Fi frequente', causas: 'Conexão - antena Wi-Fi com mau contato', solucao: 'Verificar e reapertar conector da antena', gravidade: 'alta' },
  { titulo: 'Scanner lê código errado', causas: 'Software - decodificação incorreta', solucao: 'Recalibrar scanner e atualizar firmware', gravidade: 'alta' },
  { titulo: 'Bluetooth não conecta', causas: 'Conexão - driver BT incompatível', solucao: 'Atualizar driver Bluetooth', gravidade: 'media' },
  { titulo: 'Armazenamento interno cheio', causas: 'Software - cache acumulado', solucao: 'Limpar dados do cache e logs antigos', gravidade: 'media' },
  { titulo: 'Volume do buzzer baixo', causas: 'Hardware - alto-falante com desgaste', solucao: 'Substituir módulo de áudio', gravidade: 'baixa' },
  { titulo: 'Gancheira solta', causas: 'Hardware - desgaste da mola de trava', solucao: 'Substituir mecanismo de trava', gravidade: 'media' },
  { titulo: 'App de coleta não abre', causas: 'Software - crash na inicialização', solucao: 'Reinstalar aplicativo de coleta', gravidade: 'alta' },
  { titulo: 'Carregamento intermitente', causas: 'Hardware - cabo ou porta com mau contato', solucao: 'Trocar cabo e limpar porta USB', gravidade: 'media' },
  { titulo: 'Bateria não retém carga', causas: 'Hardware - bateria com ciclo de vida esgotado', solucao: 'Substituir bateria', gravidade: 'alta' },
  { titulo: 'Módulo RFID falhando', causas: 'Hardware - módulo com defeito', solucao: 'Realizar calibração ou substituir módulo', gravidade: 'media' },
  { titulo: 'Erro de leitura intermitente', causas: 'Software - cache de leitura corrompido', solucao: 'Limpar cache e reiniciar', gravidade: 'media' },
];

const DESCRICOES: Record<string, string[]> = {
  'Leitor de barcode lento': ['Decodificação com 3s de atraso', 'Lentidão em códigos longos', 'Performance piorou pós-update'],
  'GPS com precisão baixa': ['Divergência de 30 metros', 'Localização instável', 'Sem sinal em área aberta'],
  'Vibração anormal': ['Vibração forte e contínua', 'Motor faz ruído estranho', 'Vibração fraca no alerta'],
  'Cinto rasgado': ['Furo no meio do cinto', 'Costura desfeita na ponta', 'Material rachado por sol'],
  'Software lento na inicialização': ['Demora 2 minutos para ficar pronto', 'Boot lento após atualização', 'Splash screen por tempo excessivo'],
  'Limpeza de contatos': ['Contatos do carregador limpos com álcool isopropílico.', 'Limpeza realizada na oficina', 'Contatos oxidados removidos'],
  'Reparo na antena': ['Antena Wi-Fi reposicionada e conector apertado.', 'Conector da antena reencaixado', 'Antena realinhada'],
  'Tela não responde ao toque': ['Toques não registrados na borda', 'Gestos multitoque falham', 'Lentidão no toque'],
  'Manutenção preventiva': ['Troca de filtro e limpeza geral realizada.', 'Preventiva conforme agendamento', 'Revisão de 90 dias concluída'],
  'Leitura lenta de código': ['ISBN demora mais que EAN-13', 'Lentidão pós-atualização', 'Decodificação com atraso'],
  'NFC não detecta tags': ['Tag MIFARE não lê', 'NFC desativou após update', 'Detecção intermitente'],
  'Carregador não funciona': ['LED de carga não acende', 'Cabo não é reconhecido', 'Carrega muito lentamente'],
  'Não conecta Wi-Fi': ['Não detecta redes 5GHz', 'Conecta mas cai imediatamente', 'Solicita senha infinitamente'],
  'Scanner não lê código 2D': ['QR Code não decodifica', 'Data Matrix com erro de leitura', 'Código 2D lê parcialmente'],
  'Superaquecimento': ['Esquenta após 30min de uso', 'Display fica quente ao toque', 'Desliga por proteção térmica'],
  'Tecla não responde': ['F4 não funciona', 'Tecla Enter com atraso', 'Setas direcionais intermitentes'],
  'Display com manchas escuras': ['Mancha escura no canto superior direito', '3 manchas espalhadas no display', 'Mancha crescente após 2 meses de uso'],
  'Erro 0x4F no boot': ['Tela azul com código 0x4F', 'Trava na inicialização', 'Reinicia automaticamente'],
  'Aplicativo trava frequentemente': ['Trava ao salvar inventário', 'Fecha sozinho a cada 10 minutos', 'Tela congelada por 30 segundos'],
  'Queda de conexão Wi-Fi frequente': ['Desconecta 5x por hora', 'Só funciona perto do AP', 'Rota instável'],
  'Scanner lê código errado': ['Troca caracteres 0/O', 'Lê código lateral incorreto', 'Decodificação parcial'],
  'Bluetooth não conecta': ['Emparelha mas não transmite', 'Perde conexão a cada 5min', 'Não detecta dispositivo'],
  'Armazenamento interno cheio': ['"Sem espaço" ao salvar scan', '4GB de cache acumulado', 'Não instala atualizações'],
  'Volume do buzzer baixo': ['Alerta sonoro quase inaudível', 'Buzzer fraco em ambiente barulhento', 'Volume caiu gradualmente'],
  'Gancheira solta': ['Gancho inferior não trava', 'Cai do suporte constantemente', 'Mola interna quebrada'],
  'App de coleta não abre': ['Tela fecha sozinha ao abrir', 'Erro em branco no boot do app', 'App fecha ao logar'],
  'Carregamento intermitente': ['Carga cai ao movimentar o cabo', 'Só carrega em uma posição', 'LED de carga pisca'],
  'Bateria não retém carga': ['Cai de 100% para 30% em 2 horas', 'Desliga abaixo de 50%', 'Dura meia jornada'],
  'Módulo RFID falhando': ['Não lê tags em distância normal', 'Leitura falha após algumas horas', 'RFID desliga aleatoriamente'],
  'Erro de leitura intermitente': ['Leitura falha em códigos pequenos', 'Precisa repetir o scan 2x', 'Pisca vermelho sem ler'],
};

async function seed() {
  await getDb();
  setAutoSave(false);

  run('DELETE FROM observacoes');
  run('DELETE FROM coletores');

  // Garante usuário admin padrão (admin / admin123)
  const adminExists = query('SELECT id FROM usuarios WHERE email = ? OR nome = ?', ['admin', 'admin']);
  if (!adminExists.length) {
    const { createHash, randomBytes } = await import('crypto');
    const salt = randomBytes(16).toString('hex');
    const senhaHash = `${salt}$${createHash('sha256').update(`${salt}:admin123`).digest('hex')}`;
    const now = new Date().toISOString();
    run(`INSERT INTO usuarios (id, nome, email, cargo, departamento, status, senha, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)`,
      [randomUUID(), 'Administrador', 'admin', 'Administrador', '', 'ativo', senhaHash, now, now]);
    console.log('Seed: admin/admin123 garantido');
  }

  const coletores = [
    { nome: 'Coletor 01', modelo: 'Sunmi L2s PRO', numero_serie: '24029523022646', responsavel: 'João', departamento: 'Recebimento CD', localizacao: 'Setor Recebimento CD', cor: '#2563eb', status: 'ativo' },
    { nome: 'Coletor 02', modelo: 'Sunmi L2s PRO', numero_serie: 'LP13243T03566', responsavel: 'Hideik', departamento: 'Recebimento CD', localizacao: 'Setor Recebimento CD', cor: '#059669', status: 'ativo' },
    { nome: 'Coletor 03', modelo: 'Sunmi L2s PRO', numero_serie: 'LP13243T03479', responsavel: 'Henrique', departamento: 'Recebimento CD', localizacao: 'Setor Recebimento CD', cor: '#0891b2', status: 'manutencao' },
    { nome: 'Coletor 04', modelo: 'Sunmi L2s PRO', numero_serie: 'LP13243T03367', responsavel: 'Sebastião', departamento: 'Recebimento CD', localizacao: 'Setor Recebimento CD', cor: '#7c3aed', status: 'inativo' },
    { nome: 'Coletor 05', modelo: 'Sunmi L2s PRO', numero_serie: '23128523020198', responsavel: 'Igor', departamento: 'Recebimento CD', localizacao: 'Setor Recebimento CD', cor: '#ea580c', status: 'ativo' },
    { nome: 'Coletor 06', modelo: 'Sunmi L2s PRO', numero_serie: 'LP13243T02741', responsavel: 'Thacyo', departamento: 'Recebimento CD', localizacao: 'Setor Recebimento CD', cor: '#16a34a', status: 'ativo' },
    { nome: 'Coletor 07', modelo: 'Sunmi L2s PRO', numero_serie: 'LP13243T03245', responsavel: 'Davi', departamento: 'Recebimento CD', localizacao: 'Setor Recebimento CD', cor: '#be185d', status: 'ativo' },
    { nome: 'Coletor 08', modelo: 'Sunmi L2s PRO', numero_serie: '24029523020201', responsavel: 'Antigo ISAC', departamento: 'Recebimento CD', localizacao: 'Setor Recebimento CD', cor: '#dc2626', status: 'inativo' },
    { nome: 'Coletor 09', modelo: 'Sunmi L2s PRO', numero_serie: 'LP13243T3008', responsavel: 'Elesson', departamento: 'Recebimento CD', localizacao: 'Setor Recebimento CD', cor: '#d97706', status: 'ativo' },
    { nome: 'Coletor 10', modelo: 'Sunmi L2s PRO', numero_serie: '23128523021487', responsavel: 'Thiago', departamento: 'Recebimento CD', localizacao: 'Setor Recebimento CD', cor: '#9333ea', status: 'ativo' },
    { nome: 'Coletor 11', modelo: 'Sunmi L2s PRO', numero_serie: '23129523020411', responsavel: 'Samuel', departamento: 'Recebimento CD', localizacao: 'Setor Recebimento CD', cor: '#e11d48', status: 'manutencao' },
    { nome: 'Coletor 12', modelo: 'Sunmi L2s PRO', numero_serie: 'LP13243T03607', responsavel: 'José Carlos', departamento: 'Expedição CD', localizacao: 'Setor Expedição CD', cor: '#2563eb', status: 'ativo' },
    { nome: 'Coletor 13', modelo: 'Sunmi L2s PRO', numero_serie: 'LP13243T03205', responsavel: 'Gabriel Henrique', departamento: 'Expedição CD', localizacao: 'Setor Expedição CD', cor: '#059669', status: 'ativo' },
    { nome: 'Coletor 14', modelo: 'Sunmi L2s PRO', numero_serie: 'LP13243T03608', responsavel: 'Cauã Miguel', departamento: 'Expedição CD', localizacao: 'Setor Expedição CD', cor: '#0891b2', status: 'ativo' },
    { nome: 'Coletor 15', modelo: 'Sunmi L2s PRO', numero_serie: 'LP13243T02635', responsavel: 'Juan Pimenta', departamento: 'Expedição CD', localizacao: 'Setor Expedição CD', cor: '#7c3aed', status: 'ativo' },
    { nome: 'Coletor 16', modelo: 'Sunmi L2s PRO', numero_serie: 'LP13243T02601', responsavel: 'Francisco dos Santos', departamento: 'Expedição CD', localizacao: 'Setor Expedição CD', cor: '#ea580c', status: 'ativo' },
    { nome: 'Coletor 17', modelo: 'Sunmi L2s PRO', numero_serie: 'LP13243T03242', responsavel: 'Thiago Henrique', departamento: 'Expedição CD', localizacao: 'Setor Expedição CD', cor: '#16a34a', status: 'manutencao' },
    { nome: 'Coletor 18', modelo: 'Sunmi L2s PRO', numero_serie: 'LP13243T02706', responsavel: 'Marllos Helan', departamento: 'Expedição CD', localizacao: 'Setor Expedição CD', cor: '#be185d', status: 'ativo' },
    { nome: 'Coletor 19', modelo: 'Sunmi L2s PRO', numero_serie: 'LP13243T02769', responsavel: 'Carlos Silva', departamento: 'CABOS CD', localizacao: 'Setor CABOS CD', cor: '#d97706', status: 'ativo' },
    { nome: 'Coletor 20', modelo: 'Sunmi L2s PRO', numero_serie: 'LP13243T03185', responsavel: 'Erisson Santos', departamento: 'Expedição CD', localizacao: 'Setor Expedição CD', cor: '#9333ea', status: 'ativo' },
    { nome: 'Coletor 21', modelo: 'Sunmi L2s PRO', numero_serie: 'LP13243T02818', responsavel: 'Andrey Melo', departamento: 'Expedição CD', localizacao: 'Setor Expedição CD', cor: '#e11d48', status: 'ativo' },
    { nome: 'Coletor 22', modelo: 'Sunmi L2s PRO', numero_serie: 'LP13243T02752', responsavel: 'Luanderson H.', departamento: 'Expedição CD', localizacao: 'Setor Expedição CD', cor: '#dc2626', status: 'ativo' },
  ];

  const ids: string[] = [];
  for (const c of coletores) {
    const id = randomUUID();
    ids.push(id);
    const imagem = zebraDataUri;
    run(`INSERT INTO coletores (id,nome,modelo,numero_serie,responsavel,departamento,status,localizacao,imagem,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, c.nome, c.modelo, c.numero_serie, c.responsavel, c.departamento, c.status, c.localizacao, imagem, daysAgo(45), daysAgo(45)]);
  }

  const allObs: any[] = [];
  for (const template of OBS_TEMPLATES) {
    const descOptions = DESCRICOES[template.titulo] || [template.titulo];
    const numObs = Math.floor(Math.random() * 6) + 3;
    for (let i = 0; i < numObs; i++) {
      const coletorIdx = Math.floor(Math.random() * ids.length);
      const dias = Math.floor(Math.random() * 45);
      const desc = descOptions[Math.floor(Math.random() * descOptions.length)];
      allObs.push({
        coletor_id: ids[coletorIdx], titulo: template.titulo, descricao: desc,
        causas: template.causas, solucao: template.solucao, gravidade: template.gravidade, dias,
      });
    }
  }

  for (let i = 0; i < ids.length; i++) {
    const numUnique = Math.floor(Math.random() * 6) + 7;
    for (let j = 0; j < numUnique; j++) {
      const uniqueObs = [
        { titulo: 'Check-in OK', desc: 'Equipamento operando normalmente. Verificação de rotina concluída.', causas: 'Sem problemas identificados', solucao: 'Manter rotina de manutenção preventiva', g: 'baixa' },
        { titulo: 'Atualização de firmware', desc: `Firmware atualizado para versão 3.${Math.floor(Math.random()*9)+1}.${Math.floor(Math.random()*9)}`, causas: 'Software - versão desatualizada', solucao: 'Atualização aplicada com sucesso', g: 'baixa' },
        { titulo: 'Reparo na gancheira', desc: 'Mola de trava substituída e limpeza do mecanismo.', causas: 'Hardware - desgaste da mola', solucao: 'Mola nova instalada, funcionando', g: 'baixa' },
        { titulo: 'Calibração do scanner', desc: 'Scanner recalibrado com padrão de referência.', causas: 'Software - drift de calibração', solucao: 'Precisão restaurada ao nominal', g: 'baixa' },
        { titulo: 'Reinstalação do software', desc: 'Software de coleta reinstalado e configurado.', causas: 'Software - corrompimento de dados', solucao: 'Funcionamento restabelecido', g: 'media' },
        { titulo: 'Substituição do display', desc: 'Display LCD substituído por novo.', causas: 'Hardware - dead pixels', solucao: 'Display novo instalado e testado', g: 'media' },
      ];
      const o = uniqueObs[Math.floor(Math.random() * uniqueObs.length)];
      allObs.push({
        coletor_id: ids[i], titulo: o.titulo, descricao: o.desc,
        causas: o.causas, solucao: o.solucao, gravidade: o.g, dias: Math.floor(Math.random() * 45),
      });
    }
  }

  for (const o of allObs) {
    run(`INSERT INTO observacoes (id,coletor_id,titulo,descricao,causas,solucao,gravidade,created_at)
      VALUES (?,?,?,?,?,?,?,?)`,
      [randomUUID(), o.coletor_id, o.titulo, o.descricao, o.causas, o.solucao, o.gravidade, daysAgo(o.dias)]);
  }

  save();
  setAutoSave(true);

  console.log(`Seed: ${coletores.length} coletores + ${allObs.length} observações (random over 45 days)`);
  process.exit(0);
}

seed();
