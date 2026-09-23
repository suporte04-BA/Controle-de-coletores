import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SinoNotificacoes, engrenagemSvg, type Notificacao } from './notificacoes';
import { ConfiguracoesModal, carregarConfig, salvarConfig, aplicarConfig, resolverDark, mesclarConfig, type ConfigApp } from './configuracoes';

const api = async (url: string, opts?: any) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(url, { headers: { ...headers, ...(opts?.headers || {}) }, ...opts });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(err.error || `HTTP ${r.status}`);
  }
  return r.json();
};

type Coletor = { id: string; nome: string; modelo: string; numero_serie: string; responsavel: string; departamento: string; status: string; localizacao: string; imagem: string | null; contrato?: string | null; created_at: string; updated_at?: string; observacoes?: Obs[]; kpi?: any };
type Obs = { id: string; coletor_id: string; titulo: string; descricao: string; causas: string; solucao: string; gravidade: string; created_at: string; coletor_nome?: string; coletor_responsavel?: string };
type Dashboard = { total: number; ativos: number; inativos: number; manutencao: number; observacoes: number; criticas: number; avisos: number; infos: number; departamentos: any[]; ultimasObs: any[] };

const I = {
  home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  box: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  eye: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  file: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  back: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  user: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  alert: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>,
  printer: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  moon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  sun: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23,4 23,10 17,10"/><polyline points="1,20 1,14 7,14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  camera: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  filter: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/></svg>,
  save: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>,
  mapPin: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  calendar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  err: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  warn: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  info: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  menu: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  expand: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
  pdf: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>,
  chevD: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  dept: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01M12 6h.01M12 10h.01M12 14h.01"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

let toastId = 0;
let toastFn: ((msg: string, type?: string) => void) | null = null;
function showToast(msg: string, type = 'success') { toastFn?.(msg, type); }

// Preferências de notificação/toast lidas pelo event bus do Toasts
let cfgToastsVisiveis = true;
let cfgSilencio = false;
function setCfgToastFlags(visiveis: boolean, silencio: boolean) {
  cfgToastsVisiveis = visiveis;
  cfgSilencio = silencio;
}

function Toasts() {
  const [list, setList] = useState<{ id: number; msg: string; type: string }[]>([]);
  useEffect(() => {
    toastFn = (msg: string, type = 'success') => {
      if (type !== 'error' && (cfgSilencio || !cfgToastsVisiveis)) return;
      const id = ++toastId;
      setList(p => [...p, { id, msg, type }]);
      setTimeout(() => setList(p => p.filter(x => x.id !== id)), type === 'error' ? 5000 : 3500);
    };
    return () => { toastFn = null; };
  }, []);
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {list.map(t => (
        <div key={t.id} className="animate-slide-up flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium text-white"
          style={{ background: t.type === 'error' ? 'hsl(0, 72%, 51%)' : t.type === 'info' ? 'hsl(217, 91%, 60%)' : 'hsl(152, 60%, 42%)' }}>
          {t.type === 'error' ? I.alert : I.check}{t.msg}
        </div>
      ))}
    </div>
  );
}

function Modal({ open, onClose, title, desc, children, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; desc?: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', handleEsc);
      return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', handleEsc); };
    }
  }, [open, onClose]);
  if (!open) return null;
  const maxW = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : size === 'xl' ? 'max-w-4xl' : 'max-w-md';
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div ref={modalRef} className={`bg-card rounded-2xl shadow-2xl w-full ${maxW} max-h-[90vh] overflow-hidden flex flex-col animate-scale-in border border-border`} style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 pb-3 border-b border-border">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-card-foreground">{title}</h2>
            {desc && <p className="text-sm text-muted-foreground mt-1">{desc}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition" aria-label="Fechar">{I.x}</button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ s }: { s: string }) {
  const m: Record<string, [string, string]> = { ativo: ['badge-success', 'Ativo'], inativo: ['badge-danger', 'Inativo'], manutencao: ['badge-warning', 'Manutenção'] };
  const [cls, label] = m[s] || ['badge-secondary', s];
  return <span className={`badge ${cls}`}>{label}</span>;
}

function GravBadge({ g }: { g: string }) {
  const m: Record<string, [string, string]> = { alta: ['badge-danger', 'Alta'], media: ['badge-warning', 'Média'], baixa: ['badge-info', 'Baixa'] };
  const [cls, label] = m[g] || ['badge-secondary', g];
  return <span className={`badge ${cls}`}>{label}</span>;
}

function DonutChart({ data, size = 130 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="flex items-center gap-4"><div className="w-[130px] h-[130px] rounded-full bg-muted flex items-center justify-center"><span className="text-sm text-muted-foreground">Sem dados</span></div></div>;
  let acc = 0;
  const stops = data.map(d => { const start = (acc / total) * 100; acc += d.value; const end = (acc / total) * 100; return `${d.color} ${start}% ${end}%`; }).join(', ');
  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <div className="w-full h-full rounded-full shadow-xl" style={{ background: `conic-gradient(${stops})` }} />
        <div className="absolute inset-3 rounded-full bg-card flex items-center justify-center shadow-inner">
          <span className="text-xl font-bold text-card-foreground">{total}</span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-3 text-sm">
            <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-md" style={{ background: d.color }} />
            <span className="text-muted-foreground font-medium">{d.label}</span>
            <span className="font-bold text-card-foreground ml-auto tabular-nums text-base">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Arquivo deve ser imagem');
  if (file.size > 5 * 1024 * 1024) throw new Error('Máximo 5MB');
  const bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Falha ao ler imagem')); };
    img.src = url;
  });
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Falha ao processar imagem');
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.85);
}

function Avatar({ src, nome, size = 'md', className = '' }: { src?: string | null; nome: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dims = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-12 h-12 text-lg';
  if (src) {
    return (
      <img
        src={src}
        alt={nome}
        className={`${dims} rounded-full object-cover border border-primary/30 shadow-md flex-shrink-0 ${className}`}
        draggable={false}
      />
    );
  }
  return (
    <div className={`${dims} rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md ${className}`}>
      {(nome || '?').charAt(0).toUpperCase()}
    </div>
  );
}

function AvatarUpload({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = async (file: File) => {
    try {
      onChange(await fileToAvatarDataUrl(file));
      showToast('Foto de perfil atualizada');
    } catch (e: any) {
      showToast(e.message || 'Erro ao processar foto', 'error');
    }
  };
  return (
    <div className="space-y-2">
      <label className="label text-card-foreground">Foto de perfil</label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative group cursor-pointer"
          onClick={() => inputRef.current?.click()}
          title="Trocar foto"
        >
          <Avatar src={value} nome="F" size="lg" />
          <span className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            {I.camera}
          </span>
        </button>
        <div className="flex flex-col gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => inputRef.current?.click()}>
            {I.camera} Escolher foto
          </button>
          {value && (
            <button type="button" className="btn btn-outline btn-sm text-destructive" onClick={() => onChange(null)}>
              {I.trash} Remover
            </button>
          )}
          <p className="text-xs text-muted-foreground">JPG/PNG · até 5MB · recortada em quadrado</p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ''; }} />
    </div>
  );
}

