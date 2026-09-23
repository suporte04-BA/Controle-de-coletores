import { Fragment } from 'react';
import { Document, Page, View, Text, Image, StyleSheet, pdf } from '@react-pdf/renderer';

const LOGO_URL = '/logo-ba-eletrica.png';

type PdfDesign = 'classico' | 'moderno' | 'minimal' | 'ouro' | 'metalico' | 'corporativo';

type Theme = {
  pageBg: string;
  headerBg: string;
  headerFg: string;
  accent: string;
  accentSoft: string;
  title: string;
  text: string;
  cardBorder: string;
  cardBg: string;
  chipBg: string;
  footerBorder: string;
  barFill: string;
  muted: string;
  line: string;
  useBg: boolean;
  coverGrad: [string, string];
};

const THEMES: Record<PdfDesign, Theme> = {
  classico: {
    pageBg: '#f0f6ff', headerBg: '#0a1628', headerFg: '#93c5fd', accent: '#2563eb',
    accentSoft: '#eff6ff', title: '#1e3a5f', text: '#334155', cardBorder: '#bfdbfe',
    cardBg: '#ffffff', chipBg: '#0a1628', footerBorder: '#93c5fd', barFill: '#2563eb',
    muted: '#64748b', line: '#e2e8f0', useBg: false, coverGrad: ['#0a1628', '#123a6b'],
  },
  moderno: {
    pageBg: '#f8fafc', headerBg: '#0f172a', headerFg: '#7dd3fc', accent: '#0284c7',
    accentSoft: '#f0f9ff', title: '#0f172a', text: '#475569', cardBorder: '#e2e8f0',
    cardBg: '#ffffff', chipBg: '#0f172a', footerBorder: '#7dd3fc', barFill: '#0284c7',
    muted: '#64748b', line: '#e2e8f0', useBg: false, coverGrad: ['#0f172a', '#0c4a6e'],
  },
  minimal: {
    pageBg: '#ffffff', headerBg: '#1e293b', headerFg: '#cbd5e1', accent: '#64748b',
    accentSoft: '#f8fafc', title: '#0f172a', text: '#475569', cardBorder: '#e2e8f0',
    cardBg: '#ffffff', chipBg: '#1e293b', footerBorder: '#e2e8f0', barFill: '#64748b',
    muted: '#94a3b8', line: '#f1f5f9', useBg: false, coverGrad: ['#1e293b', '#334155'],
  },
  ouro: {
    pageBg: '#fffbeb', headerBg: '#1a1408', headerFg: '#f5d76e', accent: '#d4a017',
    accentSoft: '#fffbeb', title: '#3b2f0a', text: '#57534e', cardBorder: '#fde68a',
    cardBg: '#fffdf5', chipBg: '#1a1408', footerBorder: '#f5d76e', barFill: '#d4a017',
    muted: '#a8a29e', line: '#f5e7c8', useBg: false, coverGrad: ['#1a1408', '#6b4e0a'],
  },
  metalico: {
    pageBg: '#f8fafc', headerBg: '#1f2937', headerFg: '#e2e8f0', accent: '#64748b',
    accentSoft: '#f1f5f9', title: '#0f172a', text: '#334155', cardBorder: '#cbd5e1',
    cardBg: '#ffffff', chipBg: '#1f2937', footerBorder: '#94a3b8', barFill: '#64748b',
    muted: '#64748b', line: '#e2e8f0', useBg: false, coverGrad: ['#0f172a', '#475569'],
  },
  corporativo: {
    pageBg: '#f7f9fc', headerBg: '#0b1f3a', headerFg: '#bfdbfe', accent: '#1e4d8c',
    accentSoft: '#eff6ff', title: '#0b1f3a', text: '#334155', cardBorder: '#cbd5e1',
    cardBg: '#ffffff', chipBg: '#0b1f3a', footerBorder: '#93c5fd', barFill: '#1e4d8c',
    muted: '#64748b', line: '#e2e8f0', useBg: false, coverGrad: ['#0b1f3a', '#1e4d8c'],
  },
};

