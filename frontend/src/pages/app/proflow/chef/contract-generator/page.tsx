import { useCallback, useContext, useEffect, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, InputLabel, MenuItem,
  Paper, Select, Step, StepButton, Stepper, TextField, Typography,
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from '@/context/AuthContext';
import api from '@/services/api';
import { getTasks, getUsers, sendContract, uploadChefFiles } from '@/services/api';

const STEPS = [
  'Prestataire', 'Client', 'Contrat', 'Projet',
  'Finances', 'Clauses', 'Récapitulatif',
];

const DEFAULT_FORM = {
  p_company: 'ProFlow Dev SARL', p_rc: '', p_address: '', p_tel: '', p_email: '', p_web: '', p_rep: '',
  c_name: '', c_company: '', c_address: '', c_tel: '', c_email: '', c_role: '', c_rc: '',
  ct_ref: `CONTRAT-${new Date().getFullYear()}-001`, ct_date: new Date().toISOString().split('T')[0],
  ct_start: '', ct_end: '', ct_pm: '', ct_lieu: 'Gabès',
  pr_title: '', pr_desc: '', pr_tech: '',
  fi_ht: '5000', fi_tva: '19', fi_devise: 'TND', fi_mode: 'Virement bancaire',
  cl_garantie: '3', cl_delai: '48', cl_maintenance: '', cl_pi: 'full', cl_pi_detail: '', cl_preavis: '15', cl_penalite: '1', cl_juridiction: 'Tribunal de Commerce', cl_extra: '',
};

type FormData = typeof DEFAULT_FORM;
type Livrable = { nom: string; periode: string; desc: string };
type Echeance = { label: string; pct: number };

function fmtDate(s: string) {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function buildPDF(form: FormData, livrables: Livrable[], _echeances: Echeance[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, ML = 18, MR = 18, MT = 18, CW = W - ML - MR;
  const NAVY = [11, 17, 32] as [number, number, number];
  const ACCENT = [26, 63, 255] as [number, number, number];
  const TEAL = [0, 158, 126] as [number, number, number];
  const INK2 = [46, 58, 92] as [number, number, number];
  const INK3 = [107, 116, 152] as [number, number, number];
  const INK4 = [168, 174, 202] as [number, number, number];
  const BG = [245, 246, 251] as [number, number, number];
  const BORDER = [221, 225, 240] as [number, number, number];
  const WHITE = [255, 255, 255] as [number, number, number];

  const ht = parseFloat(form.fi_ht) || 0;
  const tva = parseFloat(form.fi_tva) || 0;
  const ttc = ht * (1 + tva / 100);
  const devise = form.fi_devise;
  let pageNum = 1;

  const fill = (x: number, y: number, w: number, h: number, rgb: [number,number,number]) => { doc.setFillColor(...rgb); doc.rect(x, y, w, h, 'F'); };
  const sf = (style: string, size: number, color?: [number,number,number]) => {
    doc.setFont('helvetica', style); doc.setFontSize(size);
    if (color) doc.setTextColor(...color);
  };
  const t = (s: string, x: number, y: number, opts?: Record<string,unknown>) => doc.text(String(s ?? ''), x, y, opts as Parameters<typeof doc.text>[3]);
  const banner = (label: string, y: number) => { fill(ML, y, CW, 6.5, ACCENT); sf('bold', 8.5, WHITE); t(label.toUpperCase(), ML + 3, y + 4.3); return y + 9.5; };
  const infoLine = (label: string, val: string, x: number, y: number, colW: number) => {
    sf('bold', 7.5, INK3); t(label, x, y);
    sf('normal', 7.5, INK2);
    const lines = doc.splitTextToSize(String(val || '—'), colW - 28);
    t(lines, x + 28, y);
    return y + lines.length * 4 + 1;
  };
  const footer = () => {
    const fy = 287;
    fill(0, fy - 2, W, 12, NAVY); sf('normal', 7, INK4);
    t(`${form.ct_ref} — ${form.p_company}`, ML, fy + 3.5);
    t(`Page ${pageNum}`, W - MR, fy + 3.5, { align: 'right' });
  };
  const newPage = () => { doc.addPage(); pageNum++; footer(); };

  // Page 1
  fill(0, 0, W, 42, NAVY);
  sf('bold', 22, WHITE); t('ProFlow', ML, 18);
  sf('normal', 8, INK4); t('Plateforme de développement & gestion de projets', ML, 24);
  sf('bold', 16, WHITE); t('CONTRAT DE', W - MR, 16, { align: 'right' }); t('DÉVELOPPEMENT', W - MR, 25, { align: 'right' });
  sf('bold', 7.5, TEAL); t(`Réf : ${form.ct_ref}`, ML + 2, 39);
  sf('normal', 7.5, INK4); t(`Signé le : ${fmtDate(form.ct_date)}`, ML + 52, 39);

  let y = 50;
  const colW = (CW - 6) / 2;
  fill(ML, y, colW, 7, ACCENT); sf('bold', 8.5, WHITE); t('LE PRESTATAIRE', ML + 3, y + 4.5);
  fill(ML, y + 7, colW, 38, BG); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3); doc.rect(ML, y, colW, 45);
  let py = y + 12;
  py = infoLine('Société', form.p_company, ML + 3, py, colW);
  py = infoLine('Représentant', form.p_rep, ML + 3, py, colW);
  py = infoLine('Adresse', form.p_address, ML + 3, py, colW);
  py = infoLine('E-mail', form.p_email, ML + 3, py, colW);

  const cx = ML + colW + 6;
  fill(cx, y, colW, 7, TEAL); sf('bold', 8.5, WHITE); t('LE CLIENT', cx + 3, y + 4.5);
  fill(cx, y + 7, colW, 38, BG); doc.rect(cx, y, colW, 45);
  py = y + 12;
  py = infoLine('Nom', form.c_name, cx + 3, py, colW);
  py = infoLine('Société', form.c_company, cx + 3, py, colW);
  py = infoLine('Adresse', form.c_address, cx + 3, py, colW);
  infoLine('E-mail', form.c_email, cx + 3, py, colW);
  y += 50;

  y = banner('Détails du contrat', y);
  fill(ML, y, CW, 18, BG); doc.rect(ML, y, CW, 18, 'S');
  const third = CW / 3;
  [['Chef de projet', form.ct_pm], ['Début', fmtDate(form.ct_start)], ['Fin prévue', fmtDate(form.ct_end)]].forEach(([lbl, val], i) => {
    sf('bold', 7, INK3); t(lbl, ML + i * third + 4, y + 5.5);
    sf('bold', 9, INK2); t(val, ML + i * third + 4, y + 12);
  });
  y += 22;

  y = banner('Objet du contrat', y);
  sf('bold', 10, NAVY);
  const titleLines = doc.splitTextToSize(form.pr_title, CW);
  t(titleLines, ML, y); y += titleLines.length * 5 + 2;
  if (form.pr_tech) {
    fill(ML, y, CW, 6, [230, 236, 255]); sf('bold', 7, ACCENT); t('TECHNOLOGIES :', ML + 3, y + 4);
    sf('normal', 7, INK2); t(form.pr_tech, ML + 33, y + 4); y += 9;
  }
  sf('normal', 8.5, INK2);
  const descLines = doc.splitTextToSize(form.pr_desc, CW);
  t(descLines, ML, y);
  footer();

  // Page 2
  newPage(); y = MT;
  y = banner('Livrables & Planning', y);
  autoTable(doc, {
    head: [['#', 'Livrable', 'Période', 'Description']],
    body: livrables.map((l, i) => [`${i + 1}`, l.nom || '—', l.periode || '—', l.desc || '—']),
    startY: y, margin: { left: ML, right: MR },
    styles: { font: 'helvetica', fontSize: 8, textColor: INK2, cellPadding: 3 },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: BG },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  y = banner('Conditions financières', y);
  autoTable(doc, {
    head: [['Description', 'Montant']],
    body: [
      ['Montant HT', `${ht.toFixed(3)} ${devise}`],
      [`TVA (${tva}%)`, `${(ht * tva / 100).toFixed(3)} ${devise}`],
      ['Montant TTC', `${ttc.toFixed(3)} ${devise}`],
    ],
    startY: y, margin: { left: ML, right: MR },
    styles: { font: 'helvetica', fontSize: 8.5, textColor: INK2, cellPadding: 3.5 },
    headStyles: { fillColor: INK2, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  });

  // Page 3 signatures
  newPage(); y = MT;
  y = banner('Signatures', y);
  const sigW = (CW - 6) / 2;
  fill(ML, y, sigW, 6, INK2); sf('bold', 8.5, WHITE); t('LE PRESTATAIRE', ML + 3, y + 4);
  fill(ML, y + 6, sigW, 44, BG); doc.rect(ML, y, sigW, 50);
  sf('normal', 7.5, INK3);
  t(`Nom : ${form.p_rep}`, ML + 4, y + 14);
  t(`Date : ${fmtDate(form.ct_date)}`, ML + 4, y + 21);
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.5); doc.line(ML + 24, y + 45, ML + sigW - 4, y + 45);
  const sx = ML + sigW + 6;
  fill(sx, y, sigW, 6, TEAL); sf('bold', 8.5, WHITE); t('LE CLIENT', sx + 3, y + 4);
  fill(sx, y + 6, sigW, 44, BG); doc.rect(sx, y, sigW, 50);
  sf('normal', 7.5, INK3);
  t(`Nom : ${form.c_name}`, sx + 4, y + 14);
  t(`Date : ${fmtDate(form.ct_date)}`, sx + 4, y + 21);
  doc.line(sx + 24, y + 45, sx + sigW - 4, y + 45);

  return doc;
}

export default function Page() {
  const [step, setStep] = useState(0);
  const [form, setFormState] = useState<FormData>({ ...DEFAULT_FORM });
  const [livrables, setLivrables] = useState<Livrable[]>([
    { nom: 'Sprint 1', periode: '', desc: '' },
    { nom: 'Livraison finale', periode: '', desc: '' },
  ]);
  const [echeances, setEcheances] = useState<Echeance[]>([
    { label: 'À la signature', pct: 30 },
    { label: 'Livraison finale', pct: 70 },
  ]);
  const [toast, setToast] = useState<{ msg: string; type?: string } | null>(null);
  const [sendModal, setSendModal] = useState(false);

  const { user } = useContext(AuthContext);

  const set = useCallback((k: keyof FormData, v: string) => setFormState(f => ({ ...f, [k]: v })), []);

  const showToast = (msg: string, type?: string) => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3200);
  };

  const ht = parseFloat(form.fi_ht) || 0;
  const tva = parseFloat(form.fi_tva) || 0;
  const ttc = ht * (1 + tva / 100);

  const handleGenerate = () => {
    try {
      const doc = buildPDF(form, livrables, echeances);
      doc.save(`${form.ct_ref || 'contrat'}.pdf`);
      showToast('PDF généré avec succès !', 'success');
    } catch { showToast('Erreur lors de la génération', 'error'); }
  };

  const isLast = step === STEPS.length - 1;

  return (
    <Box className="flex flex-col gap-4">
      <Typography variant="h4" fontWeight={700}>Générateur de Contrat</Typography>

      {toast && (
        <Alert severity={toast.type === 'error' ? 'error' : 'success'}>{toast.msg}</Alert>
      )}

      {/* Stepper */}
      <Stepper nonLinear activeStep={step} alternativeLabel sx={{ overflowX: 'auto' }}>
        {STEPS.map((label, i) => (
          <Step key={label} completed={i < step}>
            <StepButton onClick={() => setStep(i)}>{label}</StepButton>
          </Step>
        ))}
      </Stepper>

      {/* Step content */}
      <Paper sx={{ p: 3 }}>
        {step === 0 && <StepPrestataire form={form} set={set} />}
        {step === 1 && <StepClient form={form} set={set} />}
        {step === 2 && <StepContrat form={form} set={set} />}
        {step === 3 && <StepProjet form={form} set={set} livrables={livrables} setLivrables={setLivrables} />}
        {step === 4 && <StepFinances form={form} set={set} echeances={echeances} setEcheances={setEcheances} ttc={ttc} />}
        {step === 5 && <StepClauses form={form} set={set} />}
        {step === 6 && <StepRecap form={form} livrables={livrables} echeances={echeances} ttc={ttc} />}
      </Paper>

      {/* Navigation */}
      <Box className="flex items-center justify-between">
        <Button variant="outlined" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
          ← Précédent
        </Button>
        <Typography variant="body2" color="text.secondary">Étape {step + 1} / {STEPS.length}</Typography>
        {isLast ? (
          <Box className="flex gap-2">
            <Button variant="outlined" color="success" onClick={handleGenerate}>Télécharger PDF</Button>
            <Button variant="contained" onClick={() => setSendModal(true)}>📤 Envoyer au Client</Button>
          </Box>
        ) : (
          <Button variant="contained" onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}>
            Suivant →
          </Button>
        )}
      </Box>

      {sendModal && (
        <SendModal
          open={sendModal}
          onClose={() => setSendModal(false)}
          form={form}
          livrables={livrables}
          echeances={echeances}
          showToast={showToast}
          user={user}
        />
      )}
    </Box>
  );
}