function ImageUpload({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('Arquivo deve ser imagem', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Máximo 5MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div className="space-y-2">
      <label className="label text-card-foreground">Imagem do Equipamento</label>
      <div
        className="relative border-2 border-dashed border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        {value ? (
          <div className="relative">
            <img src={value} alt="Preview" className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <span className="text-white text-sm font-medium flex items-center gap-1.5">{I.camera} Trocar</span>
              <button onClick={e => { e.stopPropagation(); onChange(null); }} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg bg-black/30 hover:bg-black/50 transition">{I.trash}</button>
            </div>
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">{I.camera}</div>
            <p className="text-sm font-medium">Arraste ou clique para adicionar</p>
            <p className="text-xs">JPG, PNG ou SVG (máx. 5MB)</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

function dataUrlToBytes(dataUrl: string): Uint8Array<ArrayBuffer> | null {
  if (!dataUrl.startsWith('data:')) return null;
  try {
    const comma = dataUrl.indexOf(',');
    if (comma < 0) return null;
    const b64 = dataUrl.slice(comma + 1);
    const bin = atob(b64);
    const buffer = new ArrayBuffer(bin.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function pdfBlobUrl(dataUrl: string): string {
  if (!dataUrl.startsWith('data:')) return dataUrl;
  const bytes = dataUrlToBytes(dataUrl);
  if (!bytes) return dataUrl;
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
}

function abrirPdf(src: string) {
  const url = pdfBlobUrl(src);
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (w) {
    if (url !== src && url.startsWith('blob:')) {
      setTimeout(() => URL.revokeObjectURL(url), 120_000);
    }
    return;
  }
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (url !== src && url.startsWith('blob:')) {
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  }
}

async function renderPdfPageImage(dataUrl: string, scale = 1.35): Promise<string | null> {
  try {
    const bytes = dataUrlToBytes(dataUrl);
    if (!bytes) return null;
    const pdfjs = await import('pdfjs-dist');
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
    }
    const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    await page.render({ canvasContext: ctx, viewport }).promise;
    await doc.destroy();
    return canvas.toDataURL('image/jpeg', 0.88);
  } catch {
    return null;
  }
}

function ContratoPdfFrame({ src, className }: { src: string; className: string }) {
  const [img, setImg] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);
  useEffect(() => {
    let vivo = true;
    setImg(null);
    setFalhou(false);
    renderPdfPageImage(src)
      .then(url => {
        if (!vivo) return;
        if (url) setImg(url);
        else setFalhou(true);
      })
      .catch(() => { if (vivo) setFalhou(true); });
    return () => { vivo = false; };
  }, [src]);
  if (falhou) {
    return <div className={`${className} contract-preview-fallback`}>{I.pdf}</div>;
  }
  if (!img) {
    return <div className={`${className} contract-preview-loading`}>Carregando prévia…</div>;
  }
  return <img src={img} alt="Prévia do contrato PDF" className={className} draggable={false} />;
}

function ContractUpload({ value, onChange, label = 'Contrato (PDF)', onImmediateSave }: {
  value: string | null;
  onChange: (v: string | null) => void;
  label?: string;
  onImmediateSave?: (v: string | null) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [salvando, setSalvando] = useState(false);
  const openUrl = useMemo(() => (value ? pdfBlobUrl(value) : ''), [value]);
  useEffect(() => {
    if (openUrl.startsWith('blob:')) {
      return () => { try { URL.revokeObjectURL(openUrl); } catch { /* ignore */ } };
    }
  }, [openUrl]);
  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Arquivo deve ser PDF', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { showToast('Máximo 10MB', 'error'); return; }
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
      reader.readAsDataURL(file);
    });
    onChange(dataUrl);
    if (onImmediateSave) {
      setSalvando(true);
      try {
        await onImmediateSave(dataUrl);
        showToast('Contrato salvo');
      } catch (e: any) {
        showToast(e.message || 'Erro ao salvar contrato', 'error');
      } finally {
        setSalvando(false);
      }
    }
  };
  return (
    <div className="space-y-2">
      <label className="label text-card-foreground">{label}</label>
      <div
        className="relative border-2 border-dashed border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        {value ? (
          <div className="relative bg-slate-900/40">
            <ContratoPdfFrame src={value} className="w-full h-48 border-0 pointer-events-none" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button type="button" onClick={e => { e.stopPropagation(); abrirPdf(value); }} className="btn btn-outline btn-sm bg-black/40 text-white border-white/30">{I.pdf} Abrir PDF</button>
              <a
                href={openUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="btn btn-outline btn-sm bg-black/40 text-white border-white/30"
              >{I.pdf} Nova aba</a>
              <button onClick={e => { e.stopPropagation(); onChange(null); onImmediateSave?.(null); }} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg bg-black/30 hover:bg-black/50 transition">{I.trash}</button>
            </div>
          </div>
        ) : (
          <div className="h-36 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">{I.pdf}</div>
            <p className="text-sm font-medium">{salvando ? 'Salvando…' : 'Arraste ou clique para adicionar'}</p>
            <p className="text-xs">PDF (máx. 10MB)</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </div>
  );
}

function ContratoVisivel({ contrato, compact = false, onUploadClick }: { contrato?: string | null; compact?: boolean; onUploadClick?: () => void }) {
  const href = useMemo(() => (contrato ? pdfBlobUrl(contrato) : ''), [contrato]);
  useEffect(() => {
    if (href && href.startsWith('blob:') && contrato) {
      return () => { try { URL.revokeObjectURL(href); } catch { /* ignore */ } };
    }
  }, [href, contrato]);
  if (!contrato) {
    if (!onUploadClick) return null;
    return (
      <button type="button" className={`contract-empty ${compact ? 'contract-preview-compact' : ''}`} onClick={e => { e.stopPropagation(); onUploadClick(); }}>
        {I.pdf}
        <span>Adicionar contrato do responsável (PDF)</span>
      </button>
    );
  }
  return (
    <a
      className={`contract-preview ${compact ? 'contract-preview-compact' : ''}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      role="button"
      tabIndex={0}
      title="Abrir contrato PDF em nova aba"
    >
      <ContratoPdfFrame src={contrato} className="contract-preview-frame" />
      <span className="contract-preview-bar">
        <span className="contract-preview-label">{I.pdf} Contrato do responsável</span>
        <span className="contract-preview-open">Abrir PDF</span>
      </span>
    </a>
  );
}

function ContratoUnico({ coletorId, contrato, onChanged }: { coletorId: string; contrato?: string | null; onChanged: (c: Coletor) => void }) {
  const salvar = async (v: string | null) => {
    const atualizado = await api(`/api/coletores/${coletorId}/kpi`, { method: 'PUT', body: JSON.stringify({ contrato: v }) });
    onChanged(atualizado);
  };
  if (!contrato) {
    return (
      <div className="card p-4 md:p-5">
        <h3 className="text-[11px] uppercase tracking-widest text-primary/50 font-bold mb-3 flex items-center gap-1.5">{I.pdf} Contrato do responsável</h3>
        <ContractUpload
          value={null}
          onChange={() => {}}
          label="Anexar PDF"
          onImmediateSave={salvar}
        />
      </div>
    );
  }
  return (
    <div className="card p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className="text-[11px] uppercase tracking-widest text-primary/50 font-bold flex items-center gap-1.5">{I.pdf} Contrato do responsável</h3>
        <div className="flex gap-2">
          <label className="btn btn-outline btn-sm cursor-pointer">
            {I.pdf} Trocar PDF
            <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={async e => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) { showToast('Arquivo deve ser PDF', 'error'); return; }
              if (f.size > 10 * 1024 * 1024) { showToast('Máximo 10MB', 'error'); return; }
              const dataUrl: string = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Falha ao ler'));
                reader.readAsDataURL(f);
              });
              try { await salvar(dataUrl); showToast('Contrato atualizado'); }
              catch (e: any) { showToast(e.message || 'Erro ao salvar', 'error'); }
            }} />
          </label>
          <button type="button" className="btn btn-outline btn-sm text-destructive" onClick={async () => {
            try { await salvar(null); showToast('Contrato removido'); }
            catch (e: any) { showToast(e.message || 'Erro ao remover', 'error'); }
          }}>{I.trash} Remover</button>
        </div>
      </div>
      <ContratoVisivel contrato={contrato} />
    </div>
  );
}

function FormColetor({ data, onSave, onCancel }: { data?: Coletor; onSave: (d: any) => void; onCancel: () => void }) {
  const [f, setF] = useState(data || { nome: '', modelo: '', numero_serie: '', responsavel: '', departamento: '', localizacao: '', imagem: null, contrato: null, status: 'ativo' });
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(f); }} className="space-y-4">
      <ImageUpload value={f.imagem} onChange={v => set('imagem', v)} />
      {!data && <ContractUpload value={f.contrato ?? null} onChange={v => set('contrato', v)} label="Contrato do responsável (PDF)" />}
      <div><label className="label text-card-foreground">Nome *</label><input className="input mt-1.5" required value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Zebra MC9300 - Kappa" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label text-card-foreground">Modelo *</label><input className="input mt-1.5" required value={f.modelo} onChange={e => set('modelo', e.target.value)} /></div>
        <div><label className="label text-card-foreground">Nº Série *</label><input className="input mt-1.5" required value={f.numero_serie} onChange={e => set('numero_serie', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label text-card-foreground">Responsável *</label><input className="input mt-1.5" required value={f.responsavel} onChange={e => set('responsavel', e.target.value)} /></div>
        <div><label className="label text-card-foreground">Departamento</label><input className="input mt-1.5" value={f.departamento} onChange={e => set('departamento', e.target.value)} /></div>
      </div>
      <div><label className="label text-card-foreground">Localização</label><input className="input mt-1.5" value={f.localizacao} onChange={e => set('localizacao', e.target.value)} /></div>
      {data && (
        <div><label className="label text-card-foreground">Status</label>
          <select className="select mt-1.5" value={f.status} onChange={e => set('status', e.target.value)}>
            <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="manutencao">Manutenção</option>
          </select>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-3 border-t border-border">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary">{data ? 'Salvar' : 'Criar Coletor'}</button>
      </div>
    </form>
  );
}

function FormObs({ coletorId, coletores, onSave, onCancel }: { coletorId?: string; coletores: Coletor[]; onSave: (d: any) => void; onCancel: () => void }) {
  const [f, setF] = useState({ titulo: '', descricao: '', causas: '', solucao: '', gravidade: 'media', coletor_id: coletorId || '' });
  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));
  const listRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!f.coletor_id || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-cid="${f.coletor_id}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [f.coletor_id]);
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...f, coletor_id: coletorId || f.coletor_id }); }} className="space-y-4">
      {!coletorId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="label text-card-foreground">Coletor *</label>
              <select className="select mt-1.5" required value={f.coletor_id} onChange={e => set('coletor_id', e.target.value)}>
                <option value="">Selecione...</option>
                {coletores.map(c => <option key={c.id} value={c.id}>{c.nome} — {c.numero_serie}</option>)}
              </select>
            </div>
            <div><label className="label text-card-foreground">Título *</label><input className="input mt-1.5" required value={f.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ex: Leitor de barcode lento" /></div>
            <div><label className="label text-card-foreground">Descrição *</label><textarea className="input mt-1.5 min-h-[80px] resize-none" required value={f.descricao} onChange={e => set('descricao', e.target.value)} /></div>
          </div>
          <div className="obs-picker-panel">
            <p className="obs-picker-title">
              Coletores disponíveis
              {f.coletor_id && <span className="obs-picker-hint">selecionado em destaque</span>}
            </p>
            <div className="obs-picker-list" ref={listRef}>
              {coletores.map(c => {
                const active = c.id === f.coletor_id;
                const gc = c.status === 'ativo' ? '#10b981' : c.status === 'inativo' ? '#ef4444' : '#f59e0b';
                return (
                  <button type="button" key={c.id} data-cid={c.id} onClick={() => set('coletor_id', c.id)}
                    className={`obs-picker-card${active ? ' active' : ''}`}
                    style={active ? { borderColor: gc, boxShadow: `0 0 0 1px ${gc}55, 0 8px 22px ${gc}28, 0 0 18px ${gc}22` } : undefined}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-1.5">
                        {active && <span className="obs-picker-check" style={{ background: gc }}>✓</span>}
                        <p className="font-bold text-sm text-card-foreground truncate">{c.nome}</p>
                        <p className="text-[11px] font-mono text-muted-foreground truncate">{c.numero_serie}</p>
                      </div>
                      <span className={`badge text-[9px] font-bold flex-shrink-0 ${c.status === 'ativo' ? 'badge-success' : c.status === 'inativo' ? 'badge-danger' : 'badge-warning'}`}>
                        {c.status === 'ativo' ? 'Ativo' : c.status === 'inativo' ? 'Inativo' : 'Manut.'}
                      </span>
                    </div>
                    <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
                      <div className="obs-picker-meta"><span className="obs-picker-meta-k">Responsável</span><span className="obs-picker-meta-v">{c.responsavel || '—'}</span></div>
                      <div className="obs-picker-meta"><span className="obs-picker-meta-k">Local</span><span className="obs-picker-meta-v">{c.localizacao || '—'}</span></div>
                      <div className="obs-picker-meta"><span className="obs-picker-meta-k">Depto.</span><span className="obs-picker-meta-v">{c.departamento || '—'}</span></div>
                      <div className="obs-picker-meta"><span className="obs-picker-meta-k">Modelo</span><span className="obs-picker-meta-v truncate">{c.modelo || '—'}</span></div>
                    </div>
                    {active && <div className="obs-picker-selected-bar" style={{ background: `linear-gradient(90deg, ${gc}, transparent)` }} />}
                  </button>
                );
              })}
              {!coletores.length && <p className="text-sm text-muted-foreground text-center py-6">Nenhum coletor cadastrado</p>}
            </div>
          </div>
        </div>
      )}
      {coletorId && (
        <>
          <div><label className="label text-card-foreground">Título *</label><input className="input mt-1.5" required value={f.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ex: Leitor de barcode lento" /></div>
          <div><label className="label text-card-foreground">Descrição *</label><textarea className="input mt-1.5 min-h-[80px] resize-none" required value={f.descricao} onChange={e => set('descricao', e.target.value)} /></div>
        </>
      )}
      <div className={coletorId ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
        <div><label className="label text-card-foreground">Causas</label><textarea className="input mt-1.5 min-h-[60px] resize-none" value={f.causas} onChange={e => set('causas', e.target.value)} placeholder="Ex: Software - engine de decodificação antigo" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label text-card-foreground">Solução</label><input className="input mt-1.5" value={f.solucao} onChange={e => set('solucao', e.target.value)} /></div>
          <div><label className="label text-card-foreground">Gravidade</label>
            <select className="select mt-1.5" value={f.gravidade} onChange={e => set('gravidade', e.target.value)}>
              <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-border">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={!coletorId && !f.coletor_id}>Salvar</button>
      </div>
    </form>
  );
}

function FormUsuario({ data, departamentos, onSave, onCancel }: { data?: any; departamentos: string[]; onSave: (d: any) => void; onCancel: () => void }) {
  const [f, setF] = useState(data || { nome: '', email: '', cargo: 'Operador', departamento: '', status: 'ativo', senha: '', foto: null });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(f); }} className="space-y-4">
      <AvatarUpload value={f.foto ?? null} onChange={v => set('foto', v)} />
      <div><label className="label text-card-foreground">Nome *</label><input className="input mt-1.5" required value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" /></div>
      <div><label className="label text-card-foreground">E-mail / Usuário de login *</label><input className="input mt-1.5" required value={f.email} onChange={e => set('email', e.target.value)} placeholder="admin ou usuario@baeletrica.com" /></div>
      <div>
        <label className="label text-card-foreground">{data ? 'Nova senha (deixe vazio para manter)' : 'Senha de acesso *'}</label>
        <div className="relative mt-1.5">
          <input
            type={mostrarSenha ? 'text' : 'password'}
            className="input pr-12"
            required={!data}
            minLength={data ? 0 : 4}
            value={f.senha || ''}
            onChange={e => set('senha', e.target.value)}
            placeholder={data ? '••••••••' : 'Mínimo 4 caracteres'}
          />
          <button type="button" onClick={() => setMostrarSenha(m => !m)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition p-1"
            title={mostrarSenha ? 'Ocultar' : 'Mostrar'}>
            {mostrarSenha ? I.eye : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            )}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-card-foreground">Cargo</label>
          <NeonSelect value={f.cargo} onChange={v => set('cargo', v)}
            options={[{ value: 'Administrador', label: 'Administrador' }, { value: 'Supervisor', label: 'Supervisor' }, { value: 'Operador', label: 'Operador' }, { value: 'Visitante', label: 'Visitante' }]} />
        </div>
        <div>
          <label className="label text-card-foreground">Departamento</label>
          <NeonSelect value={f.departamento} onChange={v => set('departamento', v)}
            options={[{ value: '', label: '—' }, ...departamentos.map(d => ({ value: d, label: d }))]} />
        </div>
      </div>
      {data && (
        <div>
          <label className="label text-card-foreground">Status</label>
          <NeonSelect value={f.status} onChange={v => set('status', v)}
            options={[{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }]} />
        </div>
      )}
      <div className="flex justify-end gap-2 pt-3 border-t border-border">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary">{data ? 'Salvar' : 'Criar Usuário'}</button>
      </div>
    </form>
  );
}

function FormFotoPerfil({ user, onSave, onCancel }: { user: SessionUser; onSave: (foto: string | null) => Promise<void>; onCancel: () => void }) {
  const [foto, setFoto] = useState<string | null>(user.foto ?? null);
  const [salvando, setSalvando] = useState(false);
  return (
    <form
      className="space-y-5"
      onSubmit={async e => {
        e.preventDefault();
        setSalvando(true);
        try { await onSave(foto); onCancel(); }
        catch { /* toast no pai */ }
        finally { setSalvando(false); }
      }}
    >
      <div className="flex items-center gap-4">
        <Avatar src={foto} nome={user.nome} size="lg" />
        <div className="min-w-0">
          <p className="font-semibold text-card-foreground truncate">{user.nome}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{user.cargo}</p>
        </div>
      </div>
      <AvatarUpload value={foto} onChange={setFoto} />
      <div className="flex justify-end gap-2 pt-3 border-t border-border">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={salvando}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar foto'}</button>
      </div>
    </form>
  );
}

function KPIEditor({ coletor, onSave, onExpand }: { coletor: Coletor; onSave: (d: any) => void; onExpand?: () => void }) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({ ...coletor });
  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));
  useEffect(() => { if (!editing) setF({ ...coletor }); }, [coletor.id, editing, coletor.contrato, coletor.nome]);
  return (
    <div className="card">
      <div className="card-header flex flex-row flex-wrap items-center justify-between gap-3">
        <h3 className="card-title text-card-foreground">Dados do Equipamento</h3>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn btn-outline btn-sm">{I.edit} Editar</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => { setF({ ...coletor }); setEditing(false); }} className="btn btn-outline btn-sm">Cancelar</button>
            <button onClick={async () => { await onSave(f); setEditing(false); showToast('Dados atualizados'); }} className="btn btn-primary btn-sm">{I.save} Salvar</button>
          </div>
        )}
      </div>
      <div className="card-content">
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            <div><label className="label text-card-foreground">Nome</label><input className="input mt-2" value={f.nome} onChange={e => set('nome', e.target.value)} /></div>
            <div><label className="label text-card-foreground">Modelo</label><input className="input mt-2" value={f.modelo} onChange={e => set('modelo', e.target.value)} /></div>
            <div><label className="label text-card-foreground">Nº Série</label><input className="input mt-2" value={f.numero_serie} onChange={e => set('numero_serie', e.target.value)} /></div>
            <div><label className="label text-card-foreground">Responsável</label><input className="input mt-2" value={f.responsavel} onChange={e => set('responsavel', e.target.value)} /></div>
            <div><label className="label text-card-foreground">Departamento</label><input className="input mt-2" value={f.departamento} onChange={e => set('departamento', e.target.value)} /></div>
            <div><label className="label text-card-foreground">Localização</label><input className="input mt-2" value={f.localizacao || ''} onChange={e => set('localizacao', e.target.value)} /></div>
          </div>
        ) : (
          <div className="p-5 md:p-6 bg-muted/50 rounded-xl space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[['Responsável', coletor.responsavel, I.user], ['Departamento', coletor.departamento, I.box], ['Nº Série', coletor.numero_serie, I.box]].map(([l, v, icon]) => (
                <div key={l as string}>
                  <p className="text-2xs md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{l as string}</p>
                  <p className="text-sm md:text-base font-semibold text-card-foreground flex items-center gap-2">{icon}{v as string}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
              <div className="min-w-0 flex-1">
                <p className="text-2xs md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">{I.mapPin} Setor</p>
                <p className="text-sm md:text-base font-semibold text-card-foreground truncate">{coletor.localizacao || coletor.departamento}</p>
              </div>
              {onExpand && (
                <button onClick={onExpand} className="btn btn-outline btn-sm text-primary border-primary/30 hover:border-primary/60 flex-shrink-0">
                  {I.expand} Expandir
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AdvancedSearch({ onSearch, departamentos }: { onSearch: (params: Record<string, string>) => void; departamentos: string[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [depto, setDepto] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const apply = () => {
    const p: Record<string, string> = {};
    if (search) p.search = search;
    if (status) p.status = status;
    if (depto) p.departamento = depto;
    if (localizacao) p.localizacao = localizacao;
    onSearch(p);
  };
  const clear = () => { setSearch(''); setStatus(''); setDepto(''); setLocalizacao(''); onSearch({}); };
  const hasFilters = status || depto || localizacao;
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <input className="input pl-11 h-12 md:h-13" placeholder="Buscar por nome, responsável, modelo, série..." value={search} onChange={e => { setSearch(e.target.value); if (!e.target.value && !hasFilters) onSearch({}); }} onKeyDown={e => e.key === 'Enter' && apply()} />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">{I.search}</span>
        </div>
        <button onClick={() => setOpen(o => !o)} className={`btn btn-outline h-12 md:h-13 gap-2 ${hasFilters ? 'border-primary/50 text-primary shadow-lg shadow-primary/15' : ''}`}>
          {I.filter} Filtros {hasFilters && <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold shadow-md shadow-primary/30">!</span>}
        </button>
        <div className="hidden sm:flex items-center border border-white/10 rounded-xl overflow-hidden shadow-lg">
          <button className="p-3 bg-white/5 text-white/80 border-r border-white/10 hover:bg-white/10 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </button>
          <button className="p-3 text-muted-foreground hover:text-white/80 hover:bg-white/5 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="card p-5 md:p-6 animate-slide-up" style={{ boxShadow: '0 0 20px rgba(59,130,246,0.05), 0 8px 32px rgba(0,0,0,0.3)' }}>
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-sm md:text-base font-semibold text-card-foreground flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">{I.filter}</svg>
              Filtros Avançados
            </h4>
            <button onClick={clear} className="text-xs md:text-sm text-muted-foreground hover:text-primary transition flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              Limpar tudo
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            <div><label className="label text-card-foreground font-semibold">Status</label>
              <select className="select mt-2" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">Todos</option><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="manutencao">Manutenção</option>
              </select>
            </div>
            <div><label className="label text-card-foreground font-semibold">Departamento</label>
              <select className="select mt-2" value={depto} onChange={e => setDepto(e.target.value)}>
                <option value="">Todos</option>{departamentos.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div><label className="label text-card-foreground font-semibold">Localização</label><input className="input mt-2" placeholder="Filtrar local..." value={localizacao} onChange={e => setLocalizacao(e.target.value)} /></div>
            <div className="flex items-end"><button onClick={apply} className="btn btn-primary w-full shadow-lg shadow-primary/25">{I.search} Aplicar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function csvEscape(val: string) { return `"${(val || '').replace(/"/g, '""')}"`; }

function NeonSelect({ value, onChange, options, placeholder = 'Selecione...' }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const sel = options.find(o => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`neon-select-trigger w-full ${open ? 'open' : ''}`}>
        <span className={sel ? 'text-foreground' : 'text-muted-foreground'}>{sel?.label || placeholder}</span>
        <span className={`neon-select-arrow ${open ? 'rotate' : ''}`}>{I.chevD}</span>
      </button>
      {open && (
        <div className="neon-select-menu animate-scale-in">
          {options.map(o => (
            <button key={o.value} type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`neon-select-item ${o.value === value ? 'active' : ''}`}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: o.value === value ? 'hsl(var(--glow))' : 'transparent', boxShadow: o.value === value ? '0 0 6px hsl(var(--glow))' : 'none' }} />
              <span className="truncate">{o.label}</span>
            </button>
          ))}
          {!options.length && <div className="px-4 py-3 text-sm text-muted-foreground">Nenhuma opção</div>}
        </div>
      )}
    </div>
  );
}

