import React, { useState, useCallback, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Sidebar from './Sidebar';
import './ContratGenerator.css';

const TOTAL_STEPS = 7;
const STEPS = [
  { label: 'Prestataire', sub: 'Votre entreprise' },
  { label: 'Client', sub: 'Informations client' },
  { label: 'Contrat', sub: 'Références & dates' },
  { label: 'Projet', sub: 'Description & livrables' },
  { label: 'Finances', sub: 'Montants & échéances' },
  { label: 'Clauses', sub: 'Garantie & conditions' },
  { label: 'Récapitulatif', sub: 'Vérifier & générer' },
];

const DEFAULT_FORM = {
  p_company: 'ProFlow Dev SARL',
  p_rc: 'RC B123456789',
  p_address: '12 Rue des Développeurs, 1002 Tunis, Tunisie',
  p_tel: '+216 71 000 000',
  p_email: 'contact@proflow.tn',
  p_web: 'www.proflow.tn',
  p_rep: 'Karim Benali, Chef de projet',
  c_name: 'Yassine Belkaid',
  c_company: 'TechStart SARL',
  c_address: "45 Avenue de la République, 4000 Sousse, Tunisie",
  c_tel: '+216 55 123 456',
  c_email: 'yassine.belkaid@techstart.tn',
  c_role: 'Directeur Général',
  c_rc: '',
  ct_ref: 'CONTRAT-2025-047',
  ct_date: '2025-05-14',
  ct_start: '2025-05-19',
  ct_end: '2025-08-19',
  ct_pm: 'Karim Benali',
  ct_lieu: 'Tunis',
  pr_title: "Application E-commerce — Mode & Lifestyle",
  pr_desc: "Développement d'une plateforme e-commerce complète dédiée à la vente en ligne de produits de mode et lifestyle. L'application comprendra un catalogue produits dynamique, un système de panier et de paiement en ligne (Stripe), un espace compte client personnalisé, un module de gestion des commandes et un back-office administrateur. L'ensemble sera développé selon la méthodologie agile SCRUM en 4 sprints.",
  pr_tech: 'React.js, Node.js, PostgreSQL, Stripe API, Docker',
  fi_ht: '12000',
  fi_tva: '19',
  fi_devise: 'TND',
  fi_mode: 'Virement bancaire',
  cl_garantie: '3',
  cl_delai: '48',
  cl_maintenance: "Correction des anomalies bloquantes signalées par le client dans le délai convenu. Les modifications fonctionnelles feront l'objet d'un avenant tarifé séparément.",
  cl_pi: 'full',
  cl_pi_detail: "L'intégralité des droits de propriété intellectuelle sur les livrables est transférée au client à complet paiement du montant contractuel.",
  cl_preavis: '15',
  cl_penalite: '1',
  cl_juridiction: 'Tribunal de Commerce de Tunis',
  cl_extra: '',
};

const DEFAULT_LIVRABLES = [
  { nom: 'Sprint 1', periode: '19 mai → 6 juin 2025', desc: "Authentification, gestion des comptes clients et back-office administrateur" },
  { nom: 'Sprint 2', periode: '9 juin → 27 juin 2025', desc: "Catalogue produits, filtres, pages produit et galerie d'images" },
  { nom: 'Sprint 3', periode: '30 juin → 18 juil. 2025', desc: "Panier d'achat, tunnel de commande, intégration paiement Stripe" },
  { nom: 'Sprint 4', periode: '21 juil. → 8 août 2025', desc: 'Espace client, notifications e-mail, tableau de bord' },
  { nom: 'Livraison finale', periode: '19 août 2025', desc: 'Déploiement production, tests finaux, documentation et formation' },
];

const DEFAULT_ECHEANCES = [
  { label: 'À la signature du contrat', pct: 30 },
  { label: 'Livraison Sprint 2', pct: 30 },
  { label: 'Livraison Sprint 4', pct: 25 },
  { label: 'Recette finale', pct: 15 },
];

function formatDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ─── Shared field wrapper ────────────────────────────────────────────────────
function Field({ label, required, hint, full, children }) {
  return (
    <div className={`cg-field${full ? ' cg-full' : ''}`}>
      {label && (
        <label className="cg-label">
          {label}{required && <span className="cg-req"> *</span>}
        </label>
      )}
      {children}
      {hint && <div className="cg-hint">{hint}</div>}
    </div>
  );
}

// ─── Step 1: Prestataire ─────────────────────────────────────────────────────
function StepPrestataire({ form, set }) {
  return (
    <>
      <div className="cg-section-hdr">
        <div className="cg-section-title">Votre entreprise</div>
        <div className="cg-section-desc">Ces informations apparaîtront en en-tête du contrat en tant que prestataire.</div>
      </div>
      <div className="cg-card">
        <div className="cg-card-title"><span className="cg-dot cg-dot--accent" />Identité de la société</div>
        <div className="cg-grid-2">
          <Field label="Nom de la société" required>
            <input className="cg-input" value={form.p_company} onChange={e => set('p_company', e.target.value)} placeholder="ProFlow Dev SARL" />
          </Field>
          <Field label="Registre de commerce">
            <input className="cg-input" value={form.p_rc} onChange={e => set('p_rc', e.target.value)} placeholder="RC B123456789" />
          </Field>
          <Field label="Adresse complète" required full>
            <input className="cg-input" value={form.p_address} onChange={e => set('p_address', e.target.value)} placeholder="12 Rue des Développeurs, 1002 Tunis" />
          </Field>
          <Field label="Téléphone">
            <input className="cg-input" value={form.p_tel} onChange={e => set('p_tel', e.target.value)} placeholder="+216 71 000 000" />
          </Field>
          <Field label="E-mail" required>
            <input className="cg-input" type="email" value={form.p_email} onChange={e => set('p_email', e.target.value)} placeholder="contact@proflow.tn" />
          </Field>
          <Field label="Site web">
            <input className="cg-input" value={form.p_web} onChange={e => set('p_web', e.target.value)} placeholder="www.proflow.tn" />
          </Field>
          <Field label="Représentant légal" required>
            <input className="cg-input" value={form.p_rep} onChange={e => set('p_rep', e.target.value)} placeholder="Prénom NOM, Gérant" />
          </Field>
        </div>
      </div>
    </>
  );
}

// ─── Step 2: Client ──────────────────────────────────────────────────────────
function StepClient({ form, set }) {
  return (
    <>
      <div className="cg-section-hdr">
        <div className="cg-section-title">Informations du client</div>
        <div className="cg-section-desc">Coordonnées complètes du client commanditaire du projet.</div>
      </div>
      <div className="cg-card">
        <div className="cg-card-title"><span className="cg-dot cg-dot--teal" />Identité du client</div>
        <div className="cg-grid-2">
          <Field label="Nom & Prénom" required>
            <input className="cg-input" value={form.c_name} onChange={e => set('c_name', e.target.value)} placeholder="Yassine Belkaid" />
          </Field>
          <Field label="Société / Organisation">
            <input className="cg-input" value={form.c_company} onChange={e => set('c_company', e.target.value)} placeholder="TechStart SARL" />
          </Field>
          <Field label="Adresse complète" required full>
            <input className="cg-input" value={form.c_address} onChange={e => set('c_address', e.target.value)} placeholder="45 Avenue de la République, 4000 Sousse" />
          </Field>
          <Field label="Téléphone">
            <input className="cg-input" value={form.c_tel} onChange={e => set('c_tel', e.target.value)} placeholder="+216 55 123 456" />
          </Field>
          <Field label="E-mail" required>
            <input className="cg-input" type="email" value={form.c_email} onChange={e => set('c_email', e.target.value)} placeholder="client@societe.tn" />
          </Field>
          <Field label="Qualité / Fonction">
            <input className="cg-input" value={form.c_role} onChange={e => set('c_role', e.target.value)} placeholder="Directeur Général" />
          </Field>
          <Field label="Registre de commerce (facultatif)">
            <input className="cg-input" value={form.c_rc} onChange={e => set('c_rc', e.target.value)} placeholder="RC B987654321" />
          </Field>
        </div>
      </div>
    </>
  );
}

// ─── Step 3: Contrat ─────────────────────────────────────────────────────────
function StepContrat({ form, set }) {
  return (
    <>
      <div className="cg-section-hdr">
        <div className="cg-section-title">Références du contrat</div>
        <div className="cg-section-desc">Identifiants, dates et responsable du projet.</div>
      </div>
      <div className="cg-card">
        <div className="cg-card-title"><span className="cg-dot cg-dot--amber" />Informations contractuelles</div>
        <div className="cg-grid-2">
          <Field label="Référence du contrat" required>
            <input className="cg-input" value={form.ct_ref} onChange={e => set('ct_ref', e.target.value)} placeholder="CONTRAT-2025-001" />
          </Field>
          <Field label="Date de signature" required>
            <input className="cg-input" type="date" value={form.ct_date} onChange={e => set('ct_date', e.target.value)} />
          </Field>
          <Field label="Date de début du projet" required>
            <input className="cg-input" type="date" value={form.ct_start} onChange={e => set('ct_start', e.target.value)} />
          </Field>
          <Field label="Date de fin prévue" required>
            <input className="cg-input" type="date" value={form.ct_end} onChange={e => set('ct_end', e.target.value)} />
          </Field>
          <Field label="Chef de projet" required>
            <input className="cg-input" value={form.ct_pm} onChange={e => set('ct_pm', e.target.value)} placeholder="Prénom NOM" />
          </Field>
          <Field label="Lieu de signature">
            <input className="cg-input" value={form.ct_lieu} onChange={e => set('ct_lieu', e.target.value)} placeholder="Tunis" />
          </Field>
        </div>
      </div>
    </>
  );
}

// ─── Step 4: Projet & Livrables ──────────────────────────────────────────────
function StepProjet({ form, set, livrables, setLivrables }) {
  const add = () =>
    setLivrables(p => [...p, { nom: `Sprint ${p.length + 1}`, periode: '', desc: '' }]);
  const remove = i =>
    setLivrables(p => p.filter((_, idx) => idx !== i));
  const update = (i, key, val) =>
    setLivrables(p => p.map((l, idx) => idx === i ? { ...l, [key]: val } : l));

  return (
    <>
      <div className="cg-section-hdr">
        <div className="cg-section-title">Projet & Livrables</div>
        <div className="cg-section-desc">Décrivez le projet et détaillez les sprints / livrables attendus.</div>
      </div>
      <div className="cg-card">
        <div className="cg-card-title"><span className="cg-dot cg-dot--accent" />Description du projet</div>
        <Field label="Titre du projet" required>
          <input className="cg-input" value={form.pr_title} onChange={e => set('pr_title', e.target.value)} placeholder="Application E-commerce" />
        </Field>
        <Field label="Description détaillée" required>
          <textarea className="cg-input cg-textarea" value={form.pr_desc} onChange={e => set('pr_desc', e.target.value)} rows={5} placeholder="Décrivez les fonctionnalités, le périmètre technique, les technologies utilisées…" />
        </Field>
        <Field label="Technologies utilisées">
          <input className="cg-input" value={form.pr_tech} onChange={e => set('pr_tech', e.target.value)} placeholder="React.js, Node.js, PostgreSQL…" />
        </Field>
      </div>
      <div className="cg-card">
        <div className="cg-card-title"><span className="cg-dot cg-dot--teal" />Livrables & Sprints</div>
        {livrables.map((l, i) => (
          <div key={i} className="cg-dyn-row cg-dyn-row--3col">
            <Field label="Nom / Sprint">
              <input className="cg-input cg-input--sm" value={l.nom} onChange={e => update(i, 'nom', e.target.value)} />
            </Field>
            <Field label="Période">
              <input className="cg-input cg-input--sm" value={l.periode} onChange={e => update(i, 'periode', e.target.value)} />
            </Field>
            <Field label="Description du livrable" full>
              <input className="cg-input cg-input--sm" value={l.desc} onChange={e => update(i, 'desc', e.target.value)} />
            </Field>
            <button className="cg-dyn-del" onClick={() => remove(i)}>×</button>
          </div>
        ))}
        <button className="cg-add-row" onClick={add}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Ajouter un livrable / sprint
        </button>
      </div>
    </>
  );
}

// ─── Step 5: Finances ────────────────────────────────────────────────────────
function StepFinances({ form, set, echeances, setEcheances }) {
  const ht = parseFloat(form.fi_ht) || 0;
  const tva = parseFloat(form.fi_tva) || 0;
  const ttc = ht * (1 + tva / 100);
  const dev = form.fi_devise;
  const totalPct = echeances.reduce((s, e) => s + (e.pct || 0), 0);

  const add = () => setEcheances(p => [...p, { label: 'Nouvelle échéance', pct: 0 }]);
  const remove = i => setEcheances(p => p.filter((_, idx) => idx !== i));
  const update = (i, key, val) =>
    setEcheances(p => p.map((e, idx) => idx === i ? { ...e, [key]: val } : e));

  return (
    <>
      <div className="cg-section-hdr">
        <div className="cg-section-title">Conditions financières</div>
        <div className="cg-section-desc">Montant du contrat, TVA et calendrier des paiements.</div>
      </div>
      <div className="cg-card">
        <div className="cg-card-title"><span className="cg-dot cg-dot--amber" />Montant global</div>
        <div className="cg-grid-3">
          <Field label="Montant HT" required hint={`en ${dev}`}>
            <input className="cg-input" type="number" value={form.fi_ht} onChange={e => set('fi_ht', e.target.value)} placeholder="12000" />
          </Field>
          <Field label="TVA (%)">
            <input className="cg-input" type="number" value={form.fi_tva} onChange={e => set('fi_tva', e.target.value)} placeholder="19" />
          </Field>
          <Field label="Montant TTC">
            <input className="cg-input cg-input--ro cg-input--accent" readOnly value={`${ttc.toFixed(3)} ${dev}`} />
          </Field>
        </div>
        <Field label="Devise">
          <select className="cg-input cg-select" value={form.fi_devise} onChange={e => set('fi_devise', e.target.value)}>
            <option value="TND">TND — Dinar Tunisien</option>
            <option value="EUR">EUR — Euro</option>
            <option value="USD">USD — Dollar américain</option>
            <option value="MAD">MAD — Dirham marocain</option>
            <option value="DZD">DZD — Dinar algérien</option>
          </select>
        </Field>
        <Field label="Mode de paiement">
          <select className="cg-input cg-select" value={form.fi_mode} onChange={e => set('fi_mode', e.target.value)}>
            <option>Virement bancaire</option>
            <option>Chèque</option>
            <option>Espèces</option>
            <option>Paiement en ligne</option>
          </select>
        </Field>
      </div>
      <div className="cg-card">
        <div className="cg-card-title"><span className="cg-dot cg-dot--teal" />Échéancier de paiement</div>
        {echeances.map((e, i) => (
          <div key={i} className="cg-dyn-row cg-dyn-row--ech">
            <Field label="Description de l'échéance">
              <input className="cg-input cg-input--sm" value={e.label} onChange={ev => update(i, 'label', ev.target.value)} />
            </Field>
            <Field label="Part (%)">
              <input className="cg-input cg-input--sm" type="number" min="0" max="100" value={e.pct}
                onChange={ev => update(i, 'pct', parseFloat(ev.target.value) || 0)}
                style={{ textAlign: 'center' }} />
            </Field>
            <Field label="Montant TTC">
              <input className="cg-input cg-input--sm cg-input--ro cg-input--teal" readOnly
                value={(ttc * e.pct / 100).toFixed(3)} style={{ textAlign: 'right' }} />
            </Field>
            <button className="cg-dyn-del" onClick={() => remove(i)}>×</button>
          </div>
        ))}
        <button className="cg-add-row" onClick={add}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Ajouter une échéance
        </button>
        <div className="cg-fin-summary">
          <div className="cg-fin-row"><span>Montant HT</span><span>{ht.toFixed(3)} {dev}</span></div>
          <div className="cg-fin-row"><span>TVA ({tva}%)</span><span>{(ht * tva / 100).toFixed(3)} {dev}</span></div>
          <div className="cg-fin-row cg-fin-total"><span>Montant TTC</span><span>{ttc.toFixed(3)} {dev}</span></div>
          <div className="cg-fin-status" style={{ color: totalPct === 100 ? 'var(--cg-teal)' : 'var(--cg-red)' }}>
            {totalPct === 100
              ? '✓ La somme des échéances est correcte (100%)'
              : `⚠ Somme des pourcentages : ${totalPct}% (doit être 100%)`}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Step 6: Clauses ─────────────────────────────────────────────────────────
function StepClauses({ form, set }) {
  return (
    <>
      <div className="cg-section-hdr">
        <div className="cg-section-title">Clauses & Conditions</div>
        <div className="cg-section-desc">Garantie, propriété intellectuelle et conditions générales.</div>
      </div>
      <div className="cg-card">
        <div className="cg-card-title"><span className="cg-dot" style={{ background: 'var(--cg-red)' }} />Garantie & Maintenance</div>
        <div className="cg-grid-2">
          <Field label="Durée de garantie (mois)" required>
            <input className="cg-input" type="number" value={form.cl_garantie} onChange={e => set('cl_garantie', e.target.value)} min="0" max="24" />
          </Field>
          <Field label="Délai de correction des bugs (heures ouvrées)">
            <input className="cg-input" type="number" value={form.cl_delai} onChange={e => set('cl_delai', e.target.value)} min="8" />
          </Field>
        </div>
        <Field label="Description de la maintenance">
          <textarea className="cg-input cg-textarea" value={form.cl_maintenance} onChange={e => set('cl_maintenance', e.target.value)} rows={3} />
        </Field>
      </div>
      <div className="cg-card">
        <div className="cg-card-title"><span className="cg-dot cg-dot--accent" />Propriété intellectuelle</div>
        <Field label="Clause de propriété">
          <select className="cg-input cg-select" value={form.cl_pi} onChange={e => set('cl_pi', e.target.value)}>
            <option value="full">Transfert total au client à réception du solde</option>
            <option value="license">Licence d'utilisation accordée au client</option>
            <option value="shared">Propriété partagée prestataire / client</option>
          </select>
        </Field>
        <Field label="Détail (facultatif)">
          <textarea className="cg-input cg-textarea" value={form.cl_pi_detail} onChange={e => set('cl_pi_detail', e.target.value)} rows={2} />
        </Field>
      </div>
      <div className="cg-card">
        <div className="cg-card-title"><span className="cg-dot cg-dot--amber" />Résiliation & Pénalités</div>
        <div className="cg-grid-2">
          <Field label="Préavis de résiliation (jours)">
            <input className="cg-input" type="number" value={form.cl_preavis} onChange={e => set('cl_preavis', e.target.value)} min="0" />
          </Field>
          <Field label="Pénalité de retard (%/semaine)">
            <input className="cg-input" type="number" value={form.cl_penalite} onChange={e => set('cl_penalite', e.target.value)} min="0" step="0.5" />
          </Field>
        </div>
        <Field label="Juridiction compétente">
          <input className="cg-input" value={form.cl_juridiction} onChange={e => set('cl_juridiction', e.target.value)} />
        </Field>
        <Field label="Clauses supplémentaires (facultatif)">
          <textarea className="cg-input cg-textarea" value={form.cl_extra} onChange={e => set('cl_extra', e.target.value)} rows={3} placeholder="Ajoutez toute clause spécifique à ce contrat…" />
        </Field>
      </div>
    </>
  );
}

// ─── Step 7: Récapitulatif ───────────────────────────────────────────────────
function StepRecap({ form, livrables, echeances, onGenerate }) {
  const ht = parseFloat(form.fi_ht) || 0;
  const tva = parseFloat(form.fi_tva) || 0;
  const ttc = ht * (1 + tva / 100);

  const prestataire = [
    ['Société', form.p_company], ['Représentant', form.p_rep],
    ['Adresse', form.p_address], ['E-mail', form.p_email], ['RC', form.p_rc],
  ];
  const client = [
    ['Nom', form.c_name], ['Société', form.c_company],
    ['Adresse', form.c_address], ['E-mail', form.c_email], ['Fonction', form.c_role],
  ];
  const contrat = [
    ['Référence', form.ct_ref], ['Date', formatDate(form.ct_date)],
    ['Début', formatDate(form.ct_start)], ['Fin prévue', formatDate(form.ct_end)],
    ['Chef de projet', form.ct_pm],
  ];
  const finances = [
    ['Montant HT', `${ht.toFixed(3)} ${form.fi_devise}`],
    ['TVA', `${tva}%`],
    ['Montant TTC', `${ttc.toFixed(3)} ${form.fi_devise}`],
    ['Mode paiement', form.fi_mode],
    ['Échéances', `${echeances.length} paiements`],
  ];
  const projet = [
    ['Titre', form.pr_title], ['Technologies', form.pr_tech],
    ['Livrables', `${livrables.length} sprint(s) défini(s)`],
    ['Garantie', `${form.cl_garantie} mois — délai correction ${form.cl_delai}h ouvrées`],
  ];

  const Block = ({ title, rows, full }) => (
    <div className={`cg-review-block${full ? ' cg-review-full' : ''}`}>
      <div className="cg-rb-title">{title}</div>
      {rows.map(([k, v], i) => (
        <div key={k} className="cg-rb-row">
          <span className="cg-rb-key">{k}</span>
          <span className="cg-rb-val" style={title === 'Finances' && i === 2 ? { color: 'var(--cg-accent)', fontWeight: 700 } : {}}>
            {v || '—'}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="cg-section-hdr">
        <div className="cg-section-title">Récapitulatif & Génération</div>
        <div className="cg-section-desc">Vérifiez les informations avant de générer le contrat PDF.</div>
      </div>


      <div className="cg-review-grid">
        <Block title="Prestataire" rows={prestataire} />
        <Block title="Client" rows={client} />
        <Block title="Contrat" rows={contrat} />
        <Block title="Finances" rows={finances} />
        <Block title="Projet" rows={projet} full />
      </div>
    </>
  );
}

// ─── PDF Builder ─────────────────────────────────────────────────────────────
function buildPDF(form, livrables, echeances) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297, ML = 18, MR = 18, MT = 18, CW = W - ML - MR;

  const NAVY = [11, 17, 32];
  const ACCENT = [26, 63, 255];
  const TEAL = [0, 158, 126];
  const INK2 = [46, 58, 92];
  const INK3 = [107, 116, 152];
  const INK4 = [168, 174, 202];
  const BG = [245, 246, 251];
  const BORDER = [221, 225, 240];
  const WHITE = [255, 255, 255];

  const ht = parseFloat(form.fi_ht) || 0;
  const tva = parseFloat(form.fi_tva) || 0;
  const ttc = ht * (1 + tva / 100);
  const devise = form.fi_devise;

  let pageNum = 1;

  const fill = (x, y, w, h, rgb) => { doc.setFillColor(...rgb); doc.rect(x, y, w, h, 'F'); };
  const seg = (x1, y1, x2, y2, rgb, lw = 0.3) => {
    doc.setDrawColor(...rgb); doc.setLineWidth(lw); doc.line(x1, y1, x2, y2);
  };
  const t = (s, x, y, opts = {}) => doc.text(String(s ?? ''), x, y, opts);
  const sf = (style, size, color) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    if (color) doc.setTextColor(...color);
  };

  const banner = (label, y) => {
    fill(ML, y, CW, 6.5, ACCENT);
    sf('bold', 8.5, WHITE);
    t(label.toUpperCase(), ML + 3, y + 4.3);
    return y + 9.5;
  };

  const infoLine = (label, val, x, y, colW) => {
    sf('bold', 7.5, INK3); t(label, x, y);
    sf('normal', 7.5, INK2);
    const lines = doc.splitTextToSize(String(val || '—'), colW - 28);
    t(lines, x + 28, y);
    return y + lines.length * 4 + 1;
  };

  const footer = () => {
    const fy = H - 10;
    fill(0, fy - 2, W, 12, NAVY);
    sf('normal', 7, INK4);
    t(form.ct_ref + ' — ' + form.p_company, ML, fy + 3.5);
    t('Page ' + pageNum, W - MR, fy + 3.5, { align: 'right' });
    sf('normal', 7, [200, 206, 230]);
    t('Confidentiel', W / 2, fy + 3.5, { align: 'center' });
  };

  const newPage = () => { doc.addPage(); pageNum++; footer(); };

  // ═══ PAGE 1 ═══════════════════════════════════════════════════
  fill(0, 0, W, 42, NAVY);
  sf('bold', 22, WHITE); t('ProFlow', ML, 18);
  sf('normal', 8, INK4); t('Plateforme de développement & gestion de projets', ML, 24);
  fill(ML, 27, 28, 1.5, ACCENT);
  sf('bold', 16, WHITE);
  t('CONTRAT DE', W - MR, 16, { align: 'right' });
  t('DÉVELOPPEMENT', W - MR, 25, { align: 'right' });
  sf('normal', 8, INK4); t('LOGICIEL SUR MESURE', W - MR, 31, { align: 'right' });
  sf('bold', 7.5, TEAL); t('Réf : ' + form.ct_ref, ML + 2, 39);
  sf('normal', 7.5, INK4);
  t('Signé le : ' + formatDate(form.ct_date), ML + 52, 39);
  t('Lieu : ' + form.ct_lieu, ML + 110, 39);

  let y = 50;
  const colW = (CW - 6) / 2;

  // Prestataire block
  fill(ML, y, colW, 7, ACCENT);
  sf('bold', 8.5, WHITE); t('LE PRESTATAIRE', ML + 3, y + 4.5);
  fill(ML, y + 7, colW, 38, BG);
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.3); doc.rect(ML, y, colW, 45);
  let py = y + 12;
  py = infoLine('Société', form.p_company, ML + 3, py, colW);
  py = infoLine('Représentant', form.p_rep, ML + 3, py, colW);
  py = infoLine('Adresse', form.p_address, ML + 3, py, colW);
  py = infoLine('Téléphone', form.p_tel, ML + 3, py, colW);
  py = infoLine('E-mail', form.p_email, ML + 3, py, colW);
  infoLine('RC', form.p_rc, ML + 3, py, colW);

  // Client block
  const cx = ML + colW + 6;
  fill(cx, y, colW, 7, TEAL);
  sf('bold', 8.5, WHITE); t('LE CLIENT', cx + 3, y + 4.5);
  fill(cx, y + 7, colW, 38, BG);
  doc.rect(cx, y, colW, 45);
  py = y + 12;
  py = infoLine('Nom', form.c_name, cx + 3, py, colW);
  py = infoLine('Fonction', form.c_role, cx + 3, py, colW);
  py = infoLine('Société', form.c_company, cx + 3, py, colW);
  py = infoLine('Adresse', form.c_address, cx + 3, py, colW);
  py = infoLine('Téléphone', form.c_tel, cx + 3, py, colW);
  infoLine('E-mail', form.c_email, cx + 3, py, colW);
  y += 50;

  // Contract details strip
  y = banner('Détails du contrat', y);
  fill(ML, y, CW, 18, BG);
  doc.rect(ML, y, CW, 18, 'S');
  const third = CW / 3;
  [['Chef de projet', form.ct_pm], ['Date de début', formatDate(form.ct_start)], ['Date de fin prévue', formatDate(form.ct_end)]].forEach(([lbl, val], i) => {
    const bx = ML + i * third;
    sf('bold', 7, INK3); t(lbl, bx + 4, y + 5.5);
    sf('bold', 9, INK2); t(val, bx + 4, y + 12);
    if (i < 2) seg(bx + third, y + 2, bx + third, y + 16, BORDER);
  });
  y += 22;

  // Project description
  y = banner('Objet du contrat', y);
  sf('bold', 10, NAVY);
  const titleLines = doc.splitTextToSize(form.pr_title, CW);
  t(titleLines, ML, y); y += titleLines.length * 5 + 2;

  if (form.pr_tech) {
    fill(ML, y, CW, 6, [230, 236, 255]);
    sf('bold', 7, ACCENT); t('TECHNOLOGIES :', ML + 3, y + 4);
    sf('normal', 7, INK2); t(form.pr_tech, ML + 33, y + 4);
    y += 9;
  }
  sf('normal', 8.5, INK2);
  const descLines = doc.splitTextToSize(form.pr_desc, CW);
  t(descLines, ML, y);
  y += descLines.length * 4.2 + 4;
  footer();

  // ═══ PAGE 2 ═══════════════════════════════════════════════════
  newPage(); y = MT;

  // Livrables table
  y = banner('Livrables & Planning des sprints', y);
  autoTable(doc, {
    head: [['#', 'Livrable / Sprint', 'Période', 'Description']],
    body: livrables.map((l, i) => [`${i + 1}`, l.nom || '—', l.periode || '—', l.desc || '—']),
    startY: y,
    margin: { left: ML, right: MR },
    styles: { font: 'helvetica', fontSize: 8, textColor: INK2, cellPadding: 3 },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: BG },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 32, fontStyle: 'bold', textColor: NAVY },
      2: { cellWidth: 38 },
      3: { cellWidth: CW - 8 - 32 - 38 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === livrables.length - 1) {
        data.cell.styles.fillColor = [230, 244, 240];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = TEAL;
      }
    },
  });
  y = doc.lastAutoTable.finalY + 8;

  // Financial conditions
  y = banner('Conditions financières', y);
  autoTable(doc, {
    head: [['Description', 'Montant']],
    body: [
      ['Montant hors taxes (HT)', `${ht.toFixed(3)} ${devise}`],
      [`TVA (${tva}%)`, `${(ht * tva / 100).toFixed(3)} ${devise}`],
      ['Montant toutes taxes comprises (TTC)', `${ttc.toFixed(3)} ${devise}`],
    ],
    startY: y,
    margin: { left: ML, right: MR },
    styles: { font: 'helvetica', fontSize: 8.5, textColor: INK2, cellPadding: 3.5 },
    headStyles: { fillColor: INK2, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === 2) {
        data.cell.styles.fillColor = ACCENT;
        data.cell.styles.textColor = WHITE;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 9;
      }
    },
  });
  y = doc.lastAutoTable.finalY + 6;

  // Payment mode pill
  fill(ML, y, CW, 7, BG);
  doc.rect(ML, y, CW, 7, 'S');
  sf('bold', 7.5, INK3); t('MODE DE PAIEMENT :', ML + 4, y + 4.5);
  sf('bold', 8.5, INK2); t(form.fi_mode, ML + 44, y + 4.5);
  y += 10;

  // Payment schedule table
  y = banner('Échéancier de paiement', y);
  autoTable(doc, {
    head: [['Échéance', 'Part (%)', `Montant TTC (${devise})`]],
    body: echeances.map(e => [e.label, `${e.pct}%`, (ttc * e.pct / 100).toFixed(3)]),
    startY: y,
    margin: { left: ML, right: MR },
    styles: { font: 'helvetica', fontSize: 8.5, textColor: INK2, cellPadding: 3.5 },
    headStyles: { fillColor: TEAL, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: BG },
    columnStyles: {
      1: { halign: 'center', fontStyle: 'bold' },
      2: { halign: 'right', fontStyle: 'bold', textColor: TEAL },
    },
  });

  // ═══ PAGE 3 ═══════════════════════════════════════════════════
  newPage(); y = MT;

  // Garantie & Maintenance
  y = banner('Garantie & Maintenance', y);
  fill(ML, y, CW, 7, BG);
  doc.rect(ML, y, CW, 7, 'S');
  sf('bold', 7.5, INK3); t('DURÉE DE GARANTIE :', ML + 4, y + 4.5);
  sf('bold', 9, INK2); t(`${form.cl_garantie} mois`, ML + 44, y + 4.5);
  sf('bold', 7.5, INK3); t('DÉLAI CORRECTION :', ML + 90, y + 4.5);
  sf('bold', 9, INK2); t(`${form.cl_delai}h ouvrées`, ML + 128, y + 4.5);
  y += 10;
  sf('normal', 8.5, INK2);
  const maintLines = doc.splitTextToSize(form.cl_maintenance, CW);
  t(maintLines, ML, y);
  y += maintLines.length * 4.5 + 8;

  // Propriété intellectuelle
  y = banner('Propriété intellectuelle', y);
  const piLabel = { full: 'Transfert total au client à réception du solde', license: "Licence d'utilisation accordée au client", shared: 'Propriété partagée prestataire / client' }[form.cl_pi] || form.cl_pi;
  fill(ML, y, CW, 6, [230, 236, 255]);
  sf('bold', 8, ACCENT); t(piLabel, ML + 4, y + 4);
  y += 9;
  if (form.cl_pi_detail) {
    sf('normal', 8.5, INK2);
    const piLines = doc.splitTextToSize(form.cl_pi_detail, CW);
    t(piLines, ML, y);
    y += piLines.length * 4.5 + 8;
  }

  // Résiliation & Pénalités
  y = banner('Résiliation & Pénalités', y);
  fill(ML, y, CW, 7, BG);
  doc.rect(ML, y, CW, 7, 'S');
  sf('bold', 7.5, INK3); t('PRÉAVIS :', ML + 4, y + 4.5);
  sf('bold', 9, INK2); t(`${form.cl_preavis} jours`, ML + 24, y + 4.5);
  sf('bold', 7.5, INK3); t('PÉNALITÉ DE RETARD :', ML + 70, y + 4.5);
  sf('bold', 9, INK2); t(`${form.cl_penalite}%/semaine`, ML + 112, y + 4.5);
  y += 10;
  sf('bold', 7.5, INK3); t('JURIDICTION COMPÉTENTE :', ML, y);
  sf('normal', 8.5, INK2); t(form.cl_juridiction, ML + 52, y);
  y += 8;

  if (form.cl_extra) {
    y = banner('Clauses supplémentaires', y);
    sf('normal', 8.5, INK2);
    const extraLines = doc.splitTextToSize(form.cl_extra, CW);
    t(extraLines, ML, y);
    y += extraLines.length * 4.5 + 8;
  }

  // Signatures block
  if (y > H - 80) { newPage(); y = MT; } else { y += 10; }
  y = banner('Signatures', y);

  const sigW = (CW - 6) / 2;
  // Prestataire
  fill(ML, y, sigW, 6, INK2);
  sf('bold', 8.5, WHITE); t('LE PRESTATAIRE', ML + 3, y + 4);
  fill(ML, y + 6, sigW, 44, BG);
  doc.rect(ML, y, sigW, 50);
  sf('normal', 7.5, INK3);
  t('Nom & Prénom : ' + form.p_rep, ML + 4, y + 14);
  t('Société : ' + form.p_company, ML + 4, y + 21);
  t('Date : ' + formatDate(form.ct_date), ML + 4, y + 28);
  sf('normal', 7, INK4); t('Signature :', ML + 4, y + 35);
  seg(ML + 24, y + 45, ML + sigW - 4, y + 45, BORDER, 0.5);

  // Client
  const sx = ML + sigW + 6;
  fill(sx, y, sigW, 6, TEAL);
  sf('bold', 8.5, WHITE); t('LE CLIENT', sx + 3, y + 4);
  fill(sx, y + 6, sigW, 44, BG);
  doc.rect(sx, y, sigW, 50);
  sf('normal', 7.5, INK3);
  t('Nom & Prénom : ' + form.c_name, sx + 4, y + 14);
  t('Société : ' + form.c_company, sx + 4, y + 21);
  t('Date : ' + formatDate(form.ct_date), sx + 4, y + 28);
  sf('normal', 7, INK4); t('Signature :', sx + 4, y + 35);
  seg(sx + 24, y + 45, sx + sigW - 4, y + 45, BORDER, 0.5);
  y += 55;

  sf('normal', 7, INK4);
  const note = doc.splitTextToSize(
    `Le présent contrat est établi en deux exemplaires originaux, dont un remis à chacune des parties. Tout litige sera soumis à la compétence exclusive du ${form.cl_juridiction || 'tribunal compétent'}.`,
    CW
  );
  t(note, ML, y);

  return doc;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ContratGenerator() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setFormState] = useState(DEFAULT_FORM);
  const [livrables, setLivrables] = useState(DEFAULT_LIVRABLES);
  const [echeances, setEcheances] = useState(DEFAULT_ECHEANCES);
  const [toast, setToast] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);

  const set = useCallback((k, v) => setFormState(f => ({ ...f, [k]: v })), []);

  const showToast = (msg, type = '') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const resetForm = () => {
    setFormState(DEFAULT_FORM);
    setLivrables(DEFAULT_LIVRABLES);
    setEcheances(DEFAULT_ECHEANCES);
    setStep(0);
    showToast('Formulaire réinitialisé');
  };

  const handleGenerate = () => {
    try {
      const doc = buildPDF(form, livrables, echeances);
      doc.save(`${form.ct_ref || 'contrat'}.pdf`);
      showToast('PDF généré avec succès !', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la génération du PDF', 'error');
    }
  };

  const goTo = n => setStep(n);
  const prev = () => setStep(s => Math.max(0, s - 1));
  const next = () => setStep(s => Math.min(TOTAL_STEPS - 1, s + 1));
  const isLast = step === TOTAL_STEPS - 1;

  return (
    <div id="app" className="cg-shell">
      <Sidebar chefSection="chef-contracts" />
      <div className="main-with-sidebar">
        {/* ── Main ── */}
        <div className="cg-main">
          {/* ── Horizontal Stepper ── */}
          <div className="cg-stepper-horiz">
            <div className="cg-stepper-inner">
              {STEPS.map((s, i) => (
                <React.Fragment key={i}>
                  <button
                    className={`cg-step-h-item${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}
                    onClick={() => goTo(i)}
                  >
                    <div className="cg-step-h-num">{i < step ? '✓' : i + 1}</div>
                    <div className="cg-step-h-content">
                      <div className="cg-step-h-label">{s.label}</div>
                      <div className="cg-step-h-sub">{s.sub}</div>
                    </div>
                  </button>
                  {i < TOTAL_STEPS - 1 && <div className={`cg-step-h-line${i < step ? ' done' : ''}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="cg-content">
            {step === 0 && <StepPrestataire form={form} set={set} />}
            {step === 1 && <StepClient form={form} set={set} />}
            {step === 2 && <StepContrat form={form} set={set} />}
            {step === 3 && <StepProjet form={form} set={set} livrables={livrables} setLivrables={setLivrables} />}
            {step === 4 && <StepFinances form={form} set={set} echeances={echeances} setEcheances={setEcheances} />}
            {step === 5 && <StepClauses form={form} set={set} />}
            {step === 6 && <StepRecap form={form} livrables={livrables} echeances={echeances} onGenerate={handleGenerate} />}
          </div>

          <div className="cg-nav-btns">
            <button className="cg-btn cg-btn-ghost" onClick={prev} disabled={step === 0}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              Précédent
            </button>
            <span className="cg-step-indicator">Étape {step + 1} / {TOTAL_STEPS}</span>
            {isLast ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="cg-btn cg-btn-teal" onClick={handleGenerate}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Générer PDF
                </button>
                <button className="cg-btn cg-btn-primary" onClick={() => setShowSendModal(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 2 15 22 11 13 2 9 22 2" /><line x1="22" y1="2" x2="11" y2="13" /></svg>
                  Envoyer au client
                </button>
              </div>
            ) : (
              <button className="cg-btn cg-btn-primary" onClick={next}>
                Suivant
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {showSendModal && (
        <SendContractModal
          onClose={() => setShowSendModal(false)}
          form={form}
          showToast={showToast}
        />
      )}

      {toast && (
        <div className={`cg-toast show${toast.type ? ' ' + toast.type : ''}`}>
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'} {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Modal d'envoi au client ──────────────────────────────────────────────────
function SendContractModal({ onClose, form, showToast }) {
  const { user, login } = useContext(AuthContext);
  const [password, setPassword] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [allClients, setAllClients] = useState([]);
  const [selectedClientEmail, setSelectedClientEmail] = useState(form.c_email || '');
  
  const [allProjects, setAllProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [fetchingData, setFetchingData] = useState(true);

  // Charger les clients et les projets
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, tasksRes] = await Promise.all([
          axios.get('http://localhost:5000/api/auth/users?role=client'),
          axios.get('http://localhost:5000/api/tasks')
        ]);
        
        setAllClients(usersRes.data);
        setAllProjects(tasksRes.data);
        
        // Si le client du formulaire n'est pas dans la liste des clients, on l'ajoute temporairement ou on force le choix
        const clientExists = usersRes.data.some(c => c.email.toLowerCase() === form.c_email?.toLowerCase());
        if (!clientExists && form.c_email) {
          // Optionnel: on pourrait ajouter un avertissement
        }

        // Auto-sélection du projet si un seul projet trouvé pour cet email
        const clientProjects = tasksRes.data.filter(t => 
          t.clientEmail?.toLowerCase() === form.c_email?.toLowerCase() ||
          t.createdBy?.email?.toLowerCase() === form.c_email?.toLowerCase()
        );
        
        if (clientProjects.length > 0) {
          setSelectedProjectId(clientProjects[0]._id);
        } else {
          setShowAll(true);
        }
      } catch (err) {
        console.error('Erreur chargement données:', err);
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, [form.c_email]);

  // Filtrage des projets en fonction du client sélectionné
  const filteredProjects = allProjects.filter(p => {
    const pEmail = (p.clientEmail || '').trim().toLowerCase();
    const cEmail = (selectedClientEmail || '').trim().toLowerCase();
    
    const matchesSearch = p.title?.toLowerCase().includes(search.toLowerCase());
    
    if (showAll) return matchesSearch;
    
    // On compare l'email du projet avec l'email du client sélectionné
    const matchesClient = pEmail === cEmail;
    
    return matchesClient && matchesSearch;
  });

  console.log('Projets filtrés:', filteredProjects.length, 'pour le client:', selectedClientEmail);

  // Auto-sélection si un seul projet est trouvé après filtrage
  useEffect(() => {
    if (filteredProjects.length > 0 && !selectedProjectId) {
      // On vérifie si l'id actuel est toujours dans la liste filtrée
      const stillExists = filteredProjects.some(p => p._id === selectedProjectId);
      if (!stillExists) {
        setSelectedProjectId(filteredProjects[0]._id);
      }
    }
  }, [filteredProjects, selectedProjectId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return setError('Veuillez sélectionner un projet pour ce client.');
    if (!file) return setError('Veuillez sélectionner le fichier PDF généré.');
    if (!password) return setError('Veuillez entrer votre mot de passe pour confirmer.');

    setLoading(true);
    setError('');

    try {
      console.log('Validation pour:', user?.email);
      const isAuth = await login(user?.email, password);
      if (!isAuth) {
        setLoading(false);
        return setError('Mot de passe incorrect. Action annulée.');
      }

      const fd = new FormData();
      fd.append('pdf', file); // 'pdf' pour match contractRoute.js
      fd.append('ref', form.ct_ref);
      fd.append('title', `Contrat: ${form.c_name}`);
      fd.append('clientEmail', selectedClientEmail);
      fd.append('clientName', allClients.find(c => c.email === selectedClientEmail)?.name || form.c_name);
      
      // On envoie via l'API dédiée aux contrats pour le suivi
      await axios.post('http://localhost:5000/api/contracts/send', fd);

      // On garde aussi l'upload sur la tâche pour l'historique projet
      const fdTask = new FormData();
      fdTask.append('files', file);
      await axios.post(`http://localhost:5000/api/tasks/${selectedProjectId}/upload/chef`, fdTask);

      showToast('Le contrat a été envoyé et rattaché au projet avec succès !', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      setError('Une erreur est survenue lors de l\'envoi du fichier.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay open" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>🚀 Envoyer au client</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
        </div>

        <form onSubmit={handleSend}>

          {/* Sélection du Client */}
          <div className="cg-field cg-full" style={{ marginBottom: 16 }}>
            <label className="cg-label">Client destinataire</label>
            {fetchingData ? (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Chargement des clients...</div>
            ) : (
              <select 
                className="field-select" 
                value={selectedClientEmail} 
                onChange={e => {
                  setSelectedClientEmail(e.target.value);
                  setSelectedProjectId(''); // Reset project choice
                }}
                required
              >
                <option value="">Sélectionner un client</option>
                {allClients.map(c => (
                  <option key={c._id} value={c.email}>{c.name} ({c.email})</option>
                ))}
                {!allClients.some(c => c.email.toLowerCase() === form.c_email?.toLowerCase()) && form.c_email && (
                  <option value={form.c_email}>{form.c_name} ({form.c_email})</option>
                )}
              </select>
            )}
          </div>

          {/* Sélection du Projet */}
          <div className="cg-field cg-full" style={{ marginBottom: 16 }}>
            <label className="cg-label">Associer au projet de ce client</label>
            {fetchingData ? (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Recherche des projets...</div>
            ) : (
              <>
                {filteredProjects.length === 0 ? (
                  <div style={{ color: 'var(--danger)', fontSize: 12, padding: '10px', background: '#fee2e2', borderRadius: 8 }}>
                    ⚠ Aucun projet trouvé pour ce client dans l'application.
                  </div>
                ) : (
                  <select 
                    className="field-select" 
                    value={selectedProjectId} 
                    onChange={e => setSelectedProjectId(e.target.value)}
                    required
                    style={{ fontSize: 13 }}
                  >
                    <option value="" disabled>Choisir le projet...</option>
                    {filteredProjects.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}
          </div>

          <div className="cg-field cg-full" style={{ marginBottom: 16 }}>
            <label className="cg-label">Fichier PDF du contrat</label>
            <input
              type="file"
              accept=".pdf"
              className="field-input"
              onChange={e => setFile(e.target.files[0])}
              style={{ padding: '8px', fontSize: 12 }}
              required
            />
          </div>

          <div className="cg-field cg-full" style={{ marginBottom: 20 }}>
            <label className="cg-label">Confirmer avec votre mot de passe</label>
            <input
              type="password"
              className="field-input"
              placeholder="Entrez votre mot de passe de chef"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 16, padding: 8, background: '#fee2e2', borderRadius: 6 }}>
              ⚠ {error}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>Annuler</button>
            <button type="submit" className="btn-confirm" disabled={loading || !selectedProjectId} style={{ background: 'var(--accent)', color: '#fff' }}>
              {loading ? 'Envoi en cours...' : 'Confirmer & Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
