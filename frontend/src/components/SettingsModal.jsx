import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const TABS = [
  { id: 'account',    icon: '👤', label: 'Mon Compte'    },
  { id: 'password',   icon: '🔒', label: 'Mot de passe'  },
  { id: 'prefs',      icon: '⚙️',  label: 'Préférences'  },
];

const ROLE_LABELS = {
  client:    { label: 'Client',         color: '#f59e0b' },
  chef:      { label: 'Chef de Projet', color: '#6366f1' },
  designer:  { label: 'Designer',       color: '#ec4899' },
  developer: { label: 'Développeur',    color: '#10b981' },
};

const initPrefs = () => {
  try { return JSON.parse(localStorage.getItem('proflow_prefs')) || {}; }
  catch { return {}; }
};

export default function SettingsModal({ onClose }) {
  const { user, logout } = useContext(AuthContext);
  const [tab, setTab]           = useState('account');

  // password tab
  const [pwForm, setPwForm]     = useState({ current: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg]       = useState(null); // { type: 'ok'|'err', text }

  // prefs tab
  const [prefs, setPrefs]       = useState(initPrefs);

  const roleInfo = ROLE_LABELS[user?.role] || ROLE_LABELS.client;

  /* ── change password ── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ type: 'err', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    try {
      await axios.put('http://localhost:5000/api/auth/password', {
        currentPassword: pwForm.current,
        newPassword:     pwForm.next,
      });
      setPwMsg({ type: 'ok', text: 'Mot de passe modifié avec succès !' });
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwMsg({ type: 'err', text: err.response?.data?.message || 'Erreur serveur.' });
    } finally {
      setPwLoading(false);
    }
  };

  /* ── prefs ── */
  const togglePref = (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem('proflow_prefs', JSON.stringify(next));
  };

  /* ── styles ── */
  const s = {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
      zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    modal: {
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
      width: 480, maxWidth: '95vw', maxHeight: '90vh', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.4)',
    },
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 24px 0', borderBottom: '1px solid var(--border)', paddingBottom: 0,
    },
    title: { fontSize: 18, fontWeight: 700, color: 'var(--text)' },
    closeBtn: {
      background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20,
      cursor: 'pointer', lineHeight: 1, padding: 4,
    },
    tabs: {
      display: 'flex', gap: 0, padding: '0 24px', borderBottom: '1px solid var(--border)',
    },
    tabBtn: (active) => ({
      background: 'none', border: 'none', borderBottom: active ? '2px solid var(--accent-chef)' : '2px solid transparent',
      color: active ? 'var(--accent-chef)' : 'var(--muted)', cursor: 'pointer',
      padding: '12px 16px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
      display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s',
    }),
    body: { padding: 24, overflowY: 'auto', flex: 1 },
    label: { fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '.04em' },
    input: {
      width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14,
      fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    },
    infoRow: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0', borderBottom: '1px solid var(--border)',
    },
    infoLabel: { fontSize: 13, color: 'var(--muted)' },
    infoValue: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
    toggleRow: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 0', borderBottom: '1px solid var(--border)',
    },
    toggleLabel: { fontSize: 14, color: 'var(--text)', fontWeight: 500 },
    toggleDesc: { fontSize: 12, color: 'var(--muted)', marginTop: 2 },
    toggle: (on) => ({
      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
      background: on ? '#6366f1' : 'var(--border)', position: 'relative', transition: 'background .2s', flexShrink: 0,
    }),
    toggleKnob: (on) => ({
      position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18,
      borderRadius: '50%', background: '#fff', transition: 'left .2s',
    }),
    submitBtn: {
      width: '100%', padding: '11px', borderRadius: 10, border: 'none',
      background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff',
      fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 20,
    },
    alert: (type) => ({
      padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 16,
      background: type === 'ok' ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)',
      border: `1px solid ${type === 'ok' ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`,
      color: type === 'ok' ? '#22c55e' : '#ef4444',
    }),
    dangerBtn: {
      width: '100%', padding: '11px', borderRadius: 10,
      border: '1px solid rgba(239,68,68,.4)', background: 'rgba(239,68,68,.08)',
      color: '#ef4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 12,
    },
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.title}>⚙️ Paramètres</div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {TABS.map(t => (
            <button key={t.id} style={s.tabBtn(tab === t.id)} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={s.body}>

          {/* ── MON COMPTE ── */}
          {tab === 'account' && (
            <div>
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 26, fontWeight: 700,
                  background: `${roleInfo.color}20`, color: roleInfo.color, border: `2px solid ${roleInfo.color}40`,
                }}>
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{user?.name}</div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, marginTop: 4, display: 'inline-block',
                    background: `${roleInfo.color}18`, color: roleInfo.color, border: `1px solid ${roleInfo.color}30`,
                  }}>
                    {roleInfo.label}
                  </span>
                </div>
              </div>

              {/* Info rows */}
              <div style={s.infoRow}>
                <span style={s.infoLabel}>Nom complet</span>
                <span style={s.infoValue}>{user?.name}</span>
              </div>
              <div style={s.infoRow}>
                <span style={s.infoLabel}>Adresse email</span>
                <span style={s.infoValue}>{user?.email}</span>
              </div>
              <div style={{ ...s.infoRow, borderBottom: 'none' }}>
                <span style={s.infoLabel}>Rôle</span>
                <span style={{ ...s.infoValue, color: roleInfo.color }}>{roleInfo.label}</span>
              </div>

              {/* Logout */}
              <button style={s.dangerBtn} onClick={() => { logout(); onClose(); }}>
                ⏻ Se déconnecter
              </button>
            </div>
          )}

          {/* ── MOT DE PASSE ── */}
          {tab === 'password' && (
            <form onSubmit={handleChangePassword}>
              {pwMsg && <div style={s.alert(pwMsg.type)}>{pwMsg.type === 'ok' ? '✓' : '⚠'} {pwMsg.text}</div>}

              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>Mot de passe actuel</label>
                <input style={s.input} type="password" placeholder="••••••••" value={pwForm.current}
                  onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>Nouveau mot de passe</label>
                <input style={s.input} type="password" placeholder="••••••••" value={pwForm.next}
                  onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} required />
              </div>
              <div style={{ marginBottom: 4 }}>
                <label style={s.label}>Confirmer le nouveau mot de passe</label>
                <input style={s.input} type="password" placeholder="••••••••" value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
              </div>

              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                Le mot de passe doit contenir au moins 6 caractères.
              </div>

              <button type="submit" style={{ ...s.submitBtn, opacity: pwLoading ? .7 : 1 }} disabled={pwLoading}>
                {pwLoading ? 'Modification...' : '🔒 Changer le mot de passe'}
              </button>
            </form>
          )}

          {/* ── PRÉFÉRENCES ── */}
          {tab === 'prefs' && (
            <div>
              {[
                { key: 'notif_submit',  label: 'Notifications de soumission',   desc: 'Être notifié lors d\'une nouvelle soumission' },
                { key: 'notif_update',  label: 'Mises à jour de statut',         desc: 'Alertes lors des changements de statut' },
                { key: 'compact_cards', label: 'Affichage compact',              desc: 'Réduire la taille des cartes de projet' },
                { key: 'confirm_actions', label: 'Confirmation des actions',     desc: 'Demander confirmation avant chaque action' },
              ].map(({ key, label, desc }) => (
                <div key={key} style={s.toggleRow}>
                  <div>
                    <div style={s.toggleLabel}>{label}</div>
                    <div style={s.toggleDesc}>{desc}</div>
                  </div>
                  <button style={s.toggle(!!prefs[key])} onClick={() => togglePref(key)}>
                    <div style={s.toggleKnob(!!prefs[key])} />
                  </button>
                </div>
              ))}

              <div style={{ marginTop: 24, padding: 16, background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>ℹ️ INFO</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Les préférences sont sauvegardées localement dans votre navigateur.
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