// ── Sub-step components ──────────────────────────────────────────────────────
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <Box sx={{ gridColumn: full ? '1 / -1' : undefined }}>
      <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" sx={{ mb: 0.5 }}>{label}</Typography>
      {children}
    </Box>
  );
}

function StepPrestataire({ form, set }: { form: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ gridColumn: '1/-1' }}>Votre entreprise</Typography>
      <Field label="Nom de la société *"><TextField size="small" fullWidth value={form.p_company} onChange={e => set('p_company', e.target.value)} /></Field>
      <Field label="Registre de commerce"><TextField size="small" fullWidth value={form.p_rc} onChange={e => set('p_rc', e.target.value)} /></Field>
      <Field label="Adresse complète" full><TextField size="small" fullWidth value={form.p_address} onChange={e => set('p_address', e.target.value)} /></Field>
      <Field label="Téléphone"><TextField size="small" fullWidth value={form.p_tel} onChange={e => set('p_tel', e.target.value)} /></Field>
      <Field label="E-mail *"><TextField size="small" fullWidth type="email" value={form.p_email} onChange={e => set('p_email', e.target.value)} /></Field>
      <Field label="Site web"><TextField size="small" fullWidth value={form.p_web} onChange={e => set('p_web', e.target.value)} /></Field>
      <Field label="Représentant légal *"><TextField size="small" fullWidth value={form.p_rep} onChange={e => set('p_rep', e.target.value)} /></Field>
    </Box>
  );
}

