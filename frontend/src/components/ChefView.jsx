import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import TaskCard from './TaskCard';

const ROLE_CONFIG = {
  client:    { label: 'Client',      icon: '👤', cls: 'bg-client',   color: 'var(--accent-client)',   colorHex: '#f59e0b' },
  designer:  { label: 'Designer',    icon: '🎨', cls: 'bg-designer', color: 'var(--accent-designer)', colorHex: '#ec4899' },
  developer: { label: 'Développeur', icon: '💻', cls: 'bg-dev',      color: 'var(--accent-dev)',      colorHex: '#10b981' },
};

const EMPTY_FORM    = { name: '', email: '', password: '', role: 'client' };
const EMPTY_FILTERS = { search: '', status: '', priority: '' };

const STATUS_LABELS = {
  pending_chef:       'En attente',
  assigned_designer:  'Assigné Designer',
  in_progress_designer: 'En cours (Design)',
  review_chef_design: 'Révision Design',
  review_client:      'Révision Client',
  rejected_client:    'Rejeté Client',
  approved_client:    'Approuvé Client',
  assigned_dev:       'Assigné Dev',
  in_progress_dev:    'En cours (Dev)',
  review_chef_dev:    'Révision Dev',
  delivered:          'Livré',
  completed:          'Terminé',
};