function exportCSV(relatorio: any) {
  const header = 'Coletor,Modelo,Responsavel,Departamento,Localizacao,Status,Obs Total,Gravidade,Titulo Obs,Descricao,Causa,Solucao,Data\n';
  const rows: string[] = [];
  for (const c of relatorio.coletores) {
    if (c.observacoes.length === 0) {
      rows.push([csvEscape(c.nome), csvEscape(c.modelo), csvEscape(c.responsavel), csvEscape(c.departamento), csvEscape(c.localizacao), csvEscape(c.status), '0', '', '', '', '', '', ''].join(','));
    } else {
      for (const o of c.observacoes) {
        rows.push([csvEscape(c.nome), csvEscape(c.modelo), csvEscape(c.responsavel), csvEscape(c.departamento), csvEscape(c.localizacao), csvEscape(c.status), String(c.observacoes.length), csvEscape(o.gravidade), csvEscape(o.titulo), csvEscape(o.descricao), csvEscape(o.causas), csvEscape(o.solucao), csvEscape(o.created_at)].join(','));
      }
    }
  }
  const blob = new Blob(['\uFEFF' + header + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `relatorio_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exportado com sucesso', 'info');
}

function lerRotaColetor(): { id: string; de?: string; ate?: string } | null {
  const h = window.location.hash;
  if (!h.startsWith('#/coletor/')) return null;
  const rest = h.slice('#/coletor/'.length);
  const [idRaw, qs] = rest.split('?');
  const id = decodeURIComponent(idRaw || '');
  if (!id) return null;
  const p = new URLSearchParams(qs || '');
  return { id, de: p.get('de') || undefined, ate: p.get('ate') || undefined };
}

function abrirPaginaColetor(id: string, de?: string, ate?: string) {
  const q = de || ate ? `?de=${encodeURIComponent(de || '')}&ate=${encodeURIComponent(ate || '')}` : '';
  window.open(`${window.location.pathname}${window.location.search}#/coletor/${encodeURIComponent(id)}${q}`, '_blank');
}

type PageId = 'dashboard' | 'coletores' | 'detalhe' | 'registros' | 'relatorio' | 'departamentos' | 'usuarios';
type Usuario = { id: string; nome: string; email: string; cargo: string; departamento: string; status: string; foto?: string | null; created_at: string; updated_at?: string };
type DeptoStats = { departamento: string; total: number; ativos: number; manutencao: number };
type SessionUser = { id: string; nome: string; email: string; cargo: string; departamento: string; status: string; foto?: string | null };

function LoginScreen({ onLogin, dark, toggleDark }: { onLogin: (user: SessionUser, token: string) => void; dark: boolean; toggleDark: () => void }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), senha }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Falha no login');
      onLogin(data.user, data.token);
    } catch (err: any) {
      setErro(err.message || 'Usuário ou senha inválidos');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-screen">
      <button onClick={toggleDark} title={dark ? 'Modo claro' : 'Modo escuro'}
        className="login-theme-btn btn btn-ghost btn-icon btn-sm">
        {dark ? I.sun : I.moon}
      </button>

      <div className="login-card animate-scale-in">
        <div className="login-card-glow" />
        <div className="relative z-10">
          {/* Logo + brand */}
          <div className="text-center mb-8">
            <div className="login-logo-wrap">
              <img src="/logo-ba-eletrica.png" alt="BA Elétrica" className="login-logo" />
            </div>
            <h1 className="login-title">BA Elétrica</h1>
            <p className="login-subtitle">Controle de Coletores</p>
            <div className="login-accent-bar" />
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="label login-label">Usuário</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">{I.user}</span>
                <input
                  className="login-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin"
                  autoFocus
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label login-label">Senha</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  type={showSenha ? 'text' : 'password'}
                  className="login-input pr-11"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowSenha(s => !s)}
                  className="login-eye" title={showSenha ? 'Ocultar' : 'Mostrar'}>
                  {showSenha ? I.eye : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  )}
                </button>
              </div>
            </div>

            {erro && (
              <div className="login-erro animate-fade-in">
                {I.alert}
                <span>{erro}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full login-submit" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar no sistema'}
            </button>
          </form>

          <div className="login-hint">
            <span className="login-hint-dot" />
            Acesso padrão: <strong>admin</strong> / <strong>admin123</strong>
          </div>
        </div>
      </div>

      <p className="login-footer">BA Elétrica · Sistema de Gestão de Coletores</p>
    </div>
  );
}

