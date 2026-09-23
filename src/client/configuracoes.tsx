import { useEffect, useState, type CSSProperties } from 'react';

export type PdfDesign = 'classico' | 'moderno' | 'minimal' | 'ouro' | 'metalico' | 'corporativo';

export type ConfigApp = {
  tema: 'claro' | 'escuro' | 'sistema';
  wallpaper: string;
  gridOpacity: number;
  pcbScale: number;
  accent: string;
  accentCustom: string;
  glowStrength: number;
  silencio: boolean;
  tipos: { edicao: boolean; criado: boolean; excluido: boolean; critica: boolean };
  toasts: boolean;
  compacto: boolean;
  animacoes: boolean;
  pdfDesign: PdfDesign;
};

export const CONFIG_PADRAO: ConfigApp = {
  tema: 'sistema',
  wallpaper: 'circuito',
  gridOpacity: 0.4,
  pcbScale: 1,
  accent: 'azul',
  accentCustom: '#7c5cff',
  glowStrength: 0.07,
  silencio: false,
  tipos: { edicao: true, criado: true, excluido: true, critica: true },
  toasts: true,
  compacto: false,
  animacoes: true,
  pdfDesign: 'classico',
};

export function mesclarConfig(p: Partial<ConfigApp> | null | undefined): ConfigApp {
  const raw = (p || {}) as Partial<ConfigApp>;
  return {
    ...CONFIG_PADRAO,
    ...raw,
    tipos: { ...CONFIG_PADRAO.tipos, ...(raw.tipos || {}) },
  };
}

export function carregarConfig(): ConfigApp {
  try {
    const raw = localStorage.getItem('config_v1');
    if (!raw) return { ...CONFIG_PADRAO };
    return mesclarConfig(JSON.parse(raw));
  } catch {
    return { ...CONFIG_PADRAO };
  }
}

export function salvarConfig(cfg: ConfigApp) {
  localStorage.setItem('config_v1', JSON.stringify(cfg));
}

function hexParaHsl(hex: string): [number, number, number] {
  let h = String(hex || '').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return [217, 91, 55];
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hh = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hh = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) hh = ((b - r) / d + 2) * 60;
    else hh = ((r - g) / d + 4) * 60;
  }
  return [Math.round(hh), Math.round(s * 100), Math.round(l * 100)];
}

function aplicarAccentCustom(cfg: ConfigApp) {
  const r = document.documentElement;
  if (cfg.accent !== 'personalizado') {
    r.style.removeProperty('--custom-h');
    r.style.removeProperty('--custom-s');
    r.style.removeProperty('--custom-l');
    r.style.removeProperty('--accent-custom');
    return;
  }
  const hex = cfg.accentCustom || CONFIG_PADRAO.accentCustom;
  const [h, s, l] = hexParaHsl(hex);
  const lDark = Math.min(78, Math.max(42, l + 12));
  r.style.setProperty('--accent-custom', hex);
  r.style.setProperty('--custom-h', String(h));
  r.style.setProperty('--custom-s', `${s}%`);
  r.style.setProperty('--custom-l', `${l}%`);
  r.style.setProperty('--custom-l-dark', `${lDark}%`);
}

export function aplicarConfig(cfg: ConfigApp) {
  const r = document.documentElement;
  r.setAttribute('data-wp', cfg.wallpaper);
  r.setAttribute('data-accent', cfg.accent);
  aplicarAccentCustom(cfg);
  r.style.setProperty('--grid-opacity', String(cfg.gridOpacity));
  r.style.setProperty('--glow-strength', String(cfg.glowStrength));
  r.style.setProperty('--pcb', `calc(clamp(96px, 13vmin, 180px) * ${cfg.pcbScale})`);
  r.classList.toggle('compact', cfg.compacto);
  r.classList.toggle('no-anim', !cfg.animacoes);
  r.classList.toggle('gold-mode', cfg.accent === 'ouro' || cfg.wallpaper === 'dourado');
  r.setAttribute('data-pdf', cfg.pdfDesign);
}

export function resolverDark(cfg: ConfigApp, darkAtual: boolean): boolean {
  if (cfg.tema === 'claro') return false;
  if (cfg.tema === 'escuro') return true;
  if (cfg.tema === 'sistema') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return darkAtual;
}