function StepClient({ form, set }: { form: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ gridColumn: '1/-1' }}>Informations du client</Typography>
      <Field label="Nom & Prénom *"><TextField size="small" fullWidth value={form.c_name} onChange={e => set('c_name', e.target.value)} /></Field>
      <Field label="Société"><TextField size="small" fullWidth value={form.c_company} onChange={e => set('c_company', e.target.value)} /></Field>
      <Field label="Adresse" full><TextField size="small" fullWidth value={form.c_address} onChange={e => set('c_address', e.target.value)} /></Field>
      <Field label="Téléphone"><TextField size="small" fullWidth value={form.c_tel} onChange={e => set('c_tel', e.target.value)} /></Field>
      <Field label="E-mail *"><TextField size="small" fullWidth type="email" value={form.c_email} onChange={e => set('c_email', e.target.value)} /></Field>
      <Field label="Fonction"><TextField size="small" fullWidth value={form.c_role} onChange={e => set('c_role', e.target.value)} /></Field>
    </Box>
  );
}

function StepContrat({ form, set }: { form: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ gridColumn: '1/-1' }}>Références du contrat</Typography>
      <Field label="Référence *"><TextField size="small" fullWidth value={form.ct_ref} onChange={e => set('ct_ref', e.target.value)} /></Field>
      <Field label="Date de signature *"><TextField size="small" fullWidth type="date" value={form.ct_date} onChange={e => set('ct_date', e.target.value)} /></Field>
      <Field label="Date de début *"><TextField size="small" fullWidth type="date" value={form.ct_start} onChange={e => set('ct_start', e.target.value)} /></Field>
      <Field label="Date de fin prévue *"><TextField size="small" fullWidth type="date" value={form.ct_end} onChange={e => set('ct_end', e.target.value)} /></Field>
      <Field label="Chef de projet *"><TextField size="small" fullWidth value={form.ct_pm} onChange={e => set('ct_pm', e.target.value)} /></Field>
      <Field label="Lieu de signature"><TextField size="small" fullWidth value={form.ct_lieu} onChange={e => set('ct_lieu', e.target.value)} /></Field>
    </Box>
  );
}