const PRIORITY_LABELS = { low: 'Faible', medium: 'Moyen', high: 'Élevé' };
const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ChefView() {
  const [tasks, setTasks]             = useState([]);
  const [userCounts, setUserCounts]   = useState({ client: 0, designer: 0, developer: 0 });

  // liste déroulante par rôle
  const [activeRole, setActiveRole]   = useState(null);
  const [roleUsers, setRoleUsers]     = useState([]);
  const [listLoading, setListLoading] = useState(false);

  // filtres "Tous les projets"
  const [filters, setFilters]         = useState(EMPTY_FILTERS);
  const [allTasks, setAllTasks]       = useState([]);
  const [allLoading, setAllLoading]   = useState(false);
  const debounceRef                   = useRef(null);

  // modal ajout
  const [showModal, setShowModal]     = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formError, setFormError]     = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg]   = useState('');

  /* ── fetch projets sans filtre (section "action requise") ── */
  const fetchTasks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tasks');
      setTasks(res.data);
    } catch (err) { console.error(err); }
  };

  /* ── fetch projets filtrés (section "Tous les projets") ── */
  const fetchAllTasks = async (f) => {
    setAllLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.search)   params.set('search',   f.search);
      if (f.status)   params.set('status',   f.status);
      if (f.priority) params.set('priority', f.priority);
      const res = await axios.get(`http://localhost:5000/api/tasks?${params}`);
      setAllTasks(res.data);
    } catch (err) { console.error(err); }
    finally { setAllLoading(false); }
  };

  /* ── fetch compteurs globaux ── */
  const fetchCounts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/users');
      const all = res.data;
      setUserCounts({
        client:    all.filter(u => u.role === 'client').length,
        designer:  all.filter(u => u.role === 'designer').length,
        developer: all.filter(u => u.role === 'developer').length,
      });
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTasks(); fetchCounts(); fetchAllTasks(EMPTY_FILTERS); }, []);

  /* ── debounce sur les filtres ── */
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchAllTasks(filters), filters.search ? 400 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [filters]);

  /* ── toggle liste filtrée (backend) ── */
  const toggleList = async (role) => {
    if (activeRole === role) { setActiveRole(null); setRoleUsers([]); return; }
    setActiveRole(role);
    setListLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/auth/users?role=${role}`);
      setRoleUsers(res.data);
    } catch (err) { console.error(err); }
    finally { setListLoading(false); }
  };

  /* ── supprimer un utilisateur ── */
  const handleDeleteUser = async (userId, userName, role) => {
    if (!window.confirm(`Supprimer "${userName}" définitivement ?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/auth/users/${userId}`);
      setRoleUsers(prev => prev.filter(u => u._id !== userId));
      setUserCounts(prev => ({ ...prev, [role]: prev[role] - 1 }));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  /* ── stats projets ── */
  const taskStats = {
    total:  tasks.length,
    inbox:  tasks.filter(t => ['pending_chef','review_chef_design','review_chef_dev','approved_client','rejected_client'].includes(t.status)).length,
    active: tasks.filter(t => ['assigned_designer','in_progress_designer','assigned_dev','in_progress_dev'].includes(t.status)).length,
    done:   tasks.filter(t => t.status === 'completed').length,
  };

  const actionStatuses = ['pending_chef','review_chef_design','approved_client','rejected_client','review_chef_dev'];
  const actionTasks = tasks.filter(t => actionStatuses.includes(t.status));

  const updateStatus = async (id, status, logMsg) => {
    if (!window.confirm("Confirmer cette action ?")) return;
    try {
      await axios.put(`http://localhost:5000/api/tasks/${id}`, { status, logMsg });
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  /* ── modal handlers ── */
  const handleOpenModal  = () => { setForm(EMPTY_FORM); setFormError(''); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setFormError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Veuillez remplir tous les champs.');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      await axios.post('http://localhost:5000/api/auth/register', form);
      setShowModal(false);
      setSuccessMsg(`Utilisateur "${form.name}" créé avec succès !`);
      fetchCounts();
      if (activeRole === form.role) toggleList(form.role);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Erreur lors de la création.');
    } finally { setFormLoading(false); }
  };

  return (
    <div>
      {/* ── HEADER ── */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="page-title">Tableau de bord <span className="color-chef">Chef de Projet</span></div>
          <div className="page-subtitle">Pilotez les projets, coordonnez l'équipe et suivez les livrables</div>
        </div>
        <button className="btn-add-user" onClick={handleOpenModal}>
          <span style={{ fontSize: 18 }}>+</span> Ajouter utilisateur
        </button>
      </div>

      {/* ── TOAST SUCCESS ── */}
      {successMsg && (
        <div style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.3)', color: 'var(--success)', borderRadius: 10, padding: '12px 18px', marginBottom: 20, fontSize: 14, fontWeight: 500 }}>
          ✓ {successMsg}
        </div>
      )}

      {/* ── STATS PROJETS ── */}
      <div id="chef-stats" className="stats-row">
        <div className="stat-card"><div className="stat-value">{taskStats.total}</div><div className="stat-label">Total projets</div></div>
        <div className="stat-card"><div className="stat-value color-chef">{taskStats.inbox}</div><div className="stat-label">Action requise</div></div>
        <div className="stat-card"><div className="stat-value" style={{color:'#f472b6'}}>{taskStats.active}</div><div className="stat-label">En production</div></div>
        <div className="stat-card"><div className="stat-value color-dev">{taskStats.done}</div><div className="stat-label">Terminés</div></div>
      </div>

      {/* ── STATS UTILISATEURS ── */}
      <div id="chef-team" className="section-title">Statistiques de l'équipe</div>
      <div className="user-stats-row">
        {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
          const isOpen = activeRole === role;
          return (
            <div key={role} className={`user-stat-card${isOpen ? ' user-stat-card--open' : ''}`} style={{ borderTopColor: cfg.colorHex }}>
              <div className="user-stat-icon">{cfg.icon}</div>
              <div className="user-stat-count" style={{ color: cfg.colorHex }}>{userCounts[role]}</div>
              <div className="user-stat-label">{cfg.label}{userCounts[role] > 1 ? 's' : ''}</div>

              <button
                className="btn-voir-liste"
                style={{
                  borderColor: isOpen ? cfg.colorHex : 'var(--border)',
                  color:       isOpen ? cfg.colorHex : 'var(--muted)',
                  background:  isOpen ? `${cfg.colorHex}14` : 'transparent',
                }}
                onClick={() => toggleList(role)}
              >
                {isOpen ? '▲ Masquer' : '▼ Voir la liste'}
              </button>

              {/* ── LISTE DÉROULANTE ── */}
              {isOpen && (
                <div className="user-list-panel">
                  {listLoading ? (
                    <div className="user-list-loading">Chargement…</div>
                  ) : roleUsers.length === 0 ? (
                    <div className="user-list-empty">Aucun {cfg.label.toLowerCase()} enregistré.</div>
                  ) : (
                    roleUsers.map(u => (
                      <div key={u._id} className="user-list-item">
                        <div className="user-list-avatar" style={{ background: `${cfg.colorHex}22`, color: cfg.colorHex }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-list-info">
                          <div className="user-list-name">{u.name}</div>
                          <div className="user-list-email">{u.email}</div>
                        </div>
                        <div className="user-list-date">{formatDate(u.createdAt)}</div>
                        <button
                          className="btn-delete-user"
                          title="Supprimer cet utilisateur"
                          onClick={() => handleDeleteUser(u._id, u.name, role)}
                        >🗑</button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── PROJETS ACTION ── */}
      <div id="chef-action" className="section-title">⚡ Projets nécessitant votre action</div>
      <div className="tasks-grid">
        {!actionTasks.length && (
          <div className="empty-state">
            <div className="empty-icon">🎉</div>
            <div className="empty-text">Aucune action requise pour l'instant.</div>
          </div>
        )}
        {actionTasks.map(t => (
          <TaskCard key={t._id} t={t} fetchTasks={fetchTasks} borderClass="chef" showPipeline>
            <div className="task-actions">
              {t.status === 'pending_chef' && <button className="btn-action btn-send-dev" onClick={() => updateStatus(t._id, 'assigned_designer', 'Chef a assigné le projet au Designer')}>🎨 Assigner au Designer</button>}
              {t.status === 'review_chef_design' && (
                <>
                  <button className="btn-action btn-approve" onClick={() => updateStatus(t._id, 'review_client', 'Chef a envoyé le design au Client')}>➤ Envoyer au Client</button>
                  <button className="btn-action btn-reject" onClick={() => updateStatus(t._id, 'assigned_designer', 'Chef a retourné le design for corrections')}>↩ Retourner au Designer</button>
                </>
              )}
              {t.status === 'approved_client' && <button className="btn-action btn-start" onClick={() => updateStatus(t._id, 'assigned_dev', 'Chef a assigné le projet au Développeur')}>💻 Assigner au Développeur</button>}
              {t.status === 'rejected_client' && <button className="btn-action btn-send-dev" onClick={() => updateStatus(t._id, 'assigned_designer', 'Chef a re-assigné le projet au Designer')}>🎨 Re-assigner au Designer</button>}
              {t.status === 'review_chef_dev' && (
                <>
                  <button className="btn-action btn-approve" onClick={() => updateStatus(t._id, 'delivered', 'Chef a livré le projet final au Client')}>📦 Livrer au Client</button>
                  <button className="btn-action btn-reject" onClick={() => updateStatus(t._id, 'assigned_dev', 'Chef a retourné pour corrections')}>↩ Retourner au Dev</button>
                </>
              )}
            </div>
          </TaskCard>
        ))}
      </div>

      <br/>
      <div id="chef-all" className="section-title">Tous les projets</div>

      {/* ── BARRE DE FILTRES ── */}
      <div className="filter-bar">
        {/* Recherche */}
        <div className="filter-search-wrap">
          <span className="filter-search-icon">🔍</span>
          <input
            className="filter-search"
            placeholder="Rechercher par titre…"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
          {filters.search && (
            <button className="filter-clear-search" onClick={() => setFilters(f => ({ ...f, search: '' }))}>✕</button>
          )}
        </div>

        {/* Statut */}
        <select
          className="filter-select"
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([val, lbl]) => (
            <option key={val} value={val}>{lbl}</option>
          ))}
        </select>

        {/* Priorité */}
        <div className="filter-priority-group">
          {['', 'low', 'medium', 'high'].map(p => (
            <button
              key={p}
              className={`filter-priority-btn${filters.priority === p ? ' active' : ''}`}
              style={filters.priority === p && p ? { borderColor: PRIORITY_COLORS[p], color: PRIORITY_COLORS[p], background: `${PRIORITY_COLORS[p]}18` } : {}}
              onClick={() => setFilters(f => ({ ...f, priority: p }))}
            >
              {p === '' ? 'Toutes' : PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Reset */}
        {(filters.search || filters.status || filters.priority) && (
          <button className="filter-reset" onClick={() => setFilters(EMPTY_FILTERS)}>
            Réinitialiser
          </button>
        )}

        {/* Compteur */}
        <span className="filter-count">
          {allLoading ? '…' : `${allTasks.length} projet${allTasks.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* ── LISTE ── */}
      <div className="tasks-grid">
        {allLoading && <div className="empty-state"><div className="empty-text">Chargement…</div></div>}
        {!allLoading && allTasks.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔎</div>
            <div className="empty-text">Aucun projet ne correspond aux filtres.</div>
          </div>
        )}
        {!allLoading && allTasks.map(t => {
          const isDesigner = ['assigned_designer','in_progress_designer','review_chef_design'].includes(t.status);
          const isDev = ['assigned_dev','in_progress_dev','review_chef_dev'].includes(t.status);
          const borderClass = isDesigner ? 'designer' : isDev ? 'dev' : 'chef';
          return <TaskCard key={t._id} t={t} borderClass={borderClass} />;
        })}
      </div>

      {/* ══════════════════════════════
          MODAL AJOUTER UTILISATEUR
      ══════════════════════════════ */}
      {showModal && (
        <div className="modal-overlay open" onClick={handleCloseModal}>
          <div className="modal add-user-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div className="modal-title" style={{ marginBottom: 0 }}>➕ Ajouter un utilisateur</div>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="field-label">Rôle</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role }))}
                    style={{
                      padding: '12px 8px',
                      borderRadius: 10,
                      border: `2px solid ${form.role === role ? cfg.colorHex : 'var(--border)'}`,
                      background: form.role === role ? `${cfg.colorHex}18` : 'var(--surface2)',
                      color: form.role === role ? cfg.colorHex : 'var(--muted)',
                      cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: 600,
                      fontSize: 13,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all .2s',
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{cfg.icon}</span>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="field-label">Nom complet</label>
                <input className="field-input" placeholder="Ex: Alice Martin" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ marginBottom: 0 }} />
              </div>
              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="field-label">Adresse email</label>
                <input className="field-input" type="email" placeholder="email@exemple.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={{ marginBottom: 0 }} />
              </div>
              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="field-label">Mot de passe</label>
                <input className="field-input" type="password" placeholder="Minimum 6 caractères" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={{ marginBottom: 0 }} />
              </div>

              {formError && (
                <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12, padding: '8px 12px', background: 'rgba(239,68,68,.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,.2)' }}>
                  ⚠ {formError}
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>Annuler</button>
                <button type="submit" disabled={formLoading} className="btn-confirm"
                  style={{
                    background: `linear-gradient(135deg, ${ROLE_CONFIG[form.role].colorHex}, ${ROLE_CONFIG[form.role].colorHex}bb)`,
                    color: form.role === 'client' ? '#000' : '#fff',
                    opacity: formLoading ? .7 : 1,
                  }}
                >
                  {formLoading ? 'Création...' : `Créer le ${ROLE_CONFIG[form.role].label}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