function makeStyles(t: Theme) {
  return StyleSheet.create({
    coverPage: { fontFamily: 'Helvetica', backgroundColor: t.pageBg },
    coverHeader: {
      backgroundColor: t.headerBg,
      paddingHorizontal: 44,
      paddingTop: 48,
      paddingBottom: 44,
    },
    coverAccent: { width: 88, height: 5, backgroundColor: t.accent, borderRadius: 3, marginBottom: 18 },
    coverTitle: { fontSize: 30, fontWeight: 'bold', color: t.headerFg, marginBottom: 8, lineHeight: 1.15 },
    coverSubtitle: { fontSize: 11, color: t.accent, letterSpacing: 0.6 },
    coverBody: { padding: 36, flex: 1 },
    coverStatsRow: { flexDirection: 'row', marginBottom: 22, gap: 10 },
    coverStatBox: { flex: 1, borderRadius: 10, paddingVertical: 16, paddingHorizontal: 6, alignItems: 'center', borderWidth: 1 },
    coverStatValue: { fontSize: 26, fontWeight: 'bold', marginBottom: 3 },
    coverStatLabel: { fontSize: 6.5, color: t.accent, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 'bold', textAlign: 'center' },
    coverDivider: { borderBottomWidth: 1, borderBottomColor: t.line, marginBottom: 18 },
    coverPeriodLabel: { fontSize: 8, color: t.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: 'bold' },
    coverPeriodValue: { fontSize: 13, color: t.title, fontWeight: 'bold', marginBottom: 14 },
    coverGenLabel: { fontSize: 8, color: t.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: 'bold' },
    coverGenValue: { fontSize: 12, color: t.title, fontWeight: '600', marginBottom: 8 },
    coverCompanyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 28, paddingTop: 14, borderTopWidth: 1, borderTopColor: t.line },
    coverCompanyName: { fontSize: 13, fontWeight: 'bold', color: t.title },
    coverCompanySub: { fontSize: 8, color: t.accent, letterSpacing: 0.6 },
    equipCard: { backgroundColor: t.cardBg, borderRadius: 10, borderWidth: 1, borderColor: t.cardBorder, padding: 16, marginBottom: 18 },
    equipTitle: { fontSize: 10, fontWeight: 'bold', color: t.title, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    equipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    equipCell: { width: '47%' },
    equipLabel: { fontSize: 7, color: t.accent, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 'bold', marginBottom: 2 },
    equipValue: { fontSize: 11, color: '#0f172a', fontWeight: '600' },
    page: { fontFamily: 'Helvetica', paddingTop: 14, paddingLeft: 16, paddingRight: 16, paddingBottom: 40, backgroundColor: t.pageBg },
    pageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 6,
      marginBottom: 10,
      borderBottomWidth: 1.5,
      borderBottomColor: t.accent,
    },
    pageHeaderTitle: { fontSize: 9, fontWeight: 'bold', color: t.title, textTransform: 'uppercase', letterSpacing: 0.5 },
    pageHeaderPage: { fontSize: 8, color: t.accent },
    row: { flexDirection: 'row', marginBottom: 8, justifyContent: 'center' },
    card: { borderWidth: 1, borderColor: t.cardBorder, borderRadius: 8, overflow: 'hidden', backgroundColor: t.cardBg },
    cardEmpty: { borderRadius: 8 },
    statusBar: { height: 4 },
    cardImageFull: { width: 72, height: 72, borderRadius: 6, backgroundColor: '#f1f5f9', objectFit: 'cover' },
    cardHead: { flexDirection: 'row', gap: 10, padding: 9, backgroundColor: t.cardBg, borderBottomWidth: 1, borderBottomColor: t.line },
    cardBody: { padding: 8, paddingBottom: 4, backgroundColor: t.cardBg },
    cardName: { fontSize: 12, fontWeight: 'bold', color: t.title, marginBottom: 1 },
    cardModel: { fontSize: 8, color: t.accent, fontWeight: 'bold', marginBottom: 3 },
    infoRow: { flexDirection: 'row', marginBottom: 1.5 },
    infoLabel: { fontSize: 7, color: t.accent, width: 38, fontWeight: 'bold' },
    infoValue: { fontSize: 7, color: '#0f172a', flex: 1 },
    obsSection: { paddingHorizontal: 8, paddingBottom: 6, paddingTop: 3, backgroundColor: t.cardBg },
    obsTitle: { fontSize: 8, fontWeight: 'bold', color: t.title, marginBottom: 1 },
    obsDesc: { fontSize: 7, color: t.text, marginBottom: 1.5, lineHeight: 1.3 },
    obsMeta: { fontSize: 6.5, color: t.accent, marginBottom: 1 },
    obsCause: { fontSize: 6.5, color: '#b45309', marginBottom: 1 },
    obsFix: { fontSize: 6.5, color: '#15803d', marginBottom: 1.5 },
    obsDate: { fontSize: 6, color: t.muted },
    noObs: { fontSize: 8, color: t.muted, fontStyle: 'italic', marginBottom: 3 },
    footer: {
      position: 'absolute',
      bottom: 12,
      left: 16,
      right: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: t.line,
      paddingTop: 5,
    },
    footerText: { fontSize: 7, color: t.muted, fontWeight: 'bold' },
    pageHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardSpacer: { width: 10 },
    sectionCard: { backgroundColor: t.cardBg, borderRadius: 10, borderWidth: 1, borderColor: t.cardBorder, padding: 14, marginBottom: 12 },
    sectionTitle: { fontSize: 11, fontWeight: 'bold', color: t.title, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    legendRow: { flexDirection: 'row', gap: 14, marginTop: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendLabel: { fontSize: 8, color: t.text, fontWeight: 'bold' },
    barTrack: { height: 9, backgroundColor: t.line, borderRadius: 5, overflow: 'hidden' },
    occTableHead: { flexDirection: 'row', backgroundColor: t.chipBg, borderRadius: 6, paddingVertical: 7, paddingHorizontal: 8, marginBottom: 4 },
    occTableHeadText: { fontSize: 7, color: t.headerFg, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
    occRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: t.line, alignItems: 'center' },
    occRowAlt: { backgroundColor: t.accentSoft },
    occText: { fontSize: 7, color: t.text },
    occTextBold: { fontSize: 7, color: t.title, fontWeight: 'bold' },
    contHeader: { backgroundColor: t.accentSoft, paddingHorizontal: 9, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: t.cardBorder },
    kpiBox: { flex: 1, backgroundColor: t.cardBg, borderRadius: 10, borderWidth: 1, borderColor: t.cardBorder, padding: 12, alignItems: 'center' },
    kpiValue: { fontSize: 22, fontWeight: 'bold', color: t.title },
    kpiLabel: { fontSize: 7, color: t.accent, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 'bold', marginTop: 3 },
  });
}

/* ── Otimização de imagens antes do render (velocidade + tamanho) ── */
async function otimizarDataUrl(src: string, max = 120, quality = 0.72): Promise<string> {
  if (!src || !src.startsWith('data:')) return src;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = document.createElement('img');
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('img'));
      el.src = src;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d');
    if (!ctx) return src;
    ctx.drawImage(img, 0, 0, w, h);
    return cv.toDataURL('image/jpeg', quality);
  } catch {
    return src;
  }
}

async function otimizarLogo(): Promise<string> {
  try {
    const r = await fetch(LOGO_URL);
    const blob = await r.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(new Error('fr'));
      fr.readAsDataURL(blob);
    });
    return await otimizarDataUrl(dataUrl, 160, 0.85);
  } catch {
    return LOGO_URL;
  }
}

async function prepararRelatorio(relatorio: any): Promise<any> {
  const logo = await otimizarLogo();
  const coletores = await Promise.all(
    (relatorio.coletores || []).map(async (c: any) => {
      if (!c.imagem) return { ...c, imagem: null };
      return { ...c, imagem: await otimizarDataUrl(c.imagem, 100, 0.7) };
    })
  );
  return { ...relatorio, coletores, _logo: logo };
}

type PDFDocProps = { relatorio: any; titulo?: string; isolado?: boolean; design?: PdfDesign };