function StepProjet({ form, set, livrables, setLivrables }: { form: FormData; set: (k: keyof FormData, v: string) => void; livrables: Livrable[]; setLivrables: React.Dispatch<React.SetStateAction<Livrable[]>> }) {
  return (
    <Box className="flex flex-col gap-3">
      <Typography variant="subtitle1" fontWeight={700}>Projet & Livrables</Typography>
      <TextField size="small" fullWidth label="Titre du projet *" value={form.pr_title} onChange={e => set('pr_title', e.target.value)} />
      <TextField size="small" fullWidth multiline rows={4} label="Description détaillée *" value={form.pr_desc} onChange={e => set('pr_desc', e.target.value)} />
      <TextField size="small" fullWidth label="Technologies utilisées" value={form.pr_tech} onChange={e => set('pr_tech', e.target.value)} />
      <Divider />
      <Typography variant="subtitle2" fontWeight={600}>Livrables / Sprints</Typography>
      {livrables.map((l, i) => (
        <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 1, alignItems: 'flex-start' }}>
          <TextField size="small" label="Nom" value={l.nom} onChange={e => setLivrables(p => p.map((x, j) => j === i ? { ...x, nom: e.target.value } : x))} />
          <TextField size="small" label="Période" value={l.periode} onChange={e => setLivrables(p => p.map((x, j) => j === i ? { ...x, periode: e.target.value } : x))} />
          <TextField size="small" label="Description" value={l.desc} onChange={e => setLivrables(p => p.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))} />
          <Button color="error" onClick={() => setLivrables(p => p.filter((_, j) => j !== i))}>×</Button>
        </Box>
      ))}
      <Button variant="outlined" size="small" onClick={() => setLivrables(p => [...p, { nom: `Sprint ${p.length + 1}`, periode: '', desc: '' }])}>
        + Ajouter livrable
      </Button>
    </Box>
  );
}