const WALLPAPERS = [
  { id: 'circuito', nome: 'Circuito' },
  { id: 'grade', nome: 'Grade' },
  { id: 'pontos', nome: 'Pontos' },
  { id: 'aurora', nome: 'Aurora' },
  { id: 'ondas', nome: 'Ondas' },
  { id: 'dourado', nome: 'Dourado' },
  { id: 'metalico', nome: 'Metálico' },
  { id: 'corporativo', nome: 'Corporativo' },
  { id: 'botoes', nome: 'Botões' },
  { id: 'personalizado', nome: 'Personalizado' },
  { id: 'solido', nome: 'Sólido' },
  { id: 'nenhum', nome: 'Nenhum' },
] as const;

const ACCENTS = [
  { id: 'azul', nome: 'Azul', hex: '#3b82f6' },
  { id: 'verde', nome: 'Verde', hex: '#10b981' },
  { id: 'roxo', nome: 'Roxo', hex: '#8b5cf6' },
  { id: 'ambar', nome: 'Âmbar', hex: '#f59e0b' },
  { id: 'rosa', nome: 'Rosa', hex: '#f43f5e' },
  { id: 'ciano', nome: 'Ciano', hex: '#06b6d4' },
  { id: 'ouro', nome: 'Dourado', hex: '#e8b84a' },
  { id: 'botoes', nome: 'Botões', hex: '#0072ce' },
  { id: 'personalizado', nome: 'Personalizado', hex: '#7c5cff' },
] as const;

const PDF_DESIGNS: { id: PdfDesign; nome: string; desc: string; cores: [string, string, string] }[] = [
  { id: 'classico', nome: 'Clássico', desc: 'Azul corporativo, cards com borda', cores: ['#0a1628', '#2563eb', '#eff6ff'] },
  { id: 'moderno', nome: 'Moderno', desc: 'Escuro com contraste limpo', cores: ['#0f172a', '#38bdf8', '#f8fafc'] },
  { id: 'minimal', nome: 'Minimal', desc: 'Clean, sem ruído de fundo', cores: ['#1e293b', '#64748b', '#ffffff'] },
  { id: 'ouro', nome: 'Dourado', desc: 'Brilho premium reflexo ouro', cores: ['#1a1408', '#d4a017', '#fffbeb'] },
  { id: 'metalico', nome: 'Metálico', desc: 'Aço escovado, cinza premium', cores: ['#1f2937', '#94a3b8', '#f1f5f9'] },
  { id: 'corporativo', nome: 'Corporativo', desc: 'Formal, navy e branco limpo', cores: ['#0b1f3a', '#1e4d8c', '#ffffff'] },
];