function PDFDoc({ relatorio, titulo, isolado, design = 'classico' }: PDFDocProps) {
  const theme = THEMES[design] || THEMES.classico;
  const S = makeStyles(theme);
  const logoSrc: string = relatorio._logo || LOGO_URL;
  const COLS = isolado ? 1 : 2;
  const ROWS_PER_PAGE = 2;
  const CARD_W = isolado ? 563 : 276;
  const PAD = 14;
  const TITLE_W = CARD_W - 56;
  const TEXT_W = CARD_W - PAD;

  // Geometria segura — nunca estoura a A4 (corrige páginas em branco)
  // A4 = 842; paddingTop 14 + header ~36 + marginBottom 10 + footerReserve 40 = 100
  const CONTENT_H = 842 - 14 - 40; // 788 úteis (footer é absolute)
  const HEADER_H = 36;
  const GAP = 8;
  const usable = CONTENT_H - HEADER_H - GAP; // espaço real para as linhas
  const ROW_H = Math.floor((usable - (ROWS_PER_PAGE - 1) * GAP) / ROWS_PER_PAGE);

  const estLines = (text: any, fontSize: number, width: number): number => {
    const s = String(text ?? '');
    if (!s) return 0;
    const perLine = Math.max(6, Math.floor(width / (fontSize * 0.52)));
    return Math.max(1, Math.ceil(s.length / perLine));
  };
  const estObsH = (o: any): number =>
    estLines(o.titulo, 8, TITLE_W) * 11.5 + 2 +
    11 +
    estLines(o.descricao, 7, TEXT_W) * 10.5 + 2 +
    (o.causas ? estLines(`Causa: ${o.causas}`, 6.5, TEXT_W) * 10 + 1 : 0) +
    (o.solucao ? estLines(`Solução: ${o.solucao}`, 6.5, TEXT_W) * 10 + 2 : 0) +
    8;
  const FULL_HEAD_H = 130;
  const CONT_HEAD_H = 62;
  const SAFETY = 18;

  type Seg = { uid: string; c: any; cont: boolean; obs: any[]; from: number; to: number };
  const segs: Seg[] = [];
  for (const c of relatorio.coletores) {
    const list: any[] = c.observacoes || [];
    if (list.length === 0) {
      segs.push({ uid: `${c.id}-s${segs.length}`, c, cont: false, obs: [], from: 0, to: 0 });
      continue;
    }
    let i = 0;
    let first = true;
    while (i < list.length) {
      const budget = (first ? ROW_H - FULL_HEAD_H : ROW_H - CONT_HEAD_H) - SAFETY;
      const startIdx = i;
      const chunk: any[] = [];
      let used = 0;
      while (i < list.length) {
        const h = estObsH(list[i]);
        if (chunk.length > 0 && used + h > budget) break;
        if (chunk.length === 0 && h > Math.max(budget, 40)) break;
        chunk.push(list[i]);
        used += h;
        i++;
      }
      if (chunk.length === 0 && i < list.length) {
        chunk.push(list[i]);
        i++;
      }
      segs.push({ uid: `${c.id}-s${segs.length}`, c, cont: !first, obs: chunk, from: startIdx, to: i });
      first = false;
    }
  }
  const pages: Seg[][] = [];
  const PER_SEG = COLS * ROWS_PER_PAGE;
  for (let i = 0; i < segs.length; i += PER_SEG) pages.push(segs.slice(i, i + PER_SEG));
  if (pages.length === 0) pages.push([]);

  const gAlta = relatorio.resumo.criticas;
  const gMedia = relatorio.resumo.avisos;
  const gBaixa = Math.max(0, relatorio.resumo.totalObs - gAlta - gMedia);
  const byDept: Record<string, number> = {};
  for (const c of relatorio.coletores) {
    const k = c.departamento || c.localizacao || '—';
    byDept[k] = (byDept[k] || 0) + 1;
  }
  const deptEntries = Object.entries(byDept).sort((a, b) => b[1] - a[1]);
  const maxDept = Math.max(1, ...deptEntries.map(([, v]) => v));
  const top5 = relatorio.coletores
    .map((c: any) => ({ nome: c.nome, setor: c.departamento || c.localizacao || '—', n: (c.observacoes || []).length }))
    .sort((a: any, b: any) => b.n - a.n)
    .slice(0, 5);
  const allObs: any[] = [];
  for (const c of relatorio.coletores) {
    for (const o of c.observacoes || []) {
      allObs.push({ ...o, coletorNome: c.nome, setor: c.departamento || c.localizacao || '—' });
    }
  }
  allObs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const OCC_PER_PAGE = 22;
  const occPages: any[][] = [];
  for (let i = 0; i < allObs.length; i += OCC_PER_PAGE) occPages.push(allObs.slice(i, i + OCC_PER_PAGE));
  const nAnalise = isolado ? 0 : 1;
  const totalPages = 1 + nAnalise + pages.length + occPages.length;
  const pageBase = 1 + nAnalise;

  const sc = (s: string) => (s === 'ativo' ? '#10b981' : s === 'inativo' ? '#ef4444' : '#f59e0b');
  const sl = (s: string) => (s === 'ativo' ? 'ATIVO' : s === 'inativo' ? 'INATIVO' : 'MANUTENÇÃO');

  const equip = isolado ? relatorio.coletores[0] : null;

  const Footer = ({ n }: { n: number }) => (
    <View style={S.footer}>
      <Text style={S.footerText}>BA Elétrica · Controle de Coletores · Confidencial</Text>
      <Text style={S.footerText}>Página {n} de {totalPages}</Text>
    </View>
  );

  const PageHeader = ({ label, n }: { label: string; n: number }) => (
    <View style={S.pageHeader}>
      <View style={S.pageHeaderLeft}>
        <Image src={logoSrc} style={{ width: 18, height: 18, objectFit: 'contain' }} cache />
        <Text style={S.pageHeaderTitle}>{label}</Text>
      </View>
      <Text style={S.pageHeaderPage}>Página {n} de {totalPages}</Text>
    </View>
  );

  const renderSeg = (seg: Seg) => {
    const c = seg.c;
    const crit = (c.observacoes || []).filter((o: any) => o.gravidade === 'alta').length;
    const avi = (c.observacoes || []).filter((o: any) => o.gravidade === 'media').length;
    const inf = (c.observacoes || []).filter((o: any) => o.gravidade === 'baixa').length;
    const color = sc(c.status);
    const total = (c.observacoes || []).length;
    return (
      <View key={seg.uid} style={[S.card, { width: CARD_W, height: ROW_H }]}>
        <View style={S.statusBar}>
          <View style={{ flex: 1, backgroundColor: color }} />
        </View>
        {!seg.cont && (
          <View style={S.cardHead}>
            {c.imagem ? (
              <Image src={c.imagem} style={S.cardImageFull} cache />
            ) : (
              <View style={[S.cardImageFull, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 18, color: '#cbd5e1' }}>▣</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={S.cardName}>{c.nome}</Text>
              <Text style={S.cardModel}>{c.modelo} · {c.numero_serie}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                <View style={{ backgroundColor: color, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 6.5, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 'bold' }}>{sl(c.status)}</Text>
                </View>
              </View>
              <View style={S.infoRow}><Text style={S.infoLabel}>Resp.</Text><Text style={S.infoValue}>{c.responsavel}</Text></View>
              <View style={S.infoRow}><Text style={S.infoLabel}>Depto.</Text><Text style={S.infoValue}>{c.departamento || '—'}</Text></View>
              {c.localizacao ? (
                <View style={S.infoRow}><Text style={S.infoLabel}>Setor</Text><Text style={S.infoValue}>{c.localizacao}</Text></View>
              ) : null}
              <View style={{ flexDirection: 'row', marginTop: 3, gap: 7 }}>
                {crit > 0 ? <Text style={{ fontSize: 7.5, color: '#dc2626', fontWeight: 'bold' }}>{crit} crít.</Text> : null}
                {avi > 0 ? <Text style={{ fontSize: 7.5, color: '#f59e0b', fontWeight: 'bold' }}>{avi} avis.</Text> : null}
                {inf > 0 ? <Text style={{ fontSize: 7.5, color: theme.accent, fontWeight: 'bold' }}>{inf} info</Text> : null}
                {total === 0 ? <Text style={S.noObs}>Sem registros</Text> : null}
              </View>
            </View>
          </View>
        )}
        {seg.cont && (
          <View style={S.contHeader}>
            <Text style={{ fontSize: 9.5, fontWeight: 'bold', color: theme.title }}>{c.nome} · continuação</Text>
            <Text style={{ fontSize: 7, color: theme.accent }}>Registros {seg.from + 1}–{seg.to} de {total}</Text>
            <View style={{ flexDirection: 'row', marginTop: 2, gap: 7 }}>
              {crit > 0 ? <Text style={{ fontSize: 6.5, color: '#dc2626', fontWeight: 'bold' }}>{crit} crít.</Text> : null}
              {avi > 0 ? <Text style={{ fontSize: 6.5, color: '#f59e0b', fontWeight: 'bold' }}>{avi} avis.</Text> : null}
              {inf > 0 ? <Text style={{ fontSize: 6.5, color: theme.accent, fontWeight: 'bold' }}>{inf} info</Text> : null}
            </View>
          </View>
        )}
        {seg.obs.length > 0 && (
          <View style={S.obsSection}>
            {seg.obs.map((o: any) => (
              <View key={o.id} style={{ marginBottom: 4, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: theme.line }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1 }}>
                  <Text style={S.obsTitle}>{o.titulo}</Text>
                  <Text style={S.obsDate}>{new Date(o.created_at).toLocaleDateString('pt-BR')}</Text>
                </View>
                <Text style={[S.obsMeta, { color: (o.gravidade || 'media') === 'alta' ? '#dc2626' : o.gravidade === 'baixa' ? theme.accent : '#f59e0b', fontWeight: 'bold' }]}>
                  {(o.gravidade || 'media') === 'alta' ? 'Crítica' : o.gravidade === 'media' ? 'Média' : 'Baixa'}
                </Text>
                <Text style={S.obsDesc}>{o.descricao}</Text>
                {o.causas ? <Text style={S.obsCause}>Causa: {o.causas}</Text> : null}
                {o.solucao ? <Text style={S.obsFix}>Solução: {o.solucao}</Text> : null}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Document title={titulo || 'Relatório de Coletores'} author="BA Elétrica">
      {/* ── CAPA ── */}
      <Page size="A4" style={S.coverPage} wrap={false}>
        <View style={S.coverHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 22 }}>
            <Image src={logoSrc} style={{ width: 48, height: 48, objectFit: 'contain', marginRight: 14 }} cache />
            <View>
              <Text style={{ fontSize: 11, color: theme.headerFg, letterSpacing: 2, fontWeight: 'bold' }}>BA ELÉTRICA</Text>
              <Text style={{ fontSize: 8, color: theme.accent, letterSpacing: 1 }}>SISTEMA DE GESTÃO</Text>
            </View>
          </View>
          <View style={S.coverAccent} />
          <Text style={S.coverTitle}>{titulo || 'RELATÓRIO DE COLETORES'}</Text>
          <Text style={S.coverSubtitle}>Controle e Gestão de Equipamentos · Documento oficial</Text>
        </View>
        <View style={S.coverBody}>
          {equip && (
            <View style={S.equipCard}>
              <Text style={S.equipTitle}>Dados do Equipamento</Text>
              <View style={S.equipGrid}>
                {([
                  ['Nome', equip.nome],
                  ['Status', sl(equip.status)],
                  ['Modelo', equip.modelo],
                  ['Nº Série', equip.numero_serie],
                  ['Responsável', equip.responsavel],
                  ['Departamento', equip.departamento || '—'],
                  ['Setor', equip.localizacao || '—'],
                  ['Registros', String((equip.observacoes || []).length)],
                ] as const).map(([lab, val]) => (
                  <View key={lab} style={S.equipCell}>
                    <Text style={S.equipLabel}>{lab}</Text>
                    <Text style={[S.equipValue, lab === 'Status' ? { color: sc(equip.status) } : {}]}>{val}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <View style={S.coverStatsRow}>
            {[
              { val: relatorio.resumo.totalColetores, label: 'COLETORES', bg: theme.accentSoft, color: theme.title, border: theme.cardBorder },
              { val: relatorio.resumo.comObservacoes, label: 'COM REGISTROS', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
              { val: relatorio.resumo.totalObs, label: 'REGISTROS', bg: theme.accentSoft, color: theme.title, border: theme.cardBorder },
              { val: relatorio.resumo.criticas, label: 'CRÍTICAS', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
              { val: relatorio.resumo.avisos, label: 'AVISOS', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
            ].map((s, i) => (
              <View key={i} style={[S.coverStatBox, { backgroundColor: s.bg, borderColor: s.border }]}>
                <Text style={[S.coverStatValue, { color: s.color }]}>{s.val}</Text>
                <Text style={S.coverStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
          {!isolado && (
            <>
              <View style={{ flexDirection: 'row', marginBottom: 14, gap: 14 }}>
                {[
                  { n: 'ativo', l: 'Ativos', c: '#15803d' },
                  { n: 'inativo', l: 'Inativos', c: '#dc2626' },
                  { n: 'manutencao', l: 'Manutenção', c: '#b45309' },
                ].map((st) => {
                  const qty = relatorio.coletores.filter((c: any) => c.status === st.n).length;
                  return (
                    <View key={st.n} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: st.c }} />
                      <Text style={{ fontSize: 9, color: theme.title, fontWeight: '600' }}>{st.l}: {qty}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={{ marginBottom: 14 }}>
                <Text style={S.coverPeriodLabel}>Distribuição por setor</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {[...new Set(relatorio.coletores.map((c: any) => c.departamento || c.localizacao || '—'))].slice(0, 18).map((dep: any) => {
                    const qty = relatorio.coletores.filter((c: any) => (c.departamento || c.localizacao) === dep).length;
                    return (
                      <View key={dep} style={{ backgroundColor: theme.accentSoft, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: theme.accent }} />
                        <Text style={{ fontSize: 7.5, color: theme.title, fontWeight: 'bold' }}>{dep} · {qty}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          )}
          <View style={S.coverDivider} />
          <Text style={S.coverPeriodLabel}>Período</Text>
          <Text style={S.coverPeriodValue}>
            {relatorio.periodo.inicio
              ? `${new Date(relatorio.periodo.inicio).toLocaleDateString('pt-BR')}${relatorio.periodo.fim ? ` a ${new Date(relatorio.periodo.fim).toLocaleDateString('pt-BR')}` : ' até hoje'}`
              : 'Todos os períodos'}
          </Text>
          <Text style={S.coverGenLabel}>Gerado em</Text>
          <Text style={S.coverGenValue}>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
          <View style={S.coverCompanyRow}>
            <Image src={logoSrc} style={{ width: 44, height: 44, objectFit: 'contain', marginRight: 12 }} cache />
            <View>
              <Text style={S.coverCompanyName}>BA Elétrica — Controle de Coletores</Text>
              <Text style={S.coverCompanySub}>DOCUMENTO GERADO AUTOMATICAMENTE · USO INTERNO</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* ── ANÁLISE ── */}
      {!isolado && (
        <Page key="analise" size="A4" style={S.page} wrap={false}>
          <PageHeader label="Análise do relatório" n={2} />
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <View style={S.kpiBox}>
              <Text style={S.kpiValue}>{relatorio.resumo.totalColetores}</Text>
              <Text style={S.kpiLabel}>Coletores</Text>
            </View>
            <View style={S.kpiBox}>
              <Text style={S.kpiValue}>{relatorio.resumo.totalObs}</Text>
              <Text style={S.kpiLabel}>Registros</Text>
            </View>
            <View style={S.kpiBox}>
              <Text style={[S.kpiValue, { color: '#dc2626' }]}>{relatorio.resumo.criticas}</Text>
              <Text style={S.kpiLabel}>Críticas</Text>
            </View>
            <View style={S.kpiBox}>
              <Text style={[S.kpiValue, { color: '#b45309' }]}>{relatorio.resumo.avisos}</Text>
              <Text style={S.kpiLabel}>Avisos</Text>
            </View>
            <View style={S.kpiBox}>
              <Text style={[S.kpiValue, { color: theme.accent }]}>{relatorio.resumo.infos ?? 0}</Text>
              <Text style={S.kpiLabel}>Info</Text>
            </View>
          </View>
          <View style={S.sectionCard}>
            <Text style={S.sectionTitle}>Ocorrências por gravidade</Text>
            <View style={{ flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', marginBottom: 6 }}>
              {gAlta > 0 ? <View style={{ flex: gAlta, backgroundColor: '#ef4444' }} /> : null}
              {gMedia > 0 ? <View style={{ flex: gMedia, backgroundColor: '#f59e0b' }} /> : null}
              {gBaixa > 0 ? <View style={{ flex: gBaixa, backgroundColor: theme.barFill }} /> : null}
              {gAlta + gMedia + gBaixa === 0 ? <View style={{ flex: 1, backgroundColor: theme.line }} /> : null}
            </View>
            <View style={S.legendRow}>
              <View style={S.legendItem}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} /><Text style={S.legendLabel}>Críticas: {gAlta}</Text></View>
              <View style={S.legendItem}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b' }} /><Text style={S.legendLabel}>Avisos: {gMedia}</Text></View>
              <View style={S.legendItem}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.barFill }} /><Text style={S.legendLabel}>Informativas: {gBaixa}</Text></View>
            </View>
          </View>
          <View style={S.sectionCard}>
            <Text style={S.sectionTitle}>Coletores por setor</Text>
            {deptEntries.slice(0, 14).map(([dep, qty]) => (
              <View key={dep} style={{ marginBottom: 7 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={S.occTextBold}>{dep}</Text>
                  <Text style={S.occTextBold}>{qty}</Text>
                </View>
                <View style={S.barTrack}>
                  <View style={{ height: 9, width: `${Math.round((qty / maxDept) * 100)}%`, backgroundColor: theme.barFill, borderRadius: 5 }} />
                </View>
              </View>
            ))}
          </View>
          <View style={S.sectionCard}>
            <Text style={S.sectionTitle}>Top 5 com mais registros</Text>
            {top5.length === 0 ? (
              <Text style={S.occText}>Sem registros no período</Text>
            ) : top5.map((t: any, i: number) => (
              <View key={t.nome} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: theme.barFill, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 8, color: '#ffffff', fontWeight: 'bold' }}>{i + 1}</Text>
                </View>
                <Text style={S.occTextBold}>{t.nome}</Text>
                <Text style={S.occText}>{t.setor}</Text>
                <View style={{ flex: 1 }} />
                <Text style={{ fontSize: 8, color: theme.accent, fontWeight: 'bold' }}>{t.n}</Text>
              </View>
            ))}
          </View>
          <Footer n={2} />
        </Page>
      )}

      {/* ── CARDS DE COLETORES ── */}
      {pages.map((pageSegs, pageIdx) => {
        const pageNum = pageBase + pageIdx + 1;
        const rows: any[][] = [];
        for (let i = 0; i < pageSegs.length; i += COLS) rows.push(pageSegs.slice(i, i + COLS));
        if (rows.length === 0) rows.push([]);
        return (
          <Page key={pageIdx} size="A4" style={S.page} wrap={false}>
            <PageHeader label={isolado ? 'Registros do coletor' : 'Relatório de Coletores'} n={pageNum} />
            {rows.map((rowSegs, rowIdx) => {
              const slots: any[] = [...rowSegs];
              while (slots.length < COLS) slots.push(null);
              return (
                <View key={rowIdx} style={S.row} wrap={false}>
                  {slots.map((s, idx) => (
                    <Fragment key={s ? s.uid : `empty-${idx}`}>
                      {s ? renderSeg(s) : <View style={[S.cardEmpty, { width: CARD_W, height: ROW_H }]} />}
                      {idx < COLS - 1 ? <View style={S.cardSpacer} /> : null}
                    </Fragment>
                  ))}
                </View>
              );
            })}
            <Footer n={pageNum} />
          </Page>
        );
      })}

      {/* ── TABELA DE OCORRÊNCIAS ── */}
      {occPages.map((occPage, occIdx) => {
        const pageNum = pageBase + pages.length + occIdx + 1;
        return (
          <Page key={`occ-${occIdx}`} size="A4" style={S.page} wrap={false}>
            <PageHeader label="Ocorrências do período" n={pageNum} />
            <View style={S.occTableHead}>
              <Text style={[S.occTableHeadText, { width: 72 }]}>Coletor</Text>
              <Text style={[S.occTableHeadText, { flex: 1 }]}>Ocorrência</Text>
              <Text style={[S.occTableHeadText, { width: 78 }]}>Setor</Text>
              <Text style={[S.occTableHeadText, { width: 52 }]}>Gravidade</Text>
              <Text style={[S.occTableHeadText, { width: 52 }]}>Data</Text>
            </View>
            {occPage.map((o: any, i: number) => {
              const g = o.gravidade || 'media';
              const gc = g === 'alta' ? '#ef4444' : g === 'media' ? '#f59e0b' : theme.barFill;
              const gl = g === 'alta' ? 'Crítica' : g === 'media' ? 'Média' : 'Baixa';
              return (
                <View key={o.id} style={[S.occRow, i % 2 === 1 ? S.occRowAlt : {}]}>
                  <Text style={[S.occTextBold, { width: 72 }]}>{o.coletorNome}</Text>
                  <View style={{ flex: 1, paddingRight: 5 }}>
                    <Text style={S.occTextBold}>{o.titulo}</Text>
                    <Text style={{ fontSize: 6, color: theme.muted }}>{String(o.descricao || '').slice(0, 110)}</Text>
                  </View>
                  <Text style={[S.occText, { width: 78 }]}>{o.setor}</Text>
                  <View style={{ width: 52 }}>
                    <View style={{ backgroundColor: gc, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2, alignSelf: 'flex-start' }}>
                      <Text style={{ fontSize: 6, color: '#ffffff', fontWeight: 'bold' }}>{gl}</Text>
                    </View>
                  </View>
                  <Text style={[S.occText, { width: 52 }]}>{new Date(o.created_at).toLocaleDateString('pt-BR')}</Text>
                </View>
              );
            })}
            <Footer n={pageNum} />
          </Page>
        );
      })}
    </Document>
  );
}

export async function baixarPDF(relatorio: any, opts?: { nome?: string; isolado?: boolean; design?: PdfDesign }) {
  const titulo = opts?.nome ? `COLETOR — ${opts.nome}` : undefined;
  const otimizado = await prepararRelatorio(relatorio);
  const doc = <PDFDoc relatorio={otimizado} titulo={titulo} isolado={!!opts?.isolado} design={opts?.design || 'classico'} />;
  const pdfBlob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  const dia = new Date().toISOString().slice(0, 10);
  a.download = opts?.nome
    ? `coletor_${opts.nome.replace(/\s+/g, '_')}_${dia}.pdf`
    : `relatorio_${dia}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function baixarDOC(relatorio: any, opts?: { nome?: string; isolado?: boolean; design?: PdfDesign }) {
  const design: PdfDesign = opts?.design || 'classico';
  const th = THEMES[design] || THEMES.classico;
  const esc = (s: any) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  const statusLabel = (s: string) => (s === 'ativo' ? 'ATIVO' : s === 'inativo' ? 'INATIVO' : 'MANUTENÇÃO');
  const statusColor = (s: string) => (s === 'ativo' ? '#10b981' : s === 'inativo' ? '#ef4444' : '#f59e0b');
  const gravLabel = (g: string) => (g === 'alta' ? 'Crítica' : g === 'media' ? 'Média' : 'Baixa');
  const gravColor = (g: string) => (g === 'alta' ? '#dc2626' : g === 'media' ? '#b45309' : th.accent);
  const gravBg = (g: string) => (g === 'alta' ? '#fef2f2' : g === 'media' ? '#fffbeb' : th.accentSoft);
  const isolado = !!opts?.isolado;
  const r = relatorio.resumo;
  const per = relatorio.periodo;
  const periodoTxt = per.inicio
    ? `${new Date(per.inicio).toLocaleDateString('pt-BR')}${per.fim ? ` a ${new Date(per.fim).toLocaleDateString('pt-BR')}` : ' até hoje'}`
    : 'Todos os períodos';
  const tituloDoc = opts?.nome ? `COLETOR — ${esc(opts.nome)}` : 'RELATÓRIO DE COLETORES';
  const equip = isolado ? relatorio.coletores[0] : null;
  const gerado = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const eq = (label: string, valor: any) => `
    <div style="width:48%;margin-bottom:10px;">
      <div style="font-size:9px;color:${th.accent};text-transform:uppercase;letter-spacing:1.2px;font-weight:bold;">${label}</div>
      <div style="font-size:12px;color:#0f172a;font-weight:600;word-break:break-word;">${esc(valor ?? '—')}</div>
    </div>`;

  const equipHtml = equip
    ? `<div style="border:1px solid ${th.cardBorder};border-radius:8px;padding:16px;margin-top:18px;background:${th.accentSoft};page-break-inside:avoid;">
        <div style="font-size:11px;color:${th.title};text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;margin-bottom:10px;border-bottom:2px solid ${th.accent};padding-bottom:6px;">Dados do Equipamento</div>
        <div style="display:flex;flex-wrap:wrap;">
          ${eq('Nome', equip.nome)}
          <div style="width:48%;margin-bottom:10px;">
            <div style="font-size:9px;color:${th.accent};text-transform:uppercase;letter-spacing:1.2px;font-weight:bold;">Status</div>
            <div style="font-size:12px;font-weight:600;color:${statusColor(equip.status)};">${statusLabel(equip.status)}</div>
          </div>
          ${eq('Modelo', equip.modelo)}
          ${eq('Nº Série', equip.numero_serie)}
          ${eq('Responsável', equip.responsavel)}
          ${eq('Departamento', equip.departamento)}
          ${eq('Setor', equip.localizacao)}
          ${eq('Registros', (equip.observacoes || []).length)}
        </div>
      </div>`
    : '';

  const coletorRows = relatorio.coletores
    .map((c: any) => {
      const obsHtml = (c.observacoes || []).length
        ? c.observacoes
            .map(
              (o: any) => `
          <tr style="background:${gravBg(o.gravidade)};">
            <td style="padding:7px 8px;border-bottom:1px solid ${th.line};word-break:break-word;vertical-align:top;"><b style="color:${th.title};">${esc(o.titulo)}</b></td>
            <td style="padding:7px 8px;border-bottom:1px solid ${th.line};word-break:break-word;vertical-align:top;">${esc(o.descricao)}</td>
            <td style="padding:7px 8px;border-bottom:1px solid ${th.line};word-break:break-word;vertical-align:top;color:#b45309;">${esc(o.causas) || '—'}</td>
            <td style="padding:7px 8px;border-bottom:1px solid ${th.line};word-break:break-word;vertical-align:top;color:#15803d;">${esc(o.solucao) || '—'}</td>
            <td style="padding:7px 8px;border-bottom:1px solid ${th.line};text-align:center;vertical-align:top;"><span style="background:${gravColor(o.gravidade)};color:#fff;padding:2px 7px;border-radius:4px;font-size:9px;font-weight:bold;">${gravLabel(o.gravidade)}</span></td>
            <td style="padding:7px 8px;border-bottom:1px solid ${th.line};text-align:center;vertical-align:top;">${new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
          </tr>`
            )
            .join('')
        : `<tr><td colspan="6" style="padding:12px 8px;text-align:center;color:${th.muted};font-style:italic;">Sem registros no período</td></tr>`;

      return `
      <div style="margin:16px 0 12px 0;page-break-inside:avoid;">
        <table style="width:100%;border-collapse:collapse;border:1px solid ${th.cardBorder};table-layout:fixed;">
          <tr style="background:${th.chipBg};">
            <td colspan="3" style="padding:10px 12px;">
              <span style="color:${th.headerFg};font-size:14px;font-weight:bold;word-break:break-word;">${esc(c.nome)}</span><br/>
              <span style="color:${th.accent};font-size:11px;word-break:break-word;">${esc(c.modelo)} · ${esc(c.numero_serie)}</span>
            </td>
            <td style="padding:10px 12px;text-align:right;">
              <span style="background:${statusColor(c.status)};color:#fff;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:bold;">${statusLabel(c.status)}</span>
            </td>
          </tr>
          <tr style="background:${th.accentSoft};">
            <td colspan="2" style="padding:6px 12px;font-size:11px;word-break:break-word;"><b style="color:${th.accent};">Resp.:</b> ${esc(c.responsavel)}</td>
            <td style="padding:6px 12px;font-size:11px;word-break:break-word;"><b style="color:${th.accent};">Depto.:</b> ${esc(c.departamento) || '—'}</td>
            <td style="padding:6px 12px;font-size:11px;text-align:right;word-break:break-word;"><b style="color:${th.accent};">Setor:</b> ${esc(c.localizacao) || '—'}</td>
          </tr>
        </table>
        <table style="width:100%;border-collapse:collapse;margin-top:3px;font-size:10px;table-layout:fixed;border:1px solid ${th.cardBorder};">
          <colgroup>
            <col style="width:18%;"/><col style="width:26%;"/><col style="width:16%;"/>
            <col style="width:18%;"/><col style="width:11%;"/><col style="width:11%;"/>
          </colgroup>
          <tr style="background:${th.barFill};color:#fff;">
            <th style="padding:7px 6px;text-align:left;">Título</th>
            <th style="padding:7px 6px;text-align:left;">Descrição</th>
            <th style="padding:7px 6px;text-align:left;">Causa</th>
            <th style="padding:7px 6px;text-align:left;">Solução</th>
            <th style="padding:7px 6px;text-align:center;">Gravidade</th>
            <th style="padding:7px 6px;text-align:center;">Data</th>
          </tr>
          ${obsHtml}
        </table>
      </div>`;
    })
    .join('');

  const statsHtml = `
  <table style="width:100%;border-collapse:separate;border-spacing:8px 0;margin-top:18px;table-layout:fixed;">
    <tr>
      <td style="background:${th.accentSoft};border:1px solid ${th.cardBorder};border-radius:8px;padding:14px 8px;text-align:center;">
        <div style="font-size:26px;font-weight:bold;color:${th.title};">${r.totalColetores}</div>
        <div style="font-size:9px;color:${th.accent};text-transform:uppercase;letter-spacing:1px;font-weight:bold;">COLETORES</div>
      </td>
      <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 8px;text-align:center;">
        <div style="font-size:26px;font-weight:bold;color:#15803d;">${r.comObservacoes}</div>
        <div style="font-size:9px;color:#15803d;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">COM REGISTROS</div>
      </td>
      <td style="background:${th.accentSoft};border:1px solid ${th.cardBorder};border-radius:8px;padding:14px 8px;text-align:center;">
        <div style="font-size:26px;font-weight:bold;color:${th.title};">${r.totalObs}</div>
        <div style="font-size:9px;color:${th.accent};text-transform:uppercase;letter-spacing:1px;font-weight:bold;">REGISTROS</div>
      </td>
      <td style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 8px;text-align:center;">
        <div style="font-size:26px;font-weight:bold;color:#dc2626;">${r.criticas}</div>
        <div style="font-size:9px;color:#dc2626;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">CRÍTICAS</div>
      </td>
      <td style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 8px;text-align:center;">
        <div style="font-size:26px;font-weight:bold;color:#b45309;">${r.avisos}</div>
        <div style="font-size:9px;color:#b45309;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">AVISOS</div>
      </td>
    </tr>
  </table>`;

  const topSetores = (() => {
    const m: Record<string, number> = {};
    for (const c of relatorio.coletores) {
      const k = c.departamento || c.localizacao || '—';
      m[k] = (m[k] || 0) + 1;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
  })();

  const setoresHtml = isolado ? '' : `
    <div style="margin-top:16px;padding:14px 16px;border:1px solid ${th.cardBorder};border-radius:8px;background:${th.cardBg};page-break-inside:avoid;">
      <div style="font-size:11px;color:${th.title};text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;margin-bottom:10px;border-bottom:2px solid ${th.accent};padding-bottom:6px;">Distribuição por setor</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        ${topSetores.map(([dep, qty]) => `
          <tr>
            <td style="padding:5px 4px;border-bottom:1px solid ${th.line};color:${th.text};">${esc(dep)}</td>
            <td style="padding:5px 4px;border-bottom:1px solid ${th.line};text-align:right;font-weight:bold;color:${th.title};">${qty} coletor${qty > 1 ? 'es' : ''}</td>
          </tr>`).join('')}
      </table>
    </div>`;

  const html = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${tituloDoc}</title>
<meta name='ProgId' content='Word.Document'>
<style>
  @page { size: A4; margin: 1.6cm 1.4cm; }
  body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; margin: 0; color: ${th.text}; font-size: 11.5pt; background: #fff; }
  h1 { color: ${th.headerFg}; font-size: 26pt; margin: 0 0 6px 0; word-break: break-word; letter-spacing: -0.5px; }
  h2 { color: ${th.title}; font-size: 14pt; text-transform: uppercase; letter-spacing: 1.2px; border-bottom: 2.5px solid ${th.accent}; padding-bottom: 6px; margin-top: 28px; }
  table { border-collapse: collapse; width: 100%; }
  td, th { overflow-wrap: break-word; word-wrap: break-word; }
  .muted { color: ${th.muted}; font-size: 11pt; }
  .foot { margin-top: 32px; padding-top: 12px; border-top: 2px solid ${th.footerBorder}; font-size: 9.5pt; color: ${th.accent}; font-weight: bold; letter-spacing: 0.5px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 9.5pt; font-weight: bold; color: #fff; }
  @media print {
    body { background: #fff; }
    h2 { page-break-after: avoid; }
  }
</style>
</head>
<body>
  <div style="background:linear-gradient(135deg, ${th.coverGrad[0]}, ${th.coverGrad[1]});padding:32px 36px;border-radius:0 0 12px 12px;">
    <div style="color:${th.accent};font-size:11px;letter-spacing:3px;font-weight:bold;">BA ELÉTRICA · SISTEMA DE GESTÃO</div>
    <div style="width:72px;height:5px;background:${th.accent};border-radius:3px;margin:14px 0;"></div>
    <div style="color:${th.headerFg};font-size:30px;font-weight:bold;line-height:1.15;">${tituloDoc}</div>
    <div style="color:${th.accent};font-size:12px;margin-top:6px;letter-spacing:0.5px;">Controle e Gestão de Equipamentos · Documento oficial</div>
  </div>

  ${equipHtml}
  ${statsHtml}
  ${setoresHtml}

  <table style="margin-top:20px;font-size:11.5pt;width:100%;">
    <tr>
      <td style="padding:8px 4px;border-bottom:1px solid ${th.line};width:50%;"><b style="color:${th.accent};">Período:</b> ${esc(periodoTxt)}</td>
      <td style="padding:8px 4px;border-bottom:1px solid ${th.line};width:50%;"><b style="color:${th.accent};">Gerado em:</b> ${gerado}</td>
    </tr>
    <tr>
      <td style="padding:8px 4px;border-bottom:1px solid ${th.line};"><b style="color:${th.accent};">Tipo:</b> ${isolado ? 'Coletor individual' : 'Relatório geral'}</td>
      <td style="padding:8px 4px;border-bottom:1px solid ${th.line};"><b style="color:${th.accent};">Classificação:</b> Uso interno</td>
    </tr>
  </table>

  <h2>${isolado ? 'Registros do coletor' : 'Detalhamento por Coletor'}</h2>
  ${coletorRows}

  <div class="foot">
    BA Elétrica — Controle de Coletores · Documento gerado automaticamente em ${gerado} · Uso interno
  </div>
</body></html>`;

  const blob = new Blob(['﻿' + html], { type: 'application/msword;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dia = new Date().toISOString().slice(0, 10);
  a.download = opts?.nome
    ? `coletor_${opts.nome.replace(/\s+/g, '_')}_${dia}.doc`
    : `relatorio_${dia}.doc`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