function ColetorFullPage({ id, de, ate, dark, toggleDark }: {
  id: string; de?: string; ate?: string; dark: boolean; toggleDark: () => void;
}) {
  const [c, setC] = useState<Coletor | null>(null);
  const [obsList, setObsList] = useState<Obs[]>([]);
  const [hist, setHist] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [deF, setDeF] = useState(de || '');
  const [ateF, setAteF] = useState(ate || '');
  const [editando, setEditando] = useState(false);
  const [f, setF] = useState<Partial<Coletor>>({});
  const [salvando, setSalvando] = useState(false);
  const [novaObs, setNovaObs] = useState(false);
  const [excluirObs, setExcluirObs] = useState<Obs | null>(null);

  const carregar = async (d1: string, d2: string) => {
    setCarregando(true);
    try {
      const p = new URLSearchParams();
      p.set('coletor_id', id);
      if (d1) p.set('data_inicio', d1 + 'T00:00:00');
      if (d2) p.set('data_fim', d2 + 'T23:59:59');
      const [col, lista, hst] = await Promise.all([
        api(`/api/coletores/${id}`),
        api(`/api/observacoes?${p}`).then((x: any) => (Array.isArray(x) ? x : [])),
        api(`/api/coletores/${id}/historico`).catch(() => []),
      ]);
      setC(col);
      setF(col);
      setObsList(lista);
      setHist(hst);
      setErro(null);
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar o coletor');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(deF, ateF); }, [id]);

  const voltar = () => {
    window.close();
    setTimeout(() => {
      if (!window.closed) window.location.hash = '';
    }, 180);
  };

  const setCampo = (k: keyof Coletor, v: any) => setF(p => ({ ...p, [k]: v }));

  const iniciarEdicao = () => {
    if (!c) return;
    setF({ ...c });
    setEditando(true);
  };

  const cancelarEdicao = () => {
    setEditando(false);
    setF(c ? { ...c } : {});
  };

  const salvarEdicao = async () => {
    if (!f.nome || !f.modelo || !f.numero_serie || !f.responsavel) {
      showToast('Preencha os campos obrigatórios', 'error');
      return;
    }
    setSalvando(true);
    try {
      const atualizado = await api(`/api/coletores/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nome: f.nome,
          modelo: f.modelo,
          numero_serie: f.numero_serie,
          responsavel: f.responsavel,
          departamento: f.departamento || '',
          status: f.status || 'ativo',
          localizacao: f.localizacao || '',
          imagem: f.imagem ?? null,
          contrato: f.contrato ?? null,
        }),
      });
      setC(atualizado);
      setF(atualizado);
      setEditando(false);
      showToast('Coletor atualizado');
      carregar(deF, ateF);
    } catch (e: any) {
      showToast(e.message || 'Erro ao salvar', 'error');
    } finally {
      setSalvando(false);
    }
  };

  const criarObs = async (d: any) => {
    try {
      await api('/api/observacoes', { method: 'POST', body: JSON.stringify(d) });
      showToast('Registro salvo');
      setNovaObs(false);
      carregar(deF, ateF);
    } catch (e: any) { showToast(e.message || 'Erro ao salvar', 'error'); }
  };

  const confirmarExclusao = async () => {
    if (!excluirObs) return;
    try {
      await api(`/api/observacoes/${excluirObs.id}`, { method: 'DELETE' });
      showToast('Registro excluído');
      setExcluirObs(null);
      carregar(deF, ateF);
    } catch (e: any) { showToast(e.message || 'Erro ao excluir', 'error'); setExcluirObs(null); }
  };

  const campoTexto = (rotulo: string, chave: keyof Coletor, opts?: { required?: boolean; mono?: boolean }) => {
    if (!editando) {
      const valor = c ? String((c as any)[chave] ?? '') : '';
      return (
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-primary/45 font-bold mb-1">{rotulo}</p>
          <p className={`text-sm text-card-foreground break-words ${opts?.mono ? 'font-mono' : ''}`}>{valor || '—'}</p>
        </div>
      );
    }
    return (
      <div className="min-w-0">
        <label className="text-[10px] uppercase tracking-widest text-primary/45 font-bold mb-1 block">
          {rotulo}{opts?.required ? ' *' : ''}
        </label>
        <input
          className="input mt-1"
          value={String((f as any)[chave] ?? '')}
          onChange={e => setCampo(chave, e.target.value)}
          required={opts?.required}
        />
      </div>
    );
  };

  const criticas = obsList.filter(o => o.gravidade === 'alta').length;
  const avisos = obsList.filter(o => o.gravidade === 'media').length;
  const infos = obsList.filter(o => o.gravidade === 'baixa').length;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 border-b border-border/60 bg-card/90 backdrop-blur-md">
        <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <button className="btn btn-outline btn-sm" onClick={voltar}>{I.back} Voltar</button>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-ghost btn-icon btn-sm" onClick={toggleDark} title={dark ? 'Modo claro' : 'Modo escuro'}>
              {dark ? I.sun : I.moon}
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => window.print()} disabled={!c}>{I.printer} Imprimir</button>
            {!editando ? (
              <>
                <button className="btn btn-outline btn-sm" onClick={iniciarEdicao} disabled={!c}>{I.edit} Editar</button>
                <button className="btn btn-primary btn-sm" onClick={() => setNovaObs(true)} disabled={!c}>{I.plus} Novo Registro</button>
              </>
            ) : (
              <>
                <button className="btn btn-outline btn-sm" onClick={cancelarEdicao} disabled={salvando}>Cancelar</button>
                <button className="btn btn-primary btn-sm" onClick={salvarEdicao} disabled={salvando}>{I.save} {salvando ? 'Salvando…' : 'Salvar'}</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6 animate-fade-in">
        {carregando && !c ? (
          <div className="card p-12 text-center text-muted-foreground">Carregando…</div>
        ) : erro ? (
          <div className="card p-12 text-center">
            <p className="text-destructive font-semibold mb-4">{erro}</p>
            <button className="btn btn-outline" onClick={() => carregar(deF, ateF)}>{I.refresh} Tentar novamente</button>
          </div>
        ) : c ? (
          <>
              <div className="kpi-header relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-1" style={{ background: 'linear-gradient(180deg, #f0b429, #f59e0b)' }} />
              <div className="absolute left-0 top-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, #f0b429, transparent)' }} />
              {c.imagem && (
                <div className="kpi-header-image">
                  <img src={c.imagem} alt={c.nome} />
                </div>
              )}
              <div className="v-divider hidden md:block" />
              <div className="kpi-header-info">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-primary/50 font-bold mb-1.5">Coletor</p>
                    {editando ? (
                      <>
                        <input className="input text-lg md:text-xl font-bold mb-2" value={String(f.nome ?? '')} onChange={e => setCampo('nome', e.target.value)} placeholder="Nome *" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input className="input font-mono text-sm" value={String(f.numero_serie ?? '')} onChange={e => setCampo('numero_serie', e.target.value)} placeholder="Nº Série *" />
                          <input className="input text-sm" value={String(f.modelo ?? '')} onChange={e => setCampo('modelo', e.target.value)} placeholder="Modelo *" />
                        </div>
                      </>
                    ) : (
                      <>
                        <h2 className="text-2xl md:text-3xl font-bold text-primary" style={{ textShadow: '0 0 10px rgba(59,130,246,0.25)' }}>{c.nome}</h2>
                        <p className="text-sm md:text-base text-primary/70 font-mono mt-1.5">{c.numero_serie} · {c.modelo}</p>
                      </>
                    )}
                  </div>
                  {editando ? (
                    <select className="select" value={String(f.status || 'ativo')} onChange={e => setCampo('status', e.target.value)}>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                      <option value="manutencao">Manutenção</option>
                    </select>
                  ) : (
                    <StatusBadge s={c.status} />
                  )}
                </div>
              </div>
            </div>

            <div className="card p-4 md:p-5">
              <h3 className="text-[11px] uppercase tracking-widest text-primary/50 font-bold mb-4">Dados do coletor</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {campoTexto('Nome', 'nome', { required: true })}
                {campoTexto('Modelo', 'modelo', { required: true })}
                {campoTexto('Nº Série', 'numero_serie', { required: true, mono: true })}
                {editando ? (
                  <div className="min-w-0">
                    <label className="text-[10px] uppercase tracking-widest text-primary/45 font-bold mb-1 block">Status *</label>
                    <select className="select mt-1" value={String(f.status || 'ativo')} onChange={e => setCampo('status', e.target.value)}>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                      <option value="manutencao">Manutenção</option>
                    </select>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-primary/45 font-bold mb-1">Status</p>
                    <StatusBadge s={c.status} />
                  </div>
                )}
              </div>
            </div>

            <div className="card p-4 md:p-5">
              <h3 className="text-[11px] uppercase tracking-widest text-primary/50 font-bold mb-4">Responsável e Setor</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {campoTexto('Responsável', 'responsavel', { required: true })}
                {campoTexto('Departamento', 'departamento')}
                {campoTexto('Setor', 'localizacao')}
              </div>
              {editando && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <ImageUpload value={(f.imagem as string | null) ?? null} onChange={v => setCampo('imagem', v)} />
                </div>
              )}
            </div>

            <ContratoUnico coletorId={id} contrato={c?.contrato} onChanged={col => { setC(col); setF(col); }} />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="stat-card kpi-mini text-center" style={{ '--kpi-accent': '#3b82f6' } as React.CSSProperties}><p className="text-2xl md:text-3xl font-bold text-primary tabular-nums">{obsList.length}</p><p className="text-2xs md:text-xs font-bold text-primary/60 uppercase tracking-widest mt-1.5">Registros</p></div>
              <div className="stat-card kpi-mini text-center" style={{ '--kpi-accent': '#ef4444' } as React.CSSProperties}><p className="text-2xl md:text-3xl font-bold text-destructive tabular-nums">{criticas}</p><p className="text-2xs md:text-xs font-bold text-primary/60 uppercase tracking-widest mt-1.5">Críticas</p></div>
              <div className="stat-card kpi-mini text-center" style={{ '--kpi-accent': '#f59e0b' } as React.CSSProperties}><p className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: 'hsl(38 92% 50%)' }}>{avisos}</p><p className="text-2xs md:text-xs font-bold text-primary/60 uppercase tracking-widest mt-1.5">Avisos</p></div>
              <div className="stat-card kpi-mini text-center" style={{ '--kpi-accent': '#3b82f6' } as React.CSSProperties}><p className="text-2xl md:text-3xl font-bold text-primary tabular-nums">{infos}</p><p className="text-2xs md:text-xs font-bold text-primary/60 uppercase tracking-widest mt-1.5">Informativos</p></div>
            </div>

            <div className="card p-4 md:p-5">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="label text-card-foreground">De</label>
                  <input type="date" className="input mt-1.5" value={deF} onChange={e => setDeF(e.target.value)} />
                </div>
                <div>
                  <label className="label text-card-foreground">Até</label>
                  <input type="date" className="input mt-1.5" value={ateF} onChange={e => setAteF(e.target.value)} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => carregar(deF, ateF)}>{I.filter} Filtrar</button>
                {(deF || ateF) && (
                  <button className="btn btn-outline btn-sm" onClick={() => { setDeF(''); setAteF(''); carregar('', ''); }}>Limpar</button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg md:text-xl font-bold text-primary">Registros <span className="text-primary/60 font-normal text-sm">({obsList.length})</span></h3>
              <button className="btn btn-primary btn-sm" onClick={() => setNovaObs(true)}>{I.plus} Novo Registro</button>
            </div>
            {obsList.length === 0 ? (
              <div className="card p-10 text-center text-muted-foreground">Nenhum registro no período selecionado.</div>
            ) : (
              <div className="space-y-4">
                {obsList.map((o, i) => (
                  <div key={o.id} className="obs-card animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                    <div className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-primary">{o.titulo}</h4>
                          <p className="text-xs text-primary/60 mt-1">{I.clock} {new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <GravBadge g={o.gravidade} />
                          <button onClick={() => setExcluirObs(o)} className="text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-destructive/10 transition" title="Excluir registro">{I.trash}</button>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-primary/80 leading-relaxed">{o.descricao}</p>
                        {o.causas && <div className="cause-box"><p className="cause-label">Causa</p><p className="cause-text">{o.causas}</p></div>}
                        {o.solucao && <div className="solution-box"><p className="solution-label">Solução</p><p className="solution-text">{o.solucao}</p></div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="card p-5 md:p-6">
              <h3 className="font-bold text-card-foreground mb-4">Histórico de alterações</h3>
              {hist.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem alterações registradas.</p>
              ) : (
                <div className="space-y-3">
                  {hist.slice(0, 30).map((h: any) => (
                    <div key={h.id} className="flex flex-wrap items-start gap-3 text-sm border-b border-border/50 pb-3 last:border-0">
                      <span className="badge badge-secondary flex-shrink-0">{String(h.acao || '').replace(/_/g, ' ')}</span>
                      <div className="flex-1 min-w-0">
                        {h.campo === 'observacao' ? (
                          <p className="text-card-foreground">{h.valor_antigo || h.valor_novo}</p>
                        ) : (
                          <p className="text-card-foreground">
                            <b>{h.campo}:</b> {h.valor_antigo || '—'} → {h.valor_novo || '—'}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">{h.created_at ? new Date(h.created_at).toLocaleString('pt-BR') : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}

        <Modal open={novaObs} onClose={() => setNovaObs(false)} title="Novo Registro" desc="Registre uma observação." size="xl">
          <FormObs coletorId={id} coletores={c ? [c] : []} onSave={criarObs} onCancel={() => setNovaObs(false)} />
        </Modal>
        <Modal open={!!excluirObs} onClose={() => setExcluirObs(null)} title="Confirmar Exclusão" size="sm">
          <p className="text-sm text-muted-foreground mb-5">Excluir o registro <b className="text-card-foreground">{excluirObs?.titulo}</b>? Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-2">
            <button className="btn btn-outline" onClick={() => setExcluirObs(null)}>Cancelar</button>
            <button className="btn btn-danger" onClick={confirmarExclusao}>{I.trash} Excluir</button>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('dark');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [stats, setStats] = useState<Dashboard | null>(null);
  const [coletores, setColetores] = useState<Coletor[]>([]);
  const [obs, setObs] = useState<Obs[]>([]);
  const [selected, setSelected] = useState<Coletor | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatorio, setRelatorio] = useState<any>(null);
  const [reportKpi, setReportKpi] = useState<string | null>(null);
  const [resumoKpi, setResumoKpi] = useState<{ titulo: string; hex: string; acao: string } | null>(null);
  const [relInicio, setRelInicio] = useState('');
  const [relFim, setRelFim] = useState('');
  const [relDeptos, setRelDeptos] = useState('');
  const [relStatus, setRelStatus] = useState('');
  const [deleteId, setDeleteId] = useState<{ type: string; id: string } | null>(null);
  const [departamentos, setDepartamentos] = useState<string[]>([]);
  const [obsFilter, setObsFilter] = useState('');
  const [obsSearch, setObsSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [config, setConfig] = useState<ConfigApp>(() => carregarConfig());
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [notifsLidas, setNotifsLidas] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('notifs_lidas');
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch { return new Set(); }
  });
  const [notifsAberto, setNotifsAberto] = useState(false);
  const [ultimoAberto, setUltimoAberto] = useState(() => localStorage.getItem('notifs_aberto') || '1970-01-01T00:00:00.000Z');
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem('user');
      const tok = localStorage.getItem('token');
      if (raw && tok) return JSON.parse(raw);
    } catch {}
    return null;
  });

  const sessionId = sessionUser?.id ?? null;

  const [rotaColetor, setRotaColetor] = useState(() => lerRotaColetor());
  useEffect(() => {
    const onHash = () => setRotaColetor(lerRotaColetor());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const handleLogin = (user: SessionUser, token: string) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    setError(null);
    setPage('dashboard');
    setSessionUser(user);
    // puxa config salva deste usuário
    void (async () => {
      try {
        const remota = await api('/api/config');
        if (remota && typeof remota === 'object') setConfig(mesclarConfig(remota));
      } catch { /* mantém local */ }
    })();
  };

  const handleLogout = async () => {
    try { await api('/api/logout', { method: 'POST' }); } catch {}
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setSessionUser(null);
    setPage('dashboard');
    setLoading(true);
    setError(null);
    showToast('Sessão encerrada', 'info');
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('light', !dark);
    localStorage.setItem('dark', String(dark));
  }, [dark]);

  // Aplica preferências (wallpaper, accent, compact, anim, flags de toast)
  // + sincroniza com o servidor por usuário (debounce)
  const configSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    aplicarConfig(config);
    salvarConfig(config);
    setCfgToastFlags(config.toasts, config.silencio);
    if (configSyncRef.current) clearTimeout(configSyncRef.current);
    if (!sessionId) return;
    configSyncRef.current = setTimeout(() => {
      void api('/api/config', { method: 'PUT', body: JSON.stringify(config) }).catch(() => {});
    }, 400);
    return () => {
      if (configSyncRef.current) clearTimeout(configSyncRef.current);
    };
  }, [config, sessionId]);

  // Hidrata config remota do usuário logado
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const remota = await api('/api/config');
        if (!cancelled && remota && typeof remota === 'object') {
          setConfig(prev => {
            const next = mesclarConfig(remota);
            // mantém preferência local mais fresca se o servidor não tiver o campo
            return next;
          });
        }
      } catch { /* offline / 401: mantém localStorage */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Tema resolvido a partir das configurações (claro/escuro/sistema)
  useEffect(() => {
    setDark(resolverDark(config, false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.tema]);

  // Tema do sistema quando tema = 'sistema'
  useEffect(() => {
    if (config.tema !== 'sistema') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => setDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [config.tema]);

  const carregarNotificacoes = useCallback(async () => {
    if (!sessionId) return;
    try {
      const lista: Notificacao[] = await api('/api/notificacoes?limit=50');
      const filtradas = lista.filter(n => {
        if (n.tipo === 'edicao') return config.tipos.edicao;
        if (n.tipo === 'registro_criado') return config.tipos.criado;
        if (n.tipo === 'registro_excluido') return config.tipos.excluido;
        if (n.tipo === 'critica') return config.tipos.critica;
        return true;
      });
      setNotificacoes(filtradas);
    } catch { /* offline: mantém cache */ }
  }, [sessionId, config.tipos.edicao, config.tipos.criado, config.tipos.excluido, config.tipos.critica]);

  useEffect(() => { carregarNotificacoes(); }, [carregarNotificacoes]);

  const marcarLida = (id: string) => {
    setNotifsLidas(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('notifs_lidas', JSON.stringify([...next].slice(-300)));
      return next;
    });
  };

  const marcarTodas = () => {
    setNotifsLidas(new Set(notificacoes.map(n => n.id)));
    localStorage.setItem('notifs_lidas', JSON.stringify(notificacoes.map(n => n.id)));
    const agora = new Date().toISOString();
    setUltimoAberto(agora);
    localStorage.setItem('notifs_aberto', agora);
  };

  const fecharDrawerNotifs = (open: boolean) => {
    setNotifsAberto(open);
    if (open) {
      const agora = new Date().toISOString();
      setUltimoAberto(agora);
      localStorage.setItem('notifs_aberto', agora);
    }
  };

  const limparNotifsLidas = () => {
    setNotifsLidas(new Set());
    localStorage.removeItem('notifs_lidas');
    showToast('Notificações limpas', 'info');
  };

  const abrirColetorNotif = (coletorId: string) => {
    setNotifsAberto(false);
    void loadDetalheNotif(coletorId);
  };

  const loadDetalheNotif = async (id: string) => {
    try {
      const c: Coletor = await api(`/api/coletores/${id}`);
      setSelected(c);
      setObs(c.observacoes || []);
      setPage('detalhe');
      setError(null);
      window.scrollTo(0, 0);
    } catch {
      showToast('Coletor não encontrado', 'error');
    }
  };

  // Restaura tema imediatamente antes da hidratação (evita flash)
  useEffect(() => {
    const stored = localStorage.getItem('dark');
    const isDark = stored !== null ? stored === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
  }, []);

  const loadStats = useCallback(async () => { try { setStats(await api('/api/dashboard')); } catch {} }, []);
  const loadColetores = useCallback(async (params?: string) => { try { setColetores(await api(`/api/coletores${params ? '?' + params : ''}`)); } catch {} }, []);
  const loadObs = useCallback(async (params?: string) => { try { setObs(await api(`/api/observacoes${params ? '?' + params : ''}`)); } catch {} }, []);
  const loadDeptos = useCallback(async () => { try { setDepartamentos(await api('/api/coletores/departamentos')); } catch {} }, []);
  const [deptosStats, setDeptosStats] = useState<DeptoStats[]>([]);
  const loadDeptosStats = useCallback(async () => { try { setDeptosStats(await api('/api/departamentos')); } catch {} }, []);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const loadUsuarios = useCallback(async () => { try { setUsuarios(await api('/api/usuarios')); } catch {} }, []);

  // Carrega dados iniciais quando há sessão salva (sobrevive a F5)
  // Depende de sessionId (primitivo) + loaders estáveis para não re disparar por identidade de objeto
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        await Promise.all([loadStats(), loadColetores(), loadDeptos()]);
      } catch {
        if (!cancelled) setError('Erro ao carregar dados. Verifique se o servidor está rodando.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId, loadStats, loadColetores, loadDeptos]);

  // Auto-refresh em tempo real (polling leve quando logado)
  // Usa refs de página/filtros para o interval não ser recriado a cada digitação
  const pageRef = useRef(page);
  const obsFilterRef = useRef(obsFilter);
  const obsSearchRef = useRef(obsSearch);
  useEffect(() => { pageRef.current = page; }, [page]);
  useEffect(() => { obsFilterRef.current = obsFilter; }, [obsFilter]);
  useEffect(() => { obsSearchRef.current = obsSearch; }, [obsSearch]);

  useEffect(() => {
    if (!sessionId) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      loadStats();
      const p = pageRef.current;
      if (p === 'registros') {
        const params: Record<string, string> = {};
        if (obsFilterRef.current) params.gravidade = obsFilterRef.current;
        if (obsSearchRef.current) params.search = obsSearchRef.current;
        loadObs(new URLSearchParams(params).toString());
      }
      if (p === 'usuarios') loadUsuarios();
      if (p === 'departamentos') loadDeptosStats();
      if (p === 'coletores') loadColetores();
      carregarNotificacoes();
    }, 15000);
    return () => window.clearInterval(id);
  }, [sessionId, loadStats, loadObs, loadUsuarios, loadDeptosStats, loadColetores, carregarNotificacoes]);

  // Recarrega dados ao voltar para a aba (foco) — sincroniza entre janelas
  useEffect(() => {
    if (!sessionId) return;
    const onFocus = () => {
      loadStats();
      loadColetores();
      carregarNotificacoes();
    };
    const onVisibility = () => { if (!document.hidden) onFocus(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [sessionId, loadStats, loadColetores, carregarNotificacoes]);

  useEffect(() => {
    if (page === 'dashboard') { loadStats(); loadColetores(); }
    if (page === 'registros') { loadObs(); loadColetores(); loadDeptos(); }
    if (page === 'coletores') { loadColetores(); loadDeptos(); }
    if (page === 'relatorio') { loadDeptos(); }
    if (page === 'departamentos') { loadDeptosStats(); }
    if (page === 'usuarios') { loadUsuarios(); }
  }, [page, loadStats, loadColetores, loadObs, loadDeptos, loadDeptosStats, loadUsuarios]);

  useEffect(() => {
    if (page !== 'registros') return;
    const p: Record<string, string> = {};
    if (obsFilter) p.gravidade = obsFilter;
    if (obsSearch) p.search = obsSearch;
    loadObs(new URLSearchParams(p).toString());
  }, [obsFilter, obsSearch, page, loadObs]);

  const go = (p: PageId, c?: Coletor) => {
    setPage(p);
    if (c) setSelected(c);
    else if (p !== 'detalhe') setSelected(null);
    setError(null);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setTimeout(() => { window.scrollTo(0, 0); }, 50);
    setTimeout(() => { window.scrollTo(0, 0); }, 200);
    setTimeout(() => { window.scrollTo(0, 0); }, 500);
  };

  const loadDetalhe = async (id: string) => {
    try { const c: Coletor = await api(`/api/coletores/${id}`); setSelected(c); setObs(c.observacoes || []); window.scrollTo(0, 0); }
    catch { showToast('Erro ao carregar detalhes', 'error'); go('coletores'); }
  };

  useEffect(() => {
    if (page === 'detalhe' && selected) {
      loadDetalhe(selected.id).then(() => { window.scrollTo(0, 0); });
    }
  }, [page]);

  const saveColetor = async (d: any) => {
    try {
      if (modal === 'editar' && selected) {
        await api(`/api/coletores/${selected.id}`, { method: 'PUT', body: JSON.stringify(d) });
        showToast('Coletor atualizado');
        if (page === 'detalhe') await loadDetalhe(selected.id);
      } else {
        await api('/api/coletores', { method: 'POST', body: JSON.stringify(d) });
        showToast('Coletor criado');
      }
      setModal(null); loadColetores(); loadStats(); loadDeptos(); carregarNotificacoes();
    } catch (e: any) { showToast(e.message || 'Erro ao salvar coletor', 'error'); }
  };

  const saveKPIColetor = async (d: any) => {
    try { await api(`/api/coletores/${d.id}/kpi`, { method: 'PUT', body: JSON.stringify(d) }); await loadDetalhe(d.id); loadColetores(); carregarNotificacoes(); }
    catch (e: any) { showToast(e.message || 'Erro ao atualizar', 'error'); }
  };

  const doDelete = async () => {
    if (!deleteId) return;
    try {
      if (deleteId.type === 'coletor') { await api(`/api/coletores/${deleteId.id}`, { method: 'DELETE' }); showToast('Coletor excluído'); go('coletores'); }
      else if (deleteId.type === 'usuario') { await api(`/api/usuarios/${deleteId.id}`, { method: 'DELETE' }); showToast('Usuário excluído'); }
      else { await api(`/api/observacoes/${deleteId.id}`, { method: 'DELETE' }); showToast('Registro excluído'); if (selected) await loadDetalhe(selected.id); }
      setModal(null); setDeleteId(null); loadStats(); carregarNotificacoes();
    } catch (e: any) { showToast(e.message || 'Erro ao excluir', 'error'); setModal(null); setDeleteId(null); }
    finally { loadUsuarios(); }
  };

  const saveObs = async (d: any) => {
    try {
      await api('/api/observacoes', { method: 'POST', body: JSON.stringify(d) });
      setModal(null); showToast('Registro salvo'); if (selected) await loadDetalhe(selected.id); loadStats(); carregarNotificacoes();
    } catch (e: any) { showToast(e.message || 'Erro ao salvar', 'error'); }
  };

  const saveUsuario = async (d: any) => {
    try {
      if (modal === 'editarUsuario' && selected) {
        const body = { ...d };
        if (!body.senha) delete body.senha; // não reenvia senha vazia
        const atualizado = await api(`/api/usuarios/${(selected as any).id}`, { method: 'PUT', body: JSON.stringify(body) });
        if (sessionUser && atualizado?.id === sessionUser.id) {
          const next = { ...sessionUser, ...atualizado } as SessionUser;
          localStorage.setItem('user', JSON.stringify(next));
          setSessionUser(next);
        }
        showToast('Usuário atualizado');
      } else {
        await api('/api/usuarios', { method: 'POST', body: JSON.stringify(d) });
        showToast('Usuário criado com sucesso');
      }
      setModal(null); loadUsuarios();
    } catch (e: any) { showToast(e.message || 'Erro ao salvar usuário', 'error'); }
  };

  const salvarFotoPerfil = async (foto: string | null) => {
    if (!sessionUser) return;
    try {
      const body: any = {
        nome: sessionUser.nome,
        email: sessionUser.email,
        cargo: sessionUser.cargo,
        departamento: sessionUser.departamento || '',
        status: sessionUser.status || 'ativo',
        foto,
      };
      const atualizado = await api(`/api/usuarios/${sessionUser.id}`, { method: 'PUT', body: JSON.stringify(body) });
      const next = { ...sessionUser, foto: foto ?? null } as SessionUser;
      if (atualizado) Object.assign(next, atualizado, { foto: foto ?? null });
      localStorage.setItem('user', JSON.stringify(next));
      setSessionUser(next);
      showToast('Foto de perfil salva');
      void loadUsuarios();
    } catch (e: any) {
      showToast(e.message || 'Erro ao salvar foto', 'error');
      throw e;
    }
  };

  const gerarRelatorio = async () => {
    try {
      const p = new URLSearchParams();
      if (relInicio) p.set('inicio', relInicio + 'T00:00:00');
      if (relFim) p.set('fim', relFim + 'T23:59:59');
      if (relDeptos) p.set('departamentos', relDeptos);
      if (relStatus) p.set('status', relStatus);
      setRelatorio(await api(`/api/relatorio?${p}`));
    } catch (e: any) { showToast(e.message || 'Erro ao gerar relatório', 'error'); }
  };

  const [gerandoSaida, setGerandoSaida] = useState<'pdf' | 'doc' | null>(null);

  const exportPDF = async (relatorio: any, opts?: { nome?: string; isolado?: boolean }) => {
    if (gerandoSaida) return;
    setGerandoSaida('pdf');
    showToast('Gerando PDF…', 'info');
    try {
      const g = await import('./gerador');
      await g.baixarPDF(relatorio, { ...opts, design: config.pdfDesign });
      showToast(opts?.nome ? `PDF de ${opts.nome} exportado` : 'PDF exportado', 'info');
    } catch (e) {
      console.error('PDF export failed:', e);
      showToast('Erro ao exportar PDF', 'error');
    } finally {
      setGerandoSaida(null);
    }
  };

  const exportDOC = async (relatorio: any, opts?: { nome?: string; isolado?: boolean }) => {
    if (gerandoSaida) return;
    setGerandoSaida('doc');
    showToast('Gerando Word…', 'info');
    try {
      const g = await import('./gerador');
      await g.baixarDOC(relatorio, { ...opts, design: config.pdfDesign });
      showToast('Documento Word exportado', 'info');
    } catch (e) {
      console.error('DOC export failed:', e);
      showToast('Erro ao exportar Word', 'error');
    } finally {
      setGerandoSaida(null);
    }
  };

  const exportColetorPDF = (c: any) => {
    if (!relatorio) { showToast('Gere o relatório antes de exportar', 'error'); return; }
    const lo: any[] = c.observacoes || [];
    exportPDF({
      ...relatorio,
      coletores: [c],
      resumo: {
        ...relatorio.resumo,
        totalColetores: 1,
        comObservacoes: lo.length > 0 ? 1 : 0,
        totalObs: lo.length,
        criticas: lo.filter((o: any) => o.gravidade === 'alta').length,
        avisos: lo.filter((o: any) => o.gravidade === 'media').length,
      },
    }, { nome: c.nome, isolado: true });
  };

  const openKPI = async (c: Coletor) => {
    setSelected(c);
    setModal('kpi');
    try {
      const full: Coletor = await api(`/api/coletores/${c.id}`);
      setSelected(prev => (prev && (prev as any).id === full.id) ? full : prev);
      setObs(full.observacoes || []);
    } catch {
      /* mantém dados parciais; não navega para longe do modal */
    }
  };

  const nav = [
    { id: 'dashboard' as PageId, icon: I.home, label: 'Dashboard' },
    { id: 'coletores' as PageId, icon: I.box, label: 'Coletores' },
    { id: 'registros' as PageId, icon: I.eye, label: 'Registros' },
    { id: 'relatorio' as PageId, icon: I.file, label: 'Relatórios' },
    { id: 'departamentos' as PageId, icon: I.dept, label: 'Departamentos' },
    { id: 'usuarios' as PageId, icon: I.users, label: 'Usuários' },
  ];

  const timeSince = (d: string) => {
    const m = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000));
    if (m < 1) return 'agora'; if (m < 60) return `${m}min`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  const pageTitle = useMemo(() => {
    if (page === 'detalhe') return selected?.nome || 'Detalhe';
    const m: Record<string, string> = { dashboard: 'Dashboard', coletores: 'Coletores', registros: 'Registros', relatorio: 'Relatórios', departamentos: 'Departamentos', usuarios: 'Usuários' };
    return m[page] || '';
  }, [page, selected]);

  // ═══ PÁGINA COMPLETA DO COLETOR (rota #/coletor/:id) ═══
  if (rotaColetor) {
    return (
      <>
        <Toasts />
        <ColetorFullPage id={rotaColetor.id} de={rotaColetor.de} ate={rotaColetor.ate} dark={dark} toggleDark={() => setDark(d => !d)} />
      </>
    );
  }

  // ═══ GATE DE LOGIN ═══
  if (!sessionUser) {
    return (
      <>
        <Toasts />
        <LoginScreen onLogin={handleLogin} dark={dark} toggleDark={() => setDark(d => !d)} />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-transparent">
      {/* ═══ SIDEBAR OVERLAY (mobile) ═══ */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ═══ SIDEBAR ═══ */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ background: 'linear-gradient(180deg, hsl(222 55% 4%) 0%, hsl(222 50% 6%) 50%, hsl(222 48% 5%) 100%)', boxShadow: '1px 0 24px rgba(0,0,0,0.4), 1px 0 40px rgba(59,130,246,0.1)' }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.12 }} aria-hidden="true">
          <defs>
            <pattern id="circuit" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="none"/>
              <path d="M0 20h8M32 20h8M20 0v8M20 32v8" stroke="#3b82f6" strokeWidth="1" fill="none"/>
              <rect x="17" y="17" width="6" height="6" rx="1" stroke="#3b82f6" strokeWidth="1" fill="none"/>
              <circle cx="4" cy="4" r="2" fill="#3b82f6"/>
              <circle cx="36" cy="4" r="2" fill="#3b82f6"/>
              <circle cx="4" cy="36" r="2" fill="#3b82f6"/>
              <circle cx="36" cy="36" r="2" fill="#3b82f6"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)"/>
        </svg>
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06] relative z-10" style={{ boxShadow: '0 1px 0 rgba(59,130,246,0.15)' }}>
          <img src="/logo-ba-eletrica.png" alt="BA Elétrica" className="h-11 w-auto object-contain flex-shrink-0" style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.4)) drop-shadow(0 0 20px rgba(59,130,246,0.2))' }} />
          <div>
            <h1 className="text-[13px] font-bold text-white leading-tight">BA Elétrica</h1>
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] mt-0.5" style={{ color: 'hsl(217 91% 70%)', textShadow: '0 0 6px rgba(59,130,246,0.4)' }}>Controle de Coletores</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto relative z-10">
          <p className="px-3 pt-2 pb-3 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'hsl(217 91% 65% / 0.6)' }}>Menu</p>
          {nav.map(n => (
            <button key={n.id} onClick={() => go(n.id)} className={`nav-item ${page === n.id || (n.id === 'coletores' && page === 'detalhe') ? 'active' : ''}`}>
              {n.icon}{n.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/[0.06]">
          <button onClick={() => { go('coletores'); setTimeout(() => setModal('novo'), 150); }} className="btn btn-primary w-full text-sm shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow">{I.plus} Novo Coletor</button>
        </div>
        <div className="px-5 py-3 border-t border-white/[0.06]"><p className="text-[9px] text-white/15 font-medium">v2.08</p></div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main className="flex-1 md:ml-64 min-h-screen">
        <header className="sticky top-0 z-30 backdrop-blur-xl border-b border-white/[0.06] bg-background/80">
          <div className="flex items-center justify-between px-4 md:px-6 h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="btn btn-ghost btn-icon md:hidden">{I.menu}</button>
              {page === 'detalhe' && <button onClick={() => go('coletores')} className="btn btn-ghost btn-sm text-muted-foreground">{I.back}</button>}
              <div className="hidden md:flex items-center gap-3">
                  <img src="/logo-ba-eletrica.png" alt="BA Elétrica" className="h-9 w-auto object-contain drop-shadow-md" />
                  <div>
                    <h1 className="text-base font-bold text-white">BA Elétrica - Controle de Coletores</h1>
                  </div>
                </div>
              <h1 className="text-lg font-bold text-white md:hidden">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-4">
              {stats && (
                <div className="hidden md:flex items-center gap-3">
                  <span className="flex items-center gap-1.5 badge badge-success text-xs font-semibold px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block shadow-sm shadow-green-400/50"></span>
                    Ativos: {stats.ativos}
                  </span>
                  <span className="flex items-center gap-1.5 badge badge-warning text-xs font-semibold px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400/50"></span>
                    Manutenção: {stats.manutencao}
                  </span>
                  <span className="flex items-center gap-1.5 badge badge-danger text-xs font-semibold px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block shadow-sm shadow-red-400/50"></span>
                    Inativos: {stats.inativos}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModal('perfil')}
                  className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/25 hover:border-primary/50 transition cursor-pointer"
                  title={`${sessionUser.email} · ${sessionUser.cargo} · Clique para editar foto`}
                >
                  <Avatar src={sessionUser.foto} nome={sessionUser.nome} size="sm" />
                  <div className="hidden lg:block leading-tight text-left">
                    <p className="text-xs font-semibold text-foreground">{sessionUser.nome}</p>
                    <p className="text-2xs text-muted-foreground">{sessionUser.cargo}</p>
                  </div>
                </button>
                <SinoNotificacoes
                  open={notifsAberto}
                  onOpenChange={fecharDrawerNotifs}
                  itens={notificacoes}
                  lidas={notifsLidas}
                  ultimoAberto={ultimoAberto}
                  onMarcarLida={marcarLida}
                  onMarcarTodas={marcarTodas}
                  onAbrirColetor={abrirColetorNotif}
                  onAtualizar={carregarNotificacoes}
                />
                <button
                  type="button"
                  onClick={() => setModal('config')}
                  title="Configurações"
                  aria-label="Configurações"
                  className="btn btn-ghost btn-icon btn-sm text-muted-foreground hover:text-primary transition"
                >
                  {engrenagemSvg()}
                </button>
                <button
                  onClick={() => {
                    const proximo = !dark;
                    setDark(proximo);
                    setConfig(c => ({ ...c, tema: proximo ? 'escuro' : 'claro' }));
                  }}
                  title={dark ? 'Modo claro' : 'Modo escuro'}
                  className="btn btn-ghost btn-icon btn-sm text-muted-foreground hover:text-primary transition"
                >{dark ? I.sun : I.moon}</button>
                <button onClick={handleLogout} title="Sair" className="btn btn-outline btn-sm text-muted-foreground hover:text-destructive gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="page-container py-6 md:py-8 lg:py-10 space-y-8">
          {error && (
            <div className="card p-12 text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">{I.err}</div>
              <h3 className="text-lg font-bold text-card-foreground mb-1">Erro ao carregar</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <button onClick={() => { setError(null); setLoading(true); Promise.all([loadStats(), loadColetores(), loadDeptos()]).then(() => setLoading(false)); }} className="btn btn-primary">{I.refresh} Tentar novamente</button>
            </div>
          )}

          {loading && !error && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <div key={i} className="card p-5 space-y-3"><div className="skeleton h-3 w-24" /><div className="skeleton h-8 w-16" /></div>)}</div>
          )}

          {/* ═══ DASHBOARD ═══ */}
          {!loading && !error && page === 'dashboard' && stats && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: 'Total', val: stats.total, icon: I.box, color: 'text-primary', bg: 'bg-primary/10', hex: '#3b82f6', go: () => go('coletores') },
                  { label: 'Ativos', val: stats.ativos, icon: I.check, color: 'text-success', bg: 'bg-success/10', hex: '#10b981', go: () => go('coletores') },
                  { label: 'Manutenção', val: stats.manutencao, icon: I.warn, color: 'text-warning', bg: 'bg-warning/10', hex: '#f59e0b', go: () => go('coletores') },
                  { label: 'Registros', val: stats.observacoes, icon: I.eye, color: 'text-info', bg: 'bg-info/10', hex: '#0ea5e9', go: () => go('registros') },
                ].map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={s.go}
                    className="stat-card kpi-hero animate-fade-in text-left w-full cursor-pointer"
                    style={{ animationDelay: `${i * 0.05}s`, '--kpi-accent': s.hex } as React.CSSProperties}
                    title={`Abrir ${s.label}`}
                  >
                    <div className="kpi-hero-glow" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] md:text-xs font-bold uppercase tracking-[0.14em]" style={{ color: s.hex }}>{s.label}</span>
                        <div className="kpi-hero-icon" style={{ background: `${s.hex}18`, color: s.hex, boxShadow: `0 0 18px ${s.hex}30` }}>{s.icon}</div>
                      </div>
                      <p className="text-3xl md:text-4xl font-extrabold tabular-nums tracking-tight" style={{ color: 'hsl(var(--card-foreground))' }}>{s.val}</p>
                      <div className="kpi-hero-bar" style={{ background: `linear-gradient(90deg, ${s.hex}, transparent)` }} />
                      <p className="text-[11px] font-medium mt-2 opacity-60" style={{ color: s.hex }}>Clique para abrir</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card animate-slide-up">
                  <div className="card-header pb-3"><h3 className="card-title text-card-foreground">Distribuição de Status</h3></div>
                  <div className="card-content">
                    <DonutChart data={[
                      { label: 'Ativos', value: stats.ativos, color: '#10b981' },
                      { label: 'Manutenção', value: stats.manutencao, color: '#f59e0b' },
                      { label: 'Inativos', value: stats.inativos, color: '#ef4444' },
                    ]} />
                  </div>
                </div>
                <div className="card animate-slide-up stagger-2">
                   <div className="card-header pb-3"><h3 className="card-title text-card-foreground">Registros por Gravidade</h3></div>
                  <div className="card-content space-y-4">
                    {[{ l: 'Críticas', v: stats.criticas, c: 'bg-red-500', b: 'border-l-red-500', shadow: 'shadow-red-500/20' }, { l: 'Avisos', v: stats.avisos, c: 'bg-amber-500', b: 'border-l-amber-500', shadow: 'shadow-amber-500/20' }, { l: 'Informativo', v: stats.infos, c: 'bg-blue-500', b: 'border-l-blue-500', shadow: 'shadow-blue-500/20' }].map(x => (
                      <div key={x.l} className={`flex items-center gap-4 p-4 md:p-5 rounded-xl border-l-4 ${x.b} bg-muted/50 shadow-lg ${x.shadow}`}>
                        <div className={`w-3.5 h-3.5 rounded-full ${x.c}`} /><span className="flex-1 text-sm md:text-base font-medium text-card-foreground">{x.l}</span><span className="text-2xl md:text-3xl font-bold text-card-foreground">{x.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card animate-slide-up stagger-3">
                  <div className="card-header flex justify-between pb-3">
                    <h3 className="card-title text-card-foreground">Atividade Recente</h3>
                    <button onClick={() => go('registros')} className="btn btn-ghost btn-sm text-primary text-xs">Ver todas</button>
                  </div>
                  <div className="card-content">
                    {stats.ultimasObs?.length > 0 ? (
                      <div className="table-wrapper">
                        <table className="table">
                           <thead><tr><th>Registro</th><th>Coletor</th><th>Gravidade</th><th>Quando</th></tr></thead>
                          <tbody>{stats.ultimasObs.map((o: any) => <tr key={o.id}><td className="font-medium text-card-foreground">{o.titulo}</td><td className="text-muted-foreground">{o.coletor_nome}</td><td><GravBadge g={o.gravidade} /></td><td className="text-muted-foreground text-xs">{timeSince(o.created_at)} atrás</td></tr>)}</tbody>
                        </table>
                      </div>
                    ) : <p className="text-center py-10 text-muted-foreground text-sm">Nenhuma atividade</p>}
                  </div>
                </div>
                <div className="card animate-slide-up stagger-4">
                  <div className="card-header flex justify-between pb-3">
                    <h3 className="card-title text-card-foreground">Coletores</h3>
                    <button onClick={() => go('coletores')} className="btn btn-ghost btn-sm text-primary text-xs">Ver grid</button>
                  </div>
                  <div className="card-content">
                    <div className="table-wrapper">
                      <table className="table">
                        <thead><tr><th>Coletor</th><th>Responsável</th><th>Status</th></tr></thead>
                        <tbody>{coletores.slice(0, 8).map(c => (
                          <tr key={c.id} className="cursor-pointer" onClick={() => openKPI(c)}>
                            <td className="font-medium text-card-foreground">{c.nome}</td>
                            <td className="text-muted-foreground">{c.responsavel}</td>
                            <td><StatusBadge s={c.status} /></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ COLETORES ═══ */}
          {!loading && !error && page === 'coletores' && (
            <div className="animate-fade-in space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-card-foreground">Gerenciamento de Coletores</h2>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">Gerenciamento e gestão de coletores</p>
                </div>
                <button onClick={() => setModal('novo')} className="btn btn-primary shadow-lg shadow-primary/25">{I.plus} Novo Coletor</button>
              </div>
              <AdvancedSearch onSearch={params => loadColetores(new URLSearchParams(params).toString())} departamentos={departamentos} />
              <p className="text-sm md:text-base text-muted-foreground">{coletores.length} coletor(es) encontrado(s)</p>
              {coletores.length === 0 ? (
                <div className="card p-12 md:p-20 text-center">
                  <div className="w-18 h-18 md:w-20 md:h-20 mx-auto mb-5 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">{I.box}</div>
                  <h3 className="text-lg md:text-xl font-bold text-card-foreground mb-2">Nenhum coletor encontrado</h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-6">Adicione um novo equipamento ou ajuste os filtros</p>
                  <button onClick={() => setModal('novo')} className="btn btn-primary">{I.plus} Novo Coletor</button>
                </div>
              ) : (
                <>
                  <div className="grid-coletores">
                    {coletores.map((c, i) => {
                      const gc = c.status === 'ativo' ? '#10b981' : c.status === 'inativo' ? '#ef4444' : '#f59e0b';
                      const glowShadow = c.status === 'ativo'
                        ? '0 0 15px rgba(16,185,129,0.35), 0 0 30px rgba(16,185,129,0.15), inset 0 0 15px rgba(16,185,129,0.05)'
                        : c.status === 'inativo'
                        ? '0 0 15px rgba(239,68,68,0.35), 0 0 30px rgba(239,68,68,0.15), inset 0 0 15px rgba(239,68,68,0.05)'
                        : '0 0 15px rgba(245,158,11,0.35), 0 0 30px rgba(245,158,11,0.15), inset 0 0 15px rgba(245,158,11,0.05)';
                      return (
                      <div key={c.id} className="collector-card group animate-fade-in" style={{ animationDelay: `${i * 0.03}s`, borderColor: gc, boxShadow: `${glowShadow}, 0 8px 32px rgba(0,0,0,0.3)` }} onClick={() => openKPI(c)}>
                        <div className="relative h-52 md:h-56 overflow-hidden">
                          {c.imagem ? (
                            <img src={c.imagem} alt={c.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(222 40% 15%), hsl(222 35% 20%))' }}>
                              <div className="text-center">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground mb-2">{I.box}</div>
                                <p className="text-xs md:text-sm text-muted-foreground">Sem imagem</p>
                              </div>
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <span className={`badge text-[10px] font-bold backdrop-blur-md ${c.status === 'ativo' ? 'badge-success' : c.status === 'inativo' ? 'badge-danger' : 'badge-warning'}`}>
                              {c.status === 'ativo' ? 'Ativo' : c.status === 'inativo' ? 'Inativo' : 'Manutenção'}
                            </span>
                          </div>
                        </div>
                        <div className="card-divider" />
                        <div className="p-5 md:p-6 flex-1" style={{ paddingBottom: '3.25rem' }}>
                          <div className="mb-4">
                            <h3 className="font-bold text-card-foreground text-base md:text-lg leading-snug">{c.nome}</h3>
                            <p className="text-xs md:text-sm text-muted-foreground font-mono mt-1">{c.numero_serie}</p>
                          </div>
                          <div>
                            <div className="info-row">
                              <div className="info-icon">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="info-label">Responsável</p>
                                <p className="info-value">{c.responsavel}</p>
                              </div>
                            </div>
                            <div className="info-row">
                              <div className="info-icon">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="info-label">Setor</p>
                                <p className="info-value">{c.localizacao || c.departamento}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          className="expand-btn"
                          title="Ver detalhes completos"
                          onClick={e => { e.stopPropagation(); go('detalhe', c); }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                        </button>
                      </div>
                    )})}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ DETALHE ═══ */}
          {!loading && !error && page === 'detalhe' && selected && (
            <div className="space-y-8 animate-fade-in">
              <div className="kpi-header">
                {selected.imagem && (
                  <div className="kpi-header-image">
                    <img src={selected.imagem} alt={selected.nome} />
                  </div>
                )}
                <div className="v-divider hidden md:block" />
                <div className="kpi-header-info">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-2xl md:text-3xl font-bold text-primary" style={{ textShadow: '0 0 10px rgba(59,130,246,0.25)' }}>{selected.nome}</h2>
                      <p className="text-sm md:text-base text-primary/70 font-mono mt-1.5">{selected.numero_serie} · {selected.modelo}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge s={selected.status} />
                      <button onClick={() => setModal('editar')} className="btn btn-outline btn-sm">{I.edit} Editar</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="section-divider" />
            <KPIEditor coletor={selected} onSave={saveKPIColetor} onExpand={() => { setModal(null); go('detalhe', selected); }} />
            <ContratoUnico
              coletorId={selected.id}
              contrato={selected.contrato}
              onChanged={async col => {
                setSelected(col);
                setObs(col.observacoes || []);
                loadColetores();
              }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="stat-card kpi-mini text-center" style={{ '--kpi-accent': '#3b82f6' } as React.CSSProperties}><p className="text-3xl font-bold text-primary tabular-nums">{selected.kpi?.totalObs || 0}</p><p className="text-2xs md:text-xs font-bold text-primary/60 uppercase tracking-widest mt-1.5">Registros</p></div>
                <div className="stat-card kpi-mini text-center" style={{ '--kpi-accent': '#ef4444' } as React.CSSProperties}><p className="text-3xl font-bold text-destructive tabular-nums">{selected.kpi?.criticas || 0}</p><p className="text-2xs md:text-xs font-bold text-primary/60 uppercase tracking-widest mt-1.5">Críticas</p></div>
                <div className="stat-card kpi-mini text-center" style={{ '--kpi-accent': '#f59e0b' } as React.CSSProperties}><p className="text-base md:text-lg font-bold text-primary">{selected.kpi?.ultimaObs ? timeSince(selected.kpi.ultimaObs) + ' atrás' : 'Nenhuma'}</p><p className="text-2xs md:text-xs font-bold text-primary/60 uppercase tracking-widest mt-1.5">Última Obs.</p></div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg md:text-xl font-bold text-primary">Registros <span className="text-primary/60 font-normal text-sm">({obs.length})</span></h3>
                <button onClick={() => setModal('obs')} className="btn btn-primary btn-sm">{I.plus} Novo Registro</button>
              </div>
              {obs.length === 0 ? (
                <div className="card p-12 md:p-16 text-center"><p className="text-muted-foreground text-base">Nenhum registro encontrado.</p></div>
              ) : (
                <div className="space-y-5">
                  {obs.map((o, i) => (
                    <div key={o.id} className="obs-card animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="p-5 md:p-7">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-primary text-base md:text-lg">{o.titulo}</h4>
                            <p className="text-xs md:text-sm text-primary/60 mt-1 flex items-center gap-1.5">{I.clock}{new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <GravBadge g={o.gravidade} />
                            <button onClick={() => { setDeleteId({ type: 'obs', id: o.id }); setModal('confirm'); }} className="text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-destructive/10 transition">{I.trash}</button>
                          </div>
                        </div>
                        <div className="mt-4 space-y-3">
                          <p className="text-sm md:text-base text-primary/80 leading-relaxed">{o.descricao}</p>
                          {o.causas && <div className="cause-box"><p className="cause-label">Causa</p><p className="cause-text">{o.causas}</p></div>}
                          {o.solucao && <div className="solution-box"><p className="solution-label">Solução</p><p className="solution-text">{o.solucao}</p></div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ REGISTROS ═══ */}
          {!loading && !error && page === 'registros' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-card-foreground">Registros</h2>
                <button onClick={() => setModal('obs')} className="btn btn-primary">{I.plus} Nova Obs.</button>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {['alta', 'media', 'baixa'].map(g => (
                  <button key={g} onClick={() => setObsFilter(obsFilter === g ? '' : g)} className={`badge cursor-pointer transition-all text-xs ${obsFilter === g ? (g === 'alta' ? 'badge-danger' : g === 'media' ? 'badge-warning' : 'badge-info') : 'badge-secondary'}`}>
                    {g === 'alta' ? 'Alta' : g === 'media' ? 'Média' : 'Baixa'}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input className="input pl-11" placeholder="Buscar observações..." value={obsSearch} onChange={e => setObsSearch(e.target.value)} />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">{I.search}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-xs md:text-sm text-muted-foreground">
                <span>{obs.length} registro(s)</span>
                {obsFilter && <span className="badge badge-danger">{obsFilter === 'alta' ? 'Alta' : obsFilter === 'media' ? 'Média' : 'Baixa'} <button className="ml-1" onClick={() => setObsFilter('')}>×</button></span>}
              </div>
              {obs.length === 0 ? (
                <div className="card p-12 md:p-20 text-center"><div className="w-18 h-18 md:w-20 md:h-20 mx-auto mb-5 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">{I.eye}</div><h3 className="text-lg md:text-xl font-bold text-card-foreground mb-2">Nenhum registro</h3><p className="text-sm md:text-base text-muted-foreground">Registre observações nos detalhes de cada coletor</p></div>
              ) : (
                <div className="space-y-5">
                  {obs.map((o, i) => (
                    <div key={o.id} className="obs-card cursor-pointer animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}
                      onClick={() => { const c = coletores.find(x => x.id === o.coletor_id); if (c) go('detalhe', c); }}>
                      <div className="p-5 md:p-7">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-card-foreground text-base md:text-lg">{o.titulo}</h4>
                            <p className="text-sm md:text-base text-muted-foreground mt-1">
                              <span className="font-medium">{o.coletor_nome || 'Coletor removido'}</span>
                              {o.coletor_responsavel && <span> · {o.coletor_responsavel}</span>}
                              <span> · {new Date(o.created_at).toLocaleDateString('pt-BR')}</span>
                            </p>
                          </div>
                          <GravBadge g={o.gravidade} />
                        </div>
                        <div className="mt-4">
                          <p className="text-sm md:text-base text-card-foreground leading-relaxed">{o.descricao}</p>
                          {o.causas && <div className="cause-box mt-3"><p className="cause-label">Causa</p><p className="cause-text">{o.causas}</p></div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ RELATÓRIO ═══ */}
          {!loading && !error && page === 'relatorio' && (
            <div className="space-y-8 animate-fade-in">
              <div className="card relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
                <div className="card-header pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary" style={{ boxShadow: '0 0 16px hsl(var(--glow)/0.25)' }}>{I.file}</div>
                    <div>
                      <h3 className="card-title text-primary">Gerar Relatório</h3>
                      <p className="text-sm text-primary/60 mt-0.5">Selecione o período e filtros</p>
                    </div>
                  </div>
                </div>
                <div className="card-content space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label text-primary/80 flex items-center gap-1.5 mb-2">{I.calendar} Data Início</label>
                      <input type="date" className="input" value={relInicio} onChange={e => setRelInicio(e.target.value)} />
                    </div>
                    <div>
                      <label className="label text-primary/80 flex items-center gap-1.5 mb-2">{I.calendar} Data Fim</label>
                      <input type="date" className="input" value={relFim} onChange={e => setRelFim(e.target.value)} />
                    </div>
                  </div>
                  <div className="section-divider" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label text-primary/80 mb-2">Departamento</label>
                      <NeonSelect value={relDeptos} onChange={setRelDeptos}
                        options={[{ value: '', label: 'Todos' }, ...departamentos.map(d => ({ value: d, label: d }))]} />
                    </div>
                    <div>
                      <label className="label text-primary/80 mb-2">Status</label>
                      <NeonSelect value={relStatus} onChange={setRelStatus}
                        options={[{ value: '', label: 'Todos' }, { value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }, { value: 'manutencao', label: 'Manutenção' }]} />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button className="btn btn-primary" onClick={gerarRelatorio}>{I.file} Gerar Relatório</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ DEPARTAMENTOS ═══ */}
          {!loading && !error && page === 'departamentos' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-card-foreground">Departamentos</h2>
                <p className="text-sm text-muted-foreground mt-1">Visão geral por setor</p>
              </div>
              {deptosStats.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">{I.dept}</div>
                  <h3 className="text-lg font-bold text-card-foreground mb-2">Nenhum departamento</h3>
                  <p className="text-sm text-muted-foreground">Cadastre coletores com departamento para ver as estatísticas</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {deptosStats.map((d, i) => {
                    const pct = d.total ? Math.round((d.ativos / d.total) * 100) : 0;
                    return (
                      <div key={d.departamento} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 0.05}s`, '--kpi-accent': '#3b82f6' } as React.CSSProperties}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-11 h-11 rounded-xl bg-primary/12 border border-primary/25 flex items-center justify-center text-primary" style={{ boxShadow: '0 0 14px hsl(var(--glow)/0.2)' }}>{I.dept}</div>
                          <span className="badge badge-success">{pct}% ativos</span>
                        </div>
                        <h3 className="font-bold text-card-foreground text-lg mb-1">{d.departamento}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span><strong className="text-primary">{d.total}</strong> coletor(es)</span>
                          <span className="text-success font-semibold">{d.ativos} ativo(s)</span>
                        </div>
                        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-success transition-all duration-700"
                            style={{ width: `${pct}%`, boxShadow: '0 0 10px hsl(var(--glow)/0.5)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ USUÁRIOS ═══ */}
          {!loading && !error && page === 'usuarios' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-card-foreground">Usuários</h2>
                  <p className="text-sm text-muted-foreground mt-1">{usuarios.length} usuário(s) · gerencie contas de acesso ao sistema</p>
                </div>
                <button onClick={() => setModal('novoUsuario')} className="btn btn-primary">{I.plus} Novo Usuário</button>
              </div>
              {usuarios.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">{I.users}</div>
                  <h3 className="text-lg font-bold text-card-foreground mb-2">Nenhum usuário</h3>
                  <p className="text-sm text-muted-foreground mb-5">Adicione usuários para gerenciar o acesso ao sistema</p>
                  <button onClick={() => setModal('novoUsuario')} className="btn btn-primary mx-auto">{I.plus} Novo Usuário</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {usuarios.map((u, i) => (
                    <div key={u.id} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 0.04}s`, '--kpi-accent': '#3b82f6' } as React.CSSProperties}>
                        <div className="flex items-start gap-4">
                          <Avatar src={u.foto} nome={u.nome} size="lg" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="font-bold text-card-foreground truncate">{u.nome}</h4>
                                <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                              </div>
                              <span className={`badge ${u.status === 'ativo' ? 'badge-success' : 'badge-danger'}`}>{u.status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <span className="badge badge-secondary">{u.cargo}</span>
                              {u.departamento && <span className="badge badge-info">{u.departamento}</span>}
                            </div>
                          </div>
                        </div>
                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
                        <button onClick={() => { setSelected(u as any); setModal('editarUsuario'); }} className="btn btn-outline btn-sm">{I.edit} Editar</button>
                        <button onClick={() => { setDeleteId({ type: 'usuario', id: u.id }); setModal('confirm'); }} className="btn btn-danger btn-sm">{I.trash} Excluir</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ RELATÓRIO RESULTADO ═══ */}
          {!loading && !error && page === 'relatorio' && relatorio && (
                <>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-primary">Resultado</h2>
                    <p className="text-sm md:text-base text-primary/70 mt-1.5">
                      {relatorio.periodo.inicio ? `Período: ${new Date(relatorio.periodo.inicio).toLocaleDateString('pt-BR')} a ${relatorio.periodo.fim ? new Date(relatorio.periodo.fim).toLocaleDateString('pt-BR') : 'hoje'}` : 'Todos os períodos'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                    {[
                      { id: 'total', l: 'Total', v: relatorio.resumo.totalColetores, hex: '#3b82f6', sub: 'coletores no filtro', action: 'all' },
                      { id: 'comobs', l: 'Com Obs.', v: relatorio.resumo.comObservacoes, hex: '#10b981', sub: 'com registros', action: 'comobs' },
                      { id: 'registros', l: 'Registros', v: relatorio.resumo.totalObs, hex: '#0ea5e9', sub: 'no período', action: 'registros' },
                      { id: 'criticas', l: 'Críticas', v: relatorio.resumo.criticas, hex: '#ef4444', sub: 'alta gravidade', action: 'criticas' },
                      { id: 'avisos', l: 'Avisos', v: relatorio.resumo.avisos, hex: '#f59e0b', sub: 'média gravidade', action: 'avisos' },
                    ].map((s) => {
                      const active = reportKpi === s.action || (s.action === 'all' && !reportKpi);
                      const expanded = active && s.action !== 'all';
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setReportKpi(s.action === 'all' ? null : s.action);
                            setResumoKpi({ titulo: s.l, hex: s.hex, acao: s.action });
                          }}
                          className={`report-kpi-btn text-left rounded-xl p-4 md:p-5 border shadow-lg transition-all duration-300 ${expanded ? 'report-kpi-active' : ''}`}
                          style={{ '--kpi-accent': s.hex, borderColor: active ? `${s.hex}66` : 'hsl(var(--border)/0.6)', background: active ? `${s.hex}14` : 'hsl(var(--card)/0.7)', boxShadow: active ? `0 8px 24px ${s.hex}25, 0 0 20px ${s.hex}18` : undefined, color: s.hex } as React.CSSProperties}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-2xl md:text-3xl font-extrabold tabular-nums leading-none" style={{ color: s.hex }}>{s.v}</p>
                              <p className="text-2xs md:text-xs font-bold uppercase tracking-widest mt-1.5" style={{ color: s.hex }}>{s.l}</p>
                              {expanded && <p className="text-[11px] font-medium mt-2 opacity-80" style={{ color: s.hex }}>Clique para limpar o filtro</p>}
                            </div>
                            <span className="report-kpi-dot" style={{ background: s.hex, boxShadow: `0 0 10px ${s.hex}` }} />
                          </div>
                          {active && !expanded && s.action !== 'all' && (
                            <p className="text-[11px] font-medium mt-2 opacity-75" style={{ color: s.hex }}>{s.sub} · clique p/ expandir</p>
                          )}
                          {s.action === 'all' && active && (
                            <p className="text-[11px] font-medium mt-2 opacity-75" style={{ color: s.hex }}>Mostrando todos</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {reportKpi && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--glow))' }}>
                      <span className="font-semibold">Filtro ativo:</span>
                      <span className="badge" style={{ background: 'hsl(var(--glow)/0.15)', color: 'hsl(var(--glow))', border: '1px solid hsl(var(--glow)/0.35)' }}>
                        {reportKpi === 'comobs' ? 'Com Observações' : reportKpi === 'registros' ? 'Com Registros' : reportKpi === 'criticas' ? 'Críticas' : 'Avisos'}
                      </span>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setReportKpi(null)}>Limpar</button>
                    </div>
                  )}

                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => exportCSV(relatorio)} className="btn btn-outline">{I.download} CSV</button>
                      <button onClick={() => exportDOC(relatorio)} disabled={!!gerandoSaida} className="btn btn-outline">
                        {gerandoSaida === 'doc' ? 'Gerando…' : 'Word (.doc)'}
                      </button>
                      <button onClick={() => exportPDF(relatorio)} disabled={!!gerandoSaida} className="btn btn-primary">
                        {gerandoSaida === 'pdf' ? 'Gerando…' : <>{I.pdf} Salvar como PDF</>}
                      </button>
                      <button onClick={() => window.print()} className="btn btn-outline">{I.printer} Imprimir</button>
                    </div>

                  <div id="rel-detalhamento" className="space-y-6 scroll-mt-24">
                    <h3 className="text-lg md:text-xl font-bold text-primary">
                      Detalhamento por Coletor
                      {reportKpi && <span className="text-sm font-normal text-primary/60 ml-2">({(() => {
                        const list = relatorio.coletores;
                        if (reportKpi === 'comobs' || reportKpi === 'registros') return list.filter((c: any) => c.observacoes.length > 0).length;
                        if (reportKpi === 'criticas') return list.filter((c: any) => c.observacoes.some((o: any) => o.gravidade === 'alta')).length;
                        if (reportKpi === 'avisos') return list.filter((c: any) => c.observacoes.some((o: any) => o.gravidade === 'media')).length;
                        return list.length;
                      })()} coletor(es))</span>}
                    </h3>
                    {relatorio.coletores.filter((c: any) => {
                      if (!reportKpi) return true;
                      if (reportKpi === 'comobs' || reportKpi === 'registros') return c.observacoes.length > 0;
                      if (reportKpi === 'criticas') return c.observacoes.some((o: any) => o.gravidade === 'alta');
                      if (reportKpi === 'avisos') return c.observacoes.some((o: any) => o.gravidade === 'media');
                      return true;
                    }).map((c: any, i: number) => {
                      const criticas = c.observacoes.filter((o: any) => o.gravidade === 'alta').length;
                      const avisos = c.observacoes.filter((o: any) => o.gravidade === 'media').length;
                      const infos = c.observacoes.filter((o: any) => o.gravidade === 'baixa').length;
                      const temProblemas = criticas > 0;
                      const temAvisos = avisos > 0;
                      return (
                        <div
                          key={c.id}
                          className="obs-card animate-fade-in cursor-pointer"
                          style={{ animationDelay: `${i * 0.04}s` }}
                          onClick={(e) => {
                            const t = e.target as HTMLElement;
                            if (t.closest('button') || t.closest('a')) return;
                            openKPI(c);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openKPI(c); } }}
                          title="Clique para abrir o KPI"
                        >
                          <div className={`h-1.5 ${temProblemas ? 'bg-destructive' : temAvisos ? 'bg-warning' : 'bg-success'}`} />
                          <div className="p-5 md:p-7">
                            <div className="flex flex-wrap items-start gap-5">
                              {c.imagem && <img src={c.imagem} alt={c.nome} className="w-24 h-20 rounded-lg object-cover flex-shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <h4 className="font-bold text-primary text-lg md:text-xl">{c.nome}</h4>
                                    <p className="text-sm text-primary/70 font-mono mt-1">{c.numero_serie} · {c.modelo}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <StatusBadge s={c.status} />
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-primary/70">
                                  <span className="flex items-center gap-1.5">{I.user} {c.responsavel}</span>
                                  <span>{c.departamento}</span>
                                  {c.localizacao && <span className="flex items-center gap-1.5">{I.mapPin} {c.localizacao}</span>}
                                </div>
                                {c.contrato && (
                                  <div className="mt-3">
                                    <ContratoVisivel contrato={c.contrato} compact />
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2.5 mt-4">
                                  {criticas > 0 && <span className="badge badge-danger">{criticas} crítica{criticas > 1 ? 's' : ''}</span>}
                                  {avisos > 0 && <span className="badge badge-warning">{avisos} aviso{avisos > 1 ? 's' : ''}</span>}
                                  {infos > 0 && <span className="badge badge-info">{infos} informativo{infos > 1 ? 's' : ''}</span>}
                                  {c.observacoes.length === 0 && <span className="text-sm text-primary/50 italic">Sem registros no período</span>}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                  <button type="button" className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); openKPI(c); }}>
                                    Ver KPI
                                  </button>
                                  <button type="button" className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); exportColetorPDF(c); }} disabled={!!gerandoSaida}>{gerandoSaida === 'pdf' ? 'Gerando…' : <>{I.pdf} PDF do coletor</>}</button>
                                  <button type="button" className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); abrirPaginaColetor(c.id, relInicio, relFim); }}>{I.expand} Página completa</button>
                                </div>
                              </div>
                            </div>
                                {c.observacoes.length > 0 && (
                              <div className="mt-5 pt-5 border-t border-primary/20 space-y-3">
                                {c.observacoes.map((o: any) => (
                                  <div key={o.id} className="bg-primary/[0.05] rounded-lg p-4 text-sm border border-primary/15">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                      <span className="font-semibold text-primary">{o.titulo}</span>
                                      <div className="flex items-center gap-2.5">
                                        <GravBadge g={o.gravidade} />
                                        <span className="text-xs text-primary/60">{new Date(o.created_at).toLocaleDateString('pt-BR')}</span>
                                      </div>
                                    </div>
                                    <p className="text-primary/70 leading-relaxed">{o.descricao}</p>
                                    {o.causas && <div className="cause-box mt-2 inline-block"><b className="cause-label" style={{ display: 'inline', marginBottom: 0 }}>Causa:</b> <span className="cause-text">{o.causas}</span></div>}
                                    {o.solucao && <div className="solution-box mt-2 ml-2 inline-block"><b className="solution-label" style={{ display: 'inline', marginBottom: 0 }}>Solução:</b> <span className="solution-text">{o.solucao}</span></div>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {(() => {
                      const n = relatorio.coletores.filter((c: any) => {
                        if (!reportKpi) return true;
                        if (reportKpi === 'comobs' || reportKpi === 'registros') return c.observacoes.length > 0;
                        if (reportKpi === 'criticas') return c.observacoes.some((o: any) => o.gravidade === 'alta');
                        if (reportKpi === 'avisos') return c.observacoes.some((o: any) => o.gravidade === 'media');
                        return true;
                      }).length;
                      return n === 0 ? <div className="card p-8 text-center text-primary/60">Nenhum coletor corresponde a este filtro.</div> : null;
                    })()}
                  </div>
                </>
              )}
        </div>
      </main>

      {/* MODALS */}
      <Modal open={modal === 'novo'} onClose={() => setModal(null)} title="Novo Coletor" desc="Adicione um equipamento ao sistema." size="lg">
        <FormColetor onSave={saveColetor} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'editar'} onClose={() => setModal(null)} title="Editar Coletor" desc="Atualize as informações." size="lg">
        {selected && <FormColetor data={selected} onSave={saveColetor} onCancel={() => setModal(null)} />}
      </Modal>
      <Modal open={modal === 'kpi'} onClose={() => setModal(null)} title="KPI do Equipamento" desc="Visualize e edite os dados principais." size="lg">
        {selected && (
          <div className="space-y-6">
            <div className="kpi-header">
              {selected.imagem && (
                <div className="kpi-header-image">
                  <img src={selected.imagem} alt={selected.nome} />
                </div>
              )}
              <div className="v-divider hidden md:block" />
              <div className="kpi-header-info">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl md:text-2xl font-bold text-primary" style={{ textShadow: '0 0 10px rgba(59,130,246,0.25)' }}>{selected.nome}</h2>
                    <p className="text-sm text-primary/70 font-mono mt-1">{selected.numero_serie} · {selected.modelo}</p>
                    <p className="text-sm text-primary/70 mt-1 flex items-center gap-1.5">{I.user} {selected.responsavel}</p>
                  </div>
                  <StatusBadge s={selected.status} />
                </div>
              </div>
            </div>
            <div className="section-divider" />
            <KPIEditor coletor={selected} onSave={saveKPIColetor} onExpand={() => { setModal(null); go('detalhe', selected); }} />
            <ContratoUnico
              coletorId={selected.id}
              contrato={selected.contrato}
              onChanged={async col => {
                setSelected(col);
                setObs(col.observacoes || []);
                loadColetores();
              }}
            />
                <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="stat-card kpi-mini text-center" style={{ '--kpi-accent': '#3b82f6' } as React.CSSProperties}><p className="text-2xl md:text-3xl font-bold text-primary tabular-nums">{selected.kpi?.totalObs || 0}</p><p className="text-2xs md:text-xs font-bold text-primary/60 uppercase tracking-widest mt-1.5">Registros</p></div>
              <div className="stat-card kpi-mini text-center" style={{ '--kpi-accent': '#ef4444' } as React.CSSProperties}><p className="text-2xl md:text-3xl font-bold text-destructive tabular-nums">{selected.kpi?.criticas || 0}</p><p className="text-2xs md:text-xs font-bold text-primary/60 uppercase tracking-widest mt-1.5">Críticas</p></div>
              <div className="stat-card kpi-mini text-center" style={{ '--kpi-accent': '#f59e0b' } as React.CSSProperties}><p className="text-sm md:text-base font-bold text-primary">{selected.kpi?.ultimaObs ? timeSince(selected.kpi.ultimaObs) + ' atrás' : 'Nenhuma'}</p><p className="text-2xs md:text-xs font-bold text-primary/60 uppercase tracking-widest mt-1.5">Última Obs.</p></div>
            </div>
            <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-border">
              <button onClick={() => setModal(null)} className="btn btn-outline">Fechar</button>
              <button onClick={() => { const id = selected.id; setModal(null); abrirPaginaColetor(id, relInicio, relFim); }} className="btn btn-outline">{I.expand} Página completa</button>
              <button onClick={() => { setModal(null); go('detalhe', selected); }} className="btn btn-primary">{I.expand} Ver Detalhes Completos</button>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={!!resumoKpi} onClose={() => setResumoKpi(null)} title={resumoKpi ? `Resumo · ${resumoKpi.titulo}` : 'Resumo'} desc="Coletores deste indicador — clique para abrir o KPI." size="xl">
        {resumoKpi && (() => {
          const list = (relatorio?.coletores || []).filter((c: any) => {
            if (resumoKpi.acao === 'all') return true;
            if (resumoKpi.acao === 'comobs' || resumoKpi.acao === 'registros') return c.observacoes.length > 0;
            if (resumoKpi.acao === 'criticas') return c.observacoes.some((o: any) => o.gravidade === 'alta');
            if (resumoKpi.acao === 'avisos') return c.observacoes.some((o: any) => o.gravidade === 'media');
            return true;
          });
          const v = resumoKpi.acao === 'all' ? relatorio?.resumo?.totalColetores
            : resumoKpi.acao === 'comobs' ? relatorio?.resumo?.comObservacoes
            : resumoKpi.acao === 'registros' ? relatorio?.resumo?.totalObs
            : resumoKpi.acao === 'criticas' ? relatorio?.resumo?.criticas
            : relatorio?.resumo?.avisos;
          return (
            <div className="space-y-5">
              <div className="rounded-xl p-5 border" style={{ borderColor: `${resumoKpi.hex}55`, background: `${resumoKpi.hex}12` }}>
                <p className="text-4xl font-extrabold tabular-nums" style={{ color: resumoKpi.hex }}>{v ?? 0}</p>
                <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: resumoKpi.hex }}>{resumoKpi.titulo}</p>
                <p className="text-sm text-muted-foreground mt-2">{list.length} coletor(es) neste resumo</p>
              </div>
              {list.length === 0 ? (
                <div className="card p-8 text-center text-muted-foreground">Nenhum coletor neste filtro.</div>
              ) : (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                  {list.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left obs-card cursor-pointer hover:opacity-95"
                      onClick={() => { setResumoKpi(null); openKPI(c); }}
                    >
                      <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-primary truncate">{c.nome}</p>
                          <p className="text-sm text-primary/60 font-mono">{c.numero_serie} · {c.responsavel}</p>
                          {c.contrato && <span className="inline-flex items-center gap-1 mt-1 text-2xs font-bold text-primary/70">{I.pdf} Contrato anexado</span>}
                        </div>
                        <span className="btn btn-primary btn-sm shrink-0">{I.eye} Ver KPI</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button onClick={() => setResumoKpi(null)} className="btn btn-outline">Fechar</button>
              </div>
            </div>
          );
        })()}
      </Modal>
      <Modal open={modal === 'obs'} onClose={() => setModal(null)} title="Novo Registro" desc="Registre uma observação." size="xl">
        <FormObs coletorId={selected?.id} coletores={coletores} onSave={saveObs} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'novoUsuario'} onClose={() => setModal(null)} title="Novo Usuário" desc="Adicione um usuário ao sistema.">
        <FormUsuario departamentos={departamentos} onSave={saveUsuario} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'editarUsuario'} onClose={() => setModal(null)} title="Editar Usuário" desc="Atualize os dados.">
        <FormUsuario data={selected as any} departamentos={departamentos} onSave={saveUsuario} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'perfil'} onClose={() => setModal(null)} title="Meu perfil" desc="Atualize sua foto de perfil.">
        {sessionUser && <FormFotoPerfil user={sessionUser} onSave={salvarFotoPerfil} onCancel={() => setModal(null)} />}
      </Modal>
      <Modal open={modal === 'confirm'} onClose={() => { setModal(null); setDeleteId(null); }} title="Confirmar Exclusão" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Tem certeza? Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-2">
            <button className="btn btn-outline" onClick={() => { setModal(null); setDeleteId(null); }}>Cancelar</button>
            <button className="btn btn-danger" onClick={doDelete}>{I.trash} Excluir</button>
          </div>
        </div>
      </Modal>
      <ConfiguracoesModal
        open={modal === 'config'}
        onClose={() => setModal(null)}
        config={config}
        onChange={setConfig}
        dark={dark}
        onMudarTema={setDark}
        onLimparNotificacoes={limparNotifsLidas}
      />
      <Toasts />
    </div>
  );
}
