import { useEffect, useRef, useState } from 'react';

export type Notificacao = {
  id: string;
  tipo: string;
  titulo: string;
  detalhe?: string;
  coletor_id?: string;
  coletor_nome?: string;
  created_at: string;
};

type Filtro = 'todas' | 'nao-lidas';

function tempoRelativo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'agora';
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

function iconTipo(tipo: string) {
  const base = 'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0';
  if (tipo === 'edicao') {
    return (
      <span className={`${base} bg-primary/15 text-primary`} title="Edição">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
      </span>
    );
  }
  if (tipo === 'registro_criado' || tipo === 'criado') {
    return (
      <span className={`${base} bg-success/15 text-success`} title="Novo registro">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
      </span>
    );
  }
  if (tipo === 'registro_excluido' || tipo === 'excluido') {
    return (
      <span className={`${base} bg-destructive/15 text-destructive`} title="Exclusão">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
      </span>
    );
  }
  if (tipo === 'critica') {
    return (
      <span className={`${base} bg-warning/20 text-warning`} title="Crítica">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
      </span>
    );
  }
  return (
    <span className={`${base} bg-info/15 text-info`} title="Evento">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
    </span>
  );
}

export function sinoSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function engrenagemSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itens: Notificacao[];
  lidas: Set<string>;
  ultimoAberto: string;
  onMarcarLida: (id: string) => void;
  onMarcarTodas: () => void;
  onAbrirColetor?: (coletorId: string) => void;
  onAtualizar: () => void;
};

export function SinoNotificacoes({
  open,
  onOpenChange,
  itens,
  lidas,
  ultimoAberto,
  onMarcarLida,
  onMarcarTodas,
  onAbrirColetor,
  onAtualizar,
}: Props) {
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onOpenChange(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open, onOpenChange]);

  const naoVistas = itens.filter(n => {
    const vista = new Date(n.created_at).getTime() <= new Date(ultimoAberto).getTime();
    return !vista && !lidas.has(n.id);
  });
  const badge = naoVistas.length;
  const badgeTxt = badge > 9 ? '9+' : String(badge);

  const visiveis = filtro === 'nao-lidas' ? itens.filter(n => !lidas.has(n.id)) : itens;

  const clicarItem = (n: Notificacao) => {
    onMarcarLida(n.id);
    if (n.coletor_id && onAbrirColetor) onAbrirColetor(n.coletor_id);
    onOpenChange(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => {
          const next = !open;
          onOpenChange(next);
          if (next) onAtualizar();
        }}
        title="Notificações"
        aria-label={badge > 0 ? `Notificações, ${badgeTxt} novas` : 'Notificações'}
        className="btn btn-ghost btn-icon btn-sm relative text-muted-foreground hover:text-primary transition"
      >
        {sinoSvg()}
        {badge > 0 && <span className="notif-badge">{badgeTxt}</span>}
      </button>

      {open && (
        <div className="notif-drawer" role="dialog" aria-label="Central de notificações">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-card-foreground">Notificações</h3>
              {badge > 0 && (
                <span className="badge badge-danger text-[10px] px-1.5 py-0">{badgeTxt}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => onAtualizar()}
                title="Atualizar"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,4 23,10 17,10"/><polyline points="1,20 1,14 7,14"/></svg>
              </button>
              <button type="button" className="btn btn-ghost btn-xs" onClick={onMarcarTodas}>
                Marcar todas
              </button>
            </div>
          </div>

          <div className="flex gap-1.5 px-3 py-2 border-b border-border/60">
            {(['todas', 'nao-lidas'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFiltro(f)}
                className={`btn btn-xs ${filtro === f ? 'btn-primary' : 'btn-outline'}`}
              >
                {f === 'todas' ? 'Todas' : 'Não lidas'}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1 min-h-0">
            {visiveis.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {sinoSvg()}
                </div>
                <p className="text-sm font-semibold text-card-foreground">Você está em dia</p>
                <p className="text-xs text-muted-foreground mt-1">Nenhuma notificação {filtro === 'nao-lidas' ? 'não lida' : ''}.</p>
              </div>
            ) : (
              visiveis.map(n => {
                const lida = lidas.has(n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    className={`notif-item ${lida ? '' : 'unread'}`}
                    onClick={() => clicarItem(n)}
                  >
                    <span className={`notif-dot ${lida ? 'read' : ''}`} aria-hidden />
                    {iconTipo(n.tipo)}
                    <span className="flex-1 min-w-0">
                      <span className="flex items-start justify-between gap-2">
                        <span className={`text-xs text-card-foreground leading-snug ${lida ? 'font-medium' : 'font-bold'}`}>
                          {n.titulo}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{tempoRelativo(n.created_at)}</span>
                      </span>
                      {n.detalhe && (
                        <span className="block text-[11px] text-muted-foreground truncate mt-0.5">{n.detalhe}</span>
                      )}
                      {n.coletor_nome && (
                        <span className="block text-[10px] text-primary/70 mt-0.5 truncate">{n.coletor_nome}</span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