function wpStyle(id: string, intensity = 0.45, scale = 1, accentCustom?: string, lightMode = false): CSSProperties {
  const op = Math.min(1, Math.max(0, intensity));
  const px = (n: number) => `${Math.round(n * scale)}px`;
  const light = lightMode
    ? `rgba(59,82,130,${(0.45 + op * 0.5).toFixed(2)})`
    : `rgba(143,166,214,${(0.35 + op * 0.55).toFixed(2)})`;
  const line = lightMode
    ? `rgba(59,82,130,${(0.4 + op * 0.5).toFixed(2)})`
    : `rgba(143,166,214,${(0.28 + op * 0.5).toFixed(2)})`;
  const cfgAccentCustom = () => accentCustom || '#7c5cff';
  const baseLight = lightMode ? '#eef3fb' : '#0a1020';
  switch (id) {
    case 'grade':
      return {
        backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
        backgroundSize: `${px(12)} ${px(12)}`,
        backgroundColor: baseLight,
        opacity: 0.55 + op * 0.45,
      };
    case 'pontos':
      return {
        backgroundImage: `radial-gradient(${light} 1.4px, transparent 1.5px)`,
        backgroundSize: `${px(11)} ${px(11)}`,
        backgroundColor: baseLight,
        opacity: 0.55 + op * 0.45,
      };
    case 'aurora':
      return {
        backgroundImage: lightMode
          ? `radial-gradient(ellipse at 20% 40%, rgba(59,130,246,${(0.5 + op * 0.35).toFixed(2)}), transparent 55%),
             radial-gradient(ellipse at 80% 60%, rgba(139,92,246,${(0.45 + op * 0.3).toFixed(2)}), transparent 50%),
             radial-gradient(ellipse at 50% 80%, rgba(6,182,212,${(0.4 + op * 0.28).toFixed(2)}), transparent 50%)`
          : `radial-gradient(ellipse at 20% 40%, rgba(59,130,246,${(0.35 + op * 0.4).toFixed(2)}), transparent 55%),
             radial-gradient(ellipse at 80% 60%, rgba(139,92,246,${(0.3 + op * 0.35).toFixed(2)}), transparent 50%),
             radial-gradient(ellipse at 50% 80%, rgba(6,182,212,${(0.25 + op * 0.3).toFixed(2)}), transparent 50%)`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundColor: baseLight,
        opacity: 0.65 + op * 0.35,
        animation: 'auroraBreath 14s ease-in-out infinite alternate',
      };
    case 'ondas':
      return {
        backgroundImage: `repeating-linear-gradient(-12deg, transparent, transparent ${px(8)}, ${line} ${px(8)}, ${line} ${px(9)}),
           repeating-linear-gradient(-12deg, transparent, transparent ${px(16)}, ${lightMode ? `rgba(59,82,130,${(0.2 + op * 0.2).toFixed(2)})` : `rgba(143,166,214,${(0.12 + op * 0.15).toFixed(2)})`} ${px(16)}, ${lightMode ? `rgba(59,82,130,${(0.2 + op * 0.2).toFixed(2)})` : `rgba(143,166,214,${(0.12 + op * 0.15).toFixed(2)})`} ${px(17)})`,
        backgroundSize: '100% 100%',
        backgroundColor: baseLight,
        opacity: 0.55 + op * 0.45,
        animation: 'waveSlide 20s linear infinite',
      };
    case 'dourado':
      return {
        backgroundImage: lightMode
          ? `linear-gradient(125deg, rgba(180,130,20,0.4) 0%, rgba(212,160,23,0.5) 35%, rgba(255,200,60,0.6) 50%, rgba(212,160,23,0.5) 65%, rgba(180,130,20,0.4) 100%),
             radial-gradient(circle at 30% 40%, rgba(255,200,70,0.55), transparent 40%),
             radial-gradient(circle at 75% 65%, rgba(200,140,20,0.45), transparent 45%)`
          : `linear-gradient(125deg, rgba(26,20,8,0.95) 0%, rgba(120,90,20,0.85) 35%, rgba(232,184,74,${(0.35 + op * 0.35).toFixed(2)}) 50%, rgba(120,90,20,0.85) 65%, rgba(26,20,8,0.95) 100%),
             radial-gradient(circle at 30% 40%, rgba(255,215,100,${(0.3 + op * 0.4).toFixed(2)}), transparent 40%),
             radial-gradient(circle at 75% 65%, rgba(212,160,23,${(0.25 + op * 0.35).toFixed(2)}), transparent 45%)`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundColor: lightMode ? '#fef9ee' : baseLight,
        opacity: 0.65 + op * 0.35,
        animation: 'goldBreath 6s ease-in-out infinite alternate',
      };
    case 'metalico':
      return {
        backgroundImage: lightMode
          ? `linear-gradient(115deg, rgba(100,116,139,0.4) 0%, rgba(148,163,184,0.45) 22%, rgba(226,232,240,0.65) 48%, rgba(148,163,184,0.45) 72%, rgba(100,116,139,0.4) 100%),
             repeating-linear-gradient(0deg, transparent, transparent ${px(3)}, rgba(71,85,105,${(0.1 + op * 0.1).toFixed(2)}) ${px(3)}, rgba(71,85,105,${(0.1 + op * 0.1).toFixed(2)}) ${px(4)})`
          : `linear-gradient(115deg, rgba(15,23,42,0.92) 0%, rgba(71,85,105,0.75) 22%, rgba(203,213,225,${(0.35 + op * 0.35).toFixed(2)}) 48%, rgba(100,116,139,0.7) 72%, rgba(15,23,42,0.95) 100%),
             repeating-linear-gradient(0deg, transparent, transparent ${px(3)}, rgba(255,255,255,${(0.04 + op * 0.06).toFixed(2)}) ${px(3)}, rgba(255,255,255,${(0.04 + op * 0.06).toFixed(2)}) ${px(4)})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundColor: baseLight,
        opacity: 0.6 + op * 0.4,
        animation: 'metalBreath 9s ease-in-out infinite alternate',
      };
    case 'corporativo':
      return {
        backgroundImage: lightMode
          ? `linear-gradient(135deg, rgba(30,64,120,0.35) 0%, rgba(37,99,235,0.4) 45%, rgba(30,58,110,0.35) 100%),
             repeating-linear-gradient(45deg, transparent, transparent ${px(14)}, rgba(37,99,235,${(0.12 + op * 0.12).toFixed(2)}) ${px(14)}, rgba(37,99,235,${(0.12 + op * 0.12).toFixed(2)}) ${px(15)})`
          : `linear-gradient(135deg, rgba(11,31,58,0.94) 0%, rgba(30,77,140,0.75) 45%, rgba(15,50,95,0.9) 100%),
             repeating-linear-gradient(45deg, transparent, transparent ${px(14)}, rgba(147,197,253,${(0.06 + op * 0.1).toFixed(2)}) ${px(14)}, rgba(147,197,253,${(0.06 + op * 0.1).toFixed(2)}) ${px(15)})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundColor: baseLight,
        opacity: 0.6 + op * 0.4,
        animation: 'corpBreath 14s ease-in-out infinite alternate',
      };
    case 'botoes':
      return {
        backgroundImage: lightMode
          ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='%230072ce' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' opacity='0.75'%3E%3Cpath d='M22 22L38 38M38 22L22 38'/%3E%3Ccircle cx='90' cy='30' r='10'/%3E%3Cpath d='M30 80L40 98H20Z'/%3E%3Crect x='80' y='80' width='20' height='20' rx='3.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"),
             radial-gradient(ellipse at 30% 40%, rgba(0, 114, 206, ${(0.4 + op * 0.3).toFixed(2)}), transparent 58%),
             radial-gradient(ellipse at 75% 70%, rgba(0, 168, 232, ${(0.32 + op * 0.25).toFixed(2)}), transparent 55%),
             linear-gradient(135deg, rgba(0, 90, 170, ${(0.22 + op * 0.18).toFixed(2)}) 0%, transparent 50%, rgba(0, 160, 220, ${(0.18 + op * 0.15).toFixed(2)}) 100%)`
          : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='%2300a8e8' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' opacity='0.5'%3E%3Cpath d='M22 22L38 38M38 22L22 38'/%3E%3Ccircle cx='90' cy='30' r='10'/%3E%3Cpath d='M30 80L40 98H20Z'/%3E%3Crect x='80' y='80' width='20' height='20' rx='3.5'/%3E%3C/g%3E%3Cg fill='none' stroke='%230072ce' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round' opacity='0.3'%3E%3Cpath d='M60 48L70 58M70 48L60 58'/%3E%3Ccircle cx='50' cy='95' r='7'/%3E%3C/g%3E%3C/svg%3E"),
             radial-gradient(ellipse at 30% 40%, rgba(0, 114, 206, ${(0.3 + op * 0.35).toFixed(2)}), transparent 58%),
             radial-gradient(ellipse at 75% 70%, rgba(0, 180, 240, ${(0.22 + op * 0.28).toFixed(2)}), transparent 55%),
             linear-gradient(135deg, rgba(0, 90, 170, ${(0.18 + op * 0.2).toFixed(2)}) 0%, transparent 50%, rgba(0, 160, 220, ${(0.15 + op * 0.18).toFixed(2)}) 100%)`,
        backgroundSize: `120px 120px, 100% 100%, 100% 100%, 100% 100%`,
        backgroundRepeat: 'repeat, no-repeat, no-repeat, no-repeat',
        backgroundPosition: '0 0, 10% 30%, 85% 65%, 0 0',
        backgroundColor: baseLight,
        opacity: 0.6 + op * 0.4,
        animation: 'patternDrift 28s ease-in-out infinite alternate',
      };
    case 'personalizado': {
      const c1 = cfgAccentCustom();
      if (lightMode) {
        return {
          backgroundImage: `linear-gradient(
            150deg,
            color-mix(in srgb, ${c1} 42%, #f8fafc) 0%,
            color-mix(in srgb, ${c1} 32%, #ffffff) 42%,
            color-mix(in srgb, ${c1} 38%, #f1f5f9) 72%,
            color-mix(in srgb, ${c1} 28%, #ffffff) 100%
          )`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          opacity: 0.75 + op * 0.25,
        };
      }
      return {
        backgroundImage: `linear-gradient(
          150deg,
          ${c1}88 0%,
          ${c1}5c 42%,
          ${c1}78 72%,
          ${c1}55 100%
        )`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        opacity: 0.65 + op * 0.35,
      };
    }
    case 'solido':
      return lightMode
        ? { background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', opacity: 1 }
        : { background: 'linear-gradient(135deg, #0a1628, #12203a)', opacity: 1 };
    case 'nenhum':
      return { background: lightMode ? '#eef3fb' : '#0a1020', opacity: 1 };
    default:
      return {
        backgroundImage: lightMode
          ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect x='8' y='8' width='16' height='16' rx='4' transform='rotate(45 16 16)' fill='none' stroke='%233b5a8a' stroke-width='1.4'/%3E%3Ccircle cx='20' cy='4' r='2' fill='%233b5a8a'/%3E%3C/svg%3E")`
          : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect x='8' y='8' width='16' height='16' rx='4' transform='rotate(45 16 16)' fill='none' stroke='%238fa6d6' stroke-width='1.2'/%3E%3Ccircle cx='20' cy='4' r='2' fill='%238fa6d6'/%3E%3C/svg%3E")`,
        backgroundSize: `${px(28)} ${px(28)}`,
        backgroundColor: lightMode ? '#eef3fb' : '#0a1020',
        opacity: lightMode ? 0.5 + op * 0.5 : 0.35 + op * 0.65,
      };
  }
}

function MiniPreview({
  darkMode,
  wallpaper,
  accentHex,
  ativo,
  rotulo,
  intensity,
  scale,
  onClick,
}: {
  darkMode: boolean;
  wallpaper: string;
  accentHex: string;
  ativo: boolean;
  rotulo: string;
  intensity: number;
  scale: number;
  onClick: () => void;
}) {
  const bg = darkMode ? '#0b1220' : '#eef3fb';
  const card = darkMode ? '#121a2c' : '#ffffff';
  const fg = darkMode ? '#e8eefc' : '#1e293b';
  const mut = darkMode ? '#94a3b8' : '#64748b';
  const side = darkMode ? '#070c16' : '#0a1628';
  return (
    <button type="button" className={`theme-preview ${ativo ? 'active' : ''}`} onClick={onClick} title={`Aplicar modo ${rotulo}`}>
      <div className="theme-preview-bar" style={{ background: side, color: accentHex }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: accentHex, display: 'inline-block' }} />
        {rotulo}
        {ativo && <span style={{ marginLeft: 'auto', fontSize: 9 }}>✓ ativo</span>}
      </div>
      <div className="theme-preview-body" style={{ background: bg, ...wpStyle(wallpaper, intensity, scale, accentHex, !darkMode) }}>
        <div className="theme-preview-side" style={{ background: side, opacity: 0.95 }}>
          <div style={{ height: 6, width: '60%', borderRadius: 4, background: accentHex, marginBottom: 8, opacity: 0.85 }} />
          <div style={{ height: 5, width: '80%', borderRadius: 4, background: 'rgba(255,255,255,0.2)', marginBottom: 5 }} />
          <div style={{ height: 5, width: '70%', borderRadius: 4, background: 'rgba(255,255,255,0.12)', marginBottom: 5 }} />
          <div style={{ height: 5, width: '75%', borderRadius: 4, background: 'rgba(255,255,255,0.12)' }} />
        </div>
        <div className="theme-preview-side">
          <div className="theme-preview-card" style={{ background: card, color: fg, border: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}` }}>
            <div style={{ fontWeight: 700, fontSize: 11 }}>Coletor Zebra MC9300</div>
            <div style={{ color: mut, fontSize: 9, marginTop: 2 }}>SN · modelo · setor</div>
          </div>
          <div className="theme-preview-card" style={{ background: card, color: accentHex, border: `1px solid ${accentHex}55`, fontWeight: 700 }}>
            3 críticas · 5 avisos
          </div>
          <div className="theme-preview-card" style={{ background: accentHex, color: '#fff', fontWeight: 700, textAlign: 'center' }}>
            Gerar relatório
          </div>
        </div>
      </div>
    </button>
  );
}

type Aba = 'aparencia' | 'notificacoes' | 'preferencias' | 'sobre';

type Props = {
  open: boolean;
  onClose: () => void;
  config: ConfigApp;
  onChange: (cfg: ConfigApp) => void;
  dark: boolean;
  onMudarTema: (claroOuEscuro: boolean) => void;
  onLimparNotificacoes?: () => void;
};

export function ConfiguracoesModal({ open, onClose, config, onChange, dark, onMudarTema, onLimparNotificacoes }: Props) {
  const [aba, setAba] = useState<Aba>('aparencia');
  const [draft, setDraft] = useState<ConfigApp>(config);

  useEffect(() => {
    if (open) setDraft(config);
  }, [open, config]);

  if (!open) return null;

  const set = (patch: Partial<ConfigApp>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    onChange(next);
    if (patch.tema) onMudarTema(resolverDark(next, dark));
  };

  const accentHex = draft.accent === 'personalizado'
    ? (draft.accentCustom || '#7c5cff')
    : (ACCENTS.find(a => a.id === draft.accent) || ACCENTS[0]).hex;

  const toggle = (chave: string, valor: boolean) => {
    if (chave === 'raiz') set({ silencio: valor, toasts: valor ? false : draft.toasts });
    else if (chave === 'toasts') set({ toasts: valor });
    else if (chave === 'compacto') set({ compacto: valor });
    else if (chave === 'animacoes') set({ animacoes: valor });
    else if (chave.startsWith('tipo.')) {
      const k = chave.slice(5) as keyof ConfigApp['tipos'];
      set({ tipos: { ...draft.tipos, [k]: valor } });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-scale-in border border-border" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 pb-3 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-card-foreground">Configurações</h2>
            <p className="text-sm text-muted-foreground mt-1">Aparência, notificações e preferências do sistema</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition" aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex gap-1.5 px-5 pt-3 pb-2 border-b border-border/60 overflow-x-auto">
          {([
            ['aparencia', 'Aparência'],
            ['notificacoes', 'Notificações'],
            ['preferencias', 'Preferências'],
            ['sobre', 'Sobre'],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setAba(id)}
              className={`btn btn-xs whitespace-nowrap ${aba === id ? 'btn-primary' : 'btn-outline'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {aba === 'aparencia' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs uppercase tracking-widest text-primary/50 font-bold mb-3">Modo (diurno / noturno)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <MiniPreview darkMode={false} wallpaper={draft.wallpaper} accentHex={accentHex}
                    ativo={draft.tema === 'claro'} rotulo="Diurno"
                    intensity={draft.gridOpacity} scale={draft.pcbScale}
                    onClick={() => set({ tema: 'claro' })} />
                  <MiniPreview darkMode wallpaper={draft.wallpaper} accentHex={accentHex}
                    ativo={draft.tema === 'escuro'} rotulo="Noturno"
                    intensity={draft.gridOpacity} scale={draft.pcbScale}
                    onClick={() => set({ tema: 'escuro' })} />
                  <MiniPreview darkMode={dark} wallpaper={draft.wallpaper} accentHex={accentHex}
                    ativo={draft.tema === 'sistema'} rotulo="Sistema"
                    intensity={draft.gridOpacity} scale={draft.pcbScale}
                    onClick={() => set({ tema: 'sistema' })} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Clique no preview para aplicar na hora — o mesmo layout muda ao lado, estilo WhatsApp.</p>
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-3 mb-3">
                  <h3 className="text-xs uppercase tracking-widest text-primary/50 font-bold">Papel de parede</h3>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    intensidade {Math.round(draft.gridOpacity * 100)}% · escala {draft.pcbScale.toFixed(2)}x
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-2">
                  {WALLPAPERS.map(w => (
                    <button key={w.id} type="button"
                      className={`wp-thumb ${draft.wallpaper === w.id ? 'active' : ''}`}
                      style={wpStyle(w.id, draft.gridOpacity, draft.pcbScale, accentHex, !dark)}
                      onClick={() => set({ wallpaper: w.id })}
                      title={`${w.nome} — ${Math.round(draft.gridOpacity * 100)}% · ${draft.pcbScale.toFixed(2)}x`}>
                      <span className="wp-thumb-label">{w.nome}</span>
                      {draft.wallpaper === w.id && <span className="wp-thumb-check">✓</span>}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <label className="block">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-semibold">Intensidade do fundo</span>
                      <span className="text-xs font-bold text-primary tabular-nums">{Math.round(draft.gridOpacity * 100)}%</span>
                    </div>
                    <input type="range" min={0} max={1} step={0.05} value={draft.gridOpacity}
                      onChange={e => set({ gridOpacity: Number(e.target.value) })} className="w-full mt-1.5" />
                  </label>
                  <label className="block">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-semibold">Escala do padrão</span>
                      <span className="text-xs font-bold text-primary tabular-nums">{draft.pcbScale.toFixed(2)}x</span>
                    </div>
                    <input type="range" min={0.5} max={1.8} step={0.05} value={draft.pcbScale}
                      onChange={e => set({ pcbScale: Number(e.target.value) })} className="w-full mt-1.5" />
                  </label>
                  <label className="block sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-semibold">Brilho central</span>
                      <span className="text-xs font-bold text-primary tabular-nums">{Math.round(draft.glowStrength * 100)}%</span>
                    </div>
                    <input type="range" min={0} max={0.2} step={0.01} value={draft.glowStrength}
                      onChange={e => set({ glowStrength: Number(e.target.value) })} className="w-full mt-1.5" />
                  </label>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Os thumbs e os previews de modo usam a intensidade/escala ao vivo — mexa e veja na hora.
                </p>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-widest text-primary/50 font-bold mb-3">Cor de destaque</h3>
                <div className="flex flex-wrap gap-3 items-center">
                  {ACCENTS.map(a => (
                    <button key={a.id} type="button"
                      className={`swatch ${draft.accent === a.id ? 'active' : ''}`}
                      style={a.id === 'ouro'
                        ? { background: 'linear-gradient(135deg, #f5d76e, #d4a017 45%, #f8e7a0)' }
                      : a.id === 'botoes'
                        ? { background: 'linear-gradient(135deg, #0072ce, #00a8e8)' }
                        : a.id === 'personalizado'
                          ? { background: draft.accentCustom || '#7c5cff' }
                          : { background: a.hex }}
                      onClick={() => set({ accent: a.id })}
                      title={a.nome}
                      aria-label={a.nome}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className="text-xs text-muted-foreground font-semibold">Personalizar cor:</span>
                  <input
                    type="color"
                    className="accent-color-input"
                    value={draft.accentCustom || '#7c5cff'}
                    onChange={e => set({ accent: 'personalizado', accentCustom: e.target.value })}
                    aria-label="Escolher cor personalizada"
                  />
                  <code className="text-[11px] font-mono text-muted-foreground uppercase">{draft.accentCustom}</code>
                  <button type="button" className="btn btn-outline btn-xs"
                    onClick={() => set({ accent: 'personalizado' })}>
                    Usar personalizado
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  <b>Botões</b> usa um azul limpo na interface. <b>Personalizado</b> usa a cor que você escolher — salva por usuário.
                </p>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-widest text-primary/50 font-bold mb-3">Design do PDF</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PDF_DESIGNS.map(d => (
                    <button key={d.id} type="button"
                      className={`pdf-design-card ${draft.pdfDesign === d.id ? 'active' : ''}`}
                      onClick={() => set({ pdfDesign: d.id })}
                      title={d.desc}>
                      <span className="pdf-design-mini" style={{ background: d.cores[0] }}>
                        <span style={{ display: 'block', height: 4, width: '55%', borderRadius: 2, background: d.cores[1], marginBottom: 4 }} />
                        <span style={{ display: 'block', height: 3, width: '80%', borderRadius: 2, background: d.cores[2], marginBottom: 3, opacity: 0.7 }} />
                        <span style={{ display: 'block', height: 3, width: '65%', borderRadius: 2, background: d.cores[2], opacity: 0.45 }} />
                      </span>
                      <span className="pdf-design-name">{d.nome}</span>
                      <span className="pdf-design-desc">{d.desc}</span>
                      {draft.pdfDesign === d.id && <span className="pdf-design-check">✓</span>}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Usado ao exportar PDF/Word — capa, headers, cards e tabela seguem este estilo.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button type="button" className="btn btn-outline btn-sm"
                  onClick={() => { setDraft(CONFIG_PADRAO); onChange(CONFIG_PADRAO); onMudarTema(resolverDark(CONFIG_PADRAO, dark)); }}>
                  Restaurar padrão
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>Aplicar e fechar</button>
              </div>
            </div>
          )}

          {aba === 'notificacoes' && (
            <div className="space-y-4">
              <div className="cfg-toggle">
                <div>
                  <p className="text-sm font-semibold text-card-foreground">Silenciar notificações</p>
                  <p className="text-xs text-muted-foreground">Sem popups de sucesso/info (erros continuam)</p>
                </div>
                <button type="button" className={`cfg-switch ${draft.silencio ? 'on' : ''}`}
                  onClick={() => toggle('raiz', !draft.silencio)}
                  role="switch" aria-checked={draft.silencio} aria-label="Silenciar notificações" />
              </div>

              <div className="cfg-toggle">
                <div>
                  <p className="text-sm font-semibold text-card-foreground">Toasts visíveis</p>
                  <p className="text-xs text-muted-foreground">Avisos flutuantes no canto da tela</p>
                </div>
                <button type="button" className={`cfg-switch ${draft.toasts ? 'on' : ''}`}
                  onClick={() => toggle('toasts', !draft.toasts)}
                  role="switch" aria-checked={draft.toasts} aria-label="Toasts visíveis" />
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-primary/50 font-bold mb-2">Tipos de evento</p>
                <div className="space-y-2">
                  {([
                    ['edicao', 'Edições de coletor'],
                    ['criado', 'Novos registros'],
                    ['excluido', 'Exclusões'],
                    ['critica', 'Ocorrências críticas'],
                  ] as const).map(([k, label]) => (
                    <div key={k} className="cfg-toggle">
                      <span className="text-sm text-card-foreground">{label}</span>
                      <button type="button" className={`cfg-switch ${draft.tipos[k] ? 'on' : ''}`}
                        onClick={() => toggle(`tipo.${k}`, !draft.tipos[k])}
                        role="switch" aria-checked={draft.tipos[k]} aria-label={label} />
                    </div>
                  ))}
                </div>
              </div>

              {onLimparNotificacoes && (
                <button type="button" className="btn btn-outline btn-sm text-destructive" onClick={onLimparNotificacoes}>
                  Limpar histórico de notificações (lidas)
                </button>
              )}
            </div>
          )}

          {aba === 'preferencias' && (
            <div className="space-y-4">
              <div className="cfg-toggle">
                <div>
                  <p className="text-sm font-semibold text-card-foreground">Modo compacto</p>
                  <p className="text-xs text-muted-foreground">Menos espaçamento, mais conteúdo na tela</p>
                </div>
                <button type="button" className={`cfg-switch ${draft.compacto ? 'on' : ''}`}
                  onClick={() => toggle('compacto', !draft.compacto)}
                  role="switch" aria-checked={draft.compacto} aria-label="Modo compacto" />
              </div>
              <div className="cfg-toggle">
                <div>
                  <p className="text-sm font-semibold text-card-foreground">Animações</p>
                  <p className="text-xs text-muted-foreground">Transições e efeitos da interface</p>
                </div>
                <button type="button" className={`cfg-switch ${draft.animacoes ? 'on' : ''}`}
                  onClick={() => toggle('animacoes', !draft.animacoes)}
                  role="switch" aria-checked={draft.animacoes} aria-label="Animações" />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" className="btn btn-outline btn-sm"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `configuracoes_${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                  }}>
                  Exportar preferências
                </button>
                <button type="button" className="btn btn-outline btn-sm text-destructive"
                  onClick={() => { localStorage.removeItem('config_v1'); setDraft(CONFIG_PADRAO); onChange(CONFIG_PADRAO); onMudarTema(true); }}>
                  Limpar tudo (reset)
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Preferências ficam salvas <b>por usuário</b> no servidor (sincronizam ao entrar com seu login) e também neste navegador.
              </p>
            </div>
          )}

          {aba === 'sobre' && (
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="card p-4">
                <p className="font-bold text-card-foreground mb-1">BA Elétrica — Controle de Coletores</p>
                <p>Versão <b className="text-primary">v2.08</b></p>
                <p className="mt-1">Sistema de gestão de equipamentos, registros e relatórios.</p>
              </div>
              <div className="card p-4">
                <p className="font-bold text-card-foreground mb-1">Stack</p>
                <p>React 18 · Vite · Tailwind · Express · SQLite (sql.js) · @react-pdf/renderer</p>
              </div>
              <div className="card p-4">
                <p className="font-bold text-card-foreground mb-1">Atalhos</p>
                <p>🔔 Notificações · ⚙️ Esta tela · tema diurno/noturno no topo</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