function StepFinances({ form, set, echeances, setEcheances, ttc }: { form: FormData; set: (k: keyof FormData, v: string) => void; echeances: Echeance[]; setEcheances: React.Dispatch<React.SetStateAction<Echeance[]>>; ttc: number }) {
  const totalPct = echeances.reduce((s, e) => s + e.pct, 0);
  return (
    <Box className="flex flex-col gap-3">
      <Typography variant="subtitle1" fontWeight={700}>Conditions financières</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
        <TextField size="small" label="Montant HT *" type="number" value={form.fi_ht} onChange={e => set('fi_ht', e.target.value)} />
        <TextField size="small" label="TVA (%)" type="number" value={form.fi_tva} onChange={e => set('fi_tva', e.target.value)} />
        <TextField size="small" label="Montant TTC" value={`${ttc.toFixed(3)} ${form.fi_devise}`} inputProps={{ readOnly: true }} />
      </Box>
      <FormControl size="small" sx={{ width: 200 }}>
        <InputLabel>Devise</InputLabel>
        <Select value={form.fi_devise} onChange={e => set('fi_devise', e.target.value as string)} label="Devise">
          {['TND', 'EUR', 'USD', 'MAD', 'DZD'].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
        </Select>
      </FormControl>
      <Divider />
      <Typography variant="subtitle2" fontWeight={600}>
        Échéancier {totalPct === 100 ? '✓' : `(${totalPct}% — doit être 100%)`}
      </Typography>
      {echeances.map((e, i) => (
        <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 1 }}>
          <TextField size="small" label="Description" value={e.label} onChange={ev => setEcheances(p => p.map((x, j) => j === i ? { ...x, label: ev.target.value } : x))} />
          <TextField size="small" label="% " type="number" value={e.pct} onChange={ev => setEcheances(p => p.map((x, j) => j === i ? { ...x, pct: parseFloat(ev.target.value) || 0 } : x))} />
          <TextField size="small" label="Montant TTC" value={(ttc * e.pct / 100).toFixed(3)} inputProps={{ readOnly: true }} />
          <Button color="error" onClick={() => setEcheances(p => p.filter((_, j) => j !== i))}>×</Button>
        </Box>
      ))}
      <Button variant="outlined" size="small" onClick={() => setEcheances(p => [...p, { label: 'Nouvelle échéance', pct: 0 }])}>
        + Ajouter échéance
      </Button>
    </Box>
  );
}

function StepClauses({ form, set }: { form: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <Box className="flex flex-col gap-3">
      <Typography variant="subtitle1" fontWeight={700}>Clauses & Conditions</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <TextField size="small" label="Durée de garantie (mois)" type="number" value={form.cl_garantie} onChange={e => set('cl_garantie', e.target.value)} />
        <TextField size="small" label="Délai correction (heures)" type="number" value={form.cl_delai} onChange={e => set('cl_delai', e.target.value)} />
      </Box>
      <TextField size="small" fullWidth multiline rows={3} label="Description maintenance" value={form.cl_maintenance} onChange={e => set('cl_maintenance', e.target.value)} />
      <FormControl size="small" fullWidth>
        <InputLabel>Propriété intellectuelle</InputLabel>
        <Select value={form.cl_pi} onChange={e => set('cl_pi', e.target.value as string)} label="Propriété intellectuelle">
          <MenuItem value="full">Transfert total au client</MenuItem>
          <MenuItem value="license">Licence d'utilisation</MenuItem>
          <MenuItem value="shared">Propriété partagée</MenuItem>
        </Select>
      </FormControl>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <TextField size="small" label="Préavis résiliation (jours)" type="number" value={form.cl_preavis} onChange={e => set('cl_preavis', e.target.value)} />
        <TextField size="small" label="Pénalité retard (%/semaine)" type="number" value={form.cl_penalite} onChange={e => set('cl_penalite', e.target.value)} />
      </Box>
      <TextField size="small" fullWidth label="Juridiction compétente" value={form.cl_juridiction} onChange={e => set('cl_juridiction', e.target.value)} />
      <TextField size="small" fullWidth multiline rows={2} label="Clauses supplémentaires (optionnel)" value={form.cl_extra} onChange={e => set('cl_extra', e.target.value)} />
    </Box>
  );
}

function StepRecap({ form, livrables, echeances, ttc }: { form: FormData; livrables: Livrable[]; echeances: Echeance[]; ttc: number }) {
  const blocks = [
    { title: 'Prestataire', rows: [['Société', form.p_company], ['Représentant', form.p_rep], ['E-mail', form.p_email]] },
    { title: 'Client', rows: [['Nom', form.c_name], ['Société', form.c_company], ['E-mail', form.c_email]] },
    { title: 'Contrat', rows: [['Référence', form.ct_ref], ['Début', fmtDate(form.ct_start)], ['Fin', fmtDate(form.ct_end)]] },
    { title: 'Finances', rows: [['Montant HT', `${parseFloat(form.fi_ht).toFixed(3)} ${form.fi_devise}`], ['TVA', `${form.fi_tva}%`], ['Montant TTC', `${ttc.toFixed(3)} ${form.fi_devise}`]] },
  ];
  return (
    <Box className="flex flex-col gap-3">
      <Typography variant="subtitle1" fontWeight={700}>Récapitulatif</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {blocks.map(b => (
          <Box key={b.title} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{b.title}</Typography>
            {b.rows.map(([k, v]) => (
              <Box key={k} className="flex justify-between">
                <Typography variant="caption" color="text.secondary">{k}</Typography>
                <Typography variant="caption" fontWeight={500}>{v || '—'}</Typography>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
      <Typography variant="body2" color="text.secondary">
        Projet: {form.pr_title} · {livrables.length} livrable(s) · {echeances.length} échéance(s)
      </Typography>
    </Box>
  );
}

function SendModal({ open, onClose, form, livrables, echeances, showToast, user }: {
  open: boolean; onClose: () => void; form: FormData; livrables: Livrable[];
  echeances: Echeance[]; showToast: (msg: string, type?: string) => void;
  user: { email?: string } | null;
}) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<{ _id: string; name: string; email: string }[]>([]);
  const [projects, setProjects] = useState<{ _id: string; title: string; clientEmail: string }[]>([]);
  const [clientEmail, setClientEmail] = useState(form.c_email || '');
  const [projectId, setProjectId] = useState('');

  const ht = parseFloat(form.fi_ht) || 0;
  const tvaV = parseFloat(form.fi_tva) || 0;
  const ttcV = ht * (1 + tvaV / 100);

  useEffect(() => {
    Promise.all([getUsers({ role: 'client' }), getTasks()])
      .then(([u, t]) => {
        setClients(u);
        setProjects(t);
        // Auto-select project if client email matches
        if (form.c_email) {
          const match = t.find((p: { clientEmail: string }) =>
            (p.clientEmail || '').toLowerCase() === form.c_email.toLowerCase()
          );
          if (match) setProjectId(match._id);
        }
      });
  }, []);

  const filteredProjects = projects.filter(p =>
    (p.clientEmail || '').toLowerCase() === clientEmail.toLowerCase()
  );

  const selectedClient = clients.find(c => c.email === clientEmail);
  const selectedProject = projects.find(p => p._id === projectId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return setError('Veuillez sélectionner un projet');
    if (!password) return setError('Mot de passe requis pour confirmer l\'envoi');
    setLoading(true);
    setError('');
    try {
      const authRes = await api.post('/api/auth/login', { email: user?.email, password });
      if (!authRes.data.token) throw new Error('Mot de passe incorrect');

      // Auto-generate PDF from form data
      const doc = buildPDF(form, livrables, echeances);
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], `${form.ct_ref || 'contrat'}.pdf`, { type: 'application/pdf' });

      const clientName = selectedClient?.name || form.c_name;

      const fd = new FormData();
      fd.append('pdf', pdfFile);
      fd.append('ref', form.ct_ref);
      fd.append('title', `Contrat : ${clientName}`);
      fd.append('clientEmail', clientEmail);
      fd.append('clientName', clientName);
      fd.append('projectTitle', selectedProject?.title || form.pr_title);
      fd.append('prestataireEmail', form.p_email);
      fd.append('prestataireCompany', form.p_company);
      fd.append('montantTtc', `${ttcV.toFixed(3)} ${form.fi_devise}`);
      fd.append('devise', form.fi_devise);
      fd.append('dateSignature', form.ct_date);

      await sendContract(fd);

      const fdTask = new FormData();
      fdTask.append('files', pdfFile);
      await uploadChefFiles(projectId, fdTask);

      showToast('Contrat généré et envoyé au client avec succès !', 'success');
      onClose();
    } catch (e: unknown) {
      setError((e as { message?: string }).message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box className="flex items-center gap-2">
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 18 }}>📄</Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>Envoyer le contrat au client</Typography>
            <Typography variant="caption" color="text.secondary">Le contrat sera généré automatiquement depuis le devis</Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        {/* Contract summary card */}
        <Paper
          variant="outlined"
          sx={{ p: 2, mb: 3, bgcolor: 'primary.main', borderColor: 'primary.main', borderRadius: 2 }}
        >
          <Typography variant="caption" fontWeight={700} sx={{ color: 'white', opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Récapitulatif du contrat généré
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 1.5 }}>
            {[
              { label: 'Référence', value: form.ct_ref || '—' },
              { label: 'Montant TTC', value: `${ttcV.toFixed(3)} ${form.fi_devise}` },
              { label: 'Client', value: form.c_name || '—' },
              { label: 'Projet', value: form.pr_title || '—' },
              { label: 'Début', value: fmtDate(form.ct_start) },
              { label: 'Fin prévue', value: fmtDate(form.ct_end) },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography variant="caption" sx={{ color: 'white', opacity: 0.7, display: 'block', fontSize: 10 }}>{label}</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ color: 'white' }}>{value}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`${livrables.length} livrable(s)`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 10 }}
            />
            <Chip
              label={`TVA ${form.fi_tva}%`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 10 }}
            />
            <Chip
              label={form.fi_mode || 'Virement'}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 10 }}
            />
          </Box>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" id="send-form" onSubmit={handleSend} className="flex flex-col gap-3">
          <FormControl fullWidth size="small">
            <InputLabel>Client destinataire *</InputLabel>
            <Select
              value={clientEmail}
              onChange={e => { setClientEmail(e.target.value as string); setProjectId(''); }}
              label="Client destinataire *"
              required
            >
              {clients.map(c => (
                <MenuItem key={c._id} value={c.email}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{c.email}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Projet associé *</InputLabel>
            <Select
              value={projectId}
              onChange={e => setProjectId(e.target.value as string)}
              label="Projet associé *"
              required
            >
              {filteredProjects.map(p => (
                <MenuItem key={p._id} value={p._id}>{p.title}</MenuItem>
              ))}
              {!filteredProjects.length && (
                <MenuItem disabled>Aucun projet pour ce client</MenuItem>
              )}
            </Select>
          </FormControl>

          <Divider>
            <Typography variant="caption" color="text.secondary">Confirmation d'identité</Typography>
          </Divider>

          <TextField
            type="password"
            size="small"
            fullWidth
            label="Votre mot de passe"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            helperText="Requis pour confirmer l'envoi du contrat"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Annuler
        </Button>
        <Button
          type="submit"
          form="send-form"
          variant="contained"
          disabled={loading || !projectId || !password}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ minWidth: 180 }}
        >
          {loading ? 'Génération & Envoi…' : '📤 Générer & Envoyer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
