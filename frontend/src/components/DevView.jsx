import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import TaskCard from './TaskCard';
import NotificationPanel from './NotificationPanel';

const EMPTY_FILTERS = { search: '', priority: '', status: '' };
const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
const PRIORITY_LABELS = { low: 'Faible', medium: 'Moyen', high: 'Élevé' };
const SUB_STATUSES = [
  { value: '',             label: 'Tous'     },
  { value: 'assigned_dev', label: 'Assigné'  },
  { value: 'in_progress_dev', label: 'En cours' },
];

export default function DevView() {
  const [notes, setNotes]               = useState({});
  const [files, setFiles]               = useState({});
  const [uploading, setUploading]       = useState({});
  const [doneTasks, setDoneTasks]       = useState([]);

  // section "Projets assignés" filtrée
  const [assigned, setAssigned]         = useState([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [filters, setFilters]           = useState(EMPTY_FILTERS);
  const debounceRef                     = useRef(null);

  /* ── fetch projets "en revue chef" (non filtrés) ── */
  const fetchDone = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tasks?status=review_chef_dev');
      setDoneTasks(res.data);
    } catch (err) { console.error(err); }
  };

  /* ── fetch projets assignés filtrés ── */
  const fetchAssigned = async (f) => {
    setAssignedLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.status) params.set('status',   f.status);
      else          params.set('statuses', 'assigned_dev,in_progress_dev');
      if (f.priority) params.set('priority', f.priority);
      if (f.search)   params.set('search',   f.search);
      const res = await axios.get(`http://localhost:5000/api/tasks?${params}`);
      setAssigned(res.data);
    } catch (err) { console.error(err); }
    finally { setAssignedLoading(false); }
  };

  useEffect(() => { fetchDone(); fetchAssigned(EMPTY_FILTERS); }, []);

  /* ── debounce ── */
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchAssigned(filters), filters.search ? 400 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [filters]);

  const statsTotal = assigned.length + doneTasks.length;

  const updateStatus = async (id, status, logMsg, noteStr) => {
    if (!window.confirm('Confirmer cette action ?')) return;
    try {
      const taskFiles = files[id];
      if (taskFiles && taskFiles.length > 0) {
        setUploading(u => ({ ...u, [id]: true }));
        const fd = new FormData();
        Array.from(taskFiles).forEach(f => fd.append('files', f));
        await axios.post(`http://localhost:5000/api/tasks/${id}/upload/dev`, fd);
        setUploading(u => ({ ...u, [id]: false }));
        setFiles(f => ({ ...f, [id]: null }));
      }
      const data = { status, logMsg };
      if (noteStr !== undefined) data.devNote = noteStr;
      await axios.put(`http://localhost:5000/api/tasks/${id}`, data);
      fetchAssigned(filters);
      fetchDone();
    } catch (err) { console.error(err); setUploading(u => ({ ...u, [id]: false })); }
  };

  const hasFilter = filters.search || filters.priority || filters.status;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">Espace <span className="color-dev">Développeur</span></div>
          <div className="page-subtitle">Vos projets de développement assignés</div>
        </div>
        <NotificationPanel role="developer" />
      </div>

      <div id="dev-stats" className="stats-row">
        <div className="stat-card"><div className="stat-value color-dev">{assigned.length}</div><div className="stat-label">À développer</div></div>
        <div className="stat-card"><div className="stat-value color-chef">{doneTasks.length}</div><div className="stat-label">En revue Chef</div></div>
        <div className="stat-card"><div className="stat-value color-client">{statsTotal}</div><div className="stat-label">Total assignés</div></div>
      </div>

      {/* ── TITRE + FILTRE ── */}
      <div id="dev-projects" className="section-title">💻 Projets assignés</div>

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

        {/* Sous-statut */}
        <div className="filter-priority-group">
          {SUB_STATUSES.map(s => (
            <button
              key={s.value}
              className={`filter-priority-btn${filters.status === s.value ? ' active' : ''}`}
              style={filters.status === s.value ? { borderColor: '#10b981', color: '#10b981', background: 'rgba(16,185,129,.12)' } : {}}
              onClick={() => setFilters(f => ({ ...f, status: s.value }))}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Priorité */}
        <div className="filter-priority-group">
          {['', 'low', 'medium', 'high'].map(p => (
            <button
              key={p}
              className={`filter-priority-btn${filters.priority === p ? ' active' : ''}`}
              style={filters.priority === p && p ? { borderColor: PRIORITY_COLORS[p], color: PRIORITY_COLORS[p], background: `${PRIORITY_COLORS[p]}18` } : {}}
              onClick={() => setFilters(f => ({ ...f, priority: p }))}
            >
              {p === '' ? 'Toutes priorités' : PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Reset */}
        {hasFilter && (
          <button className="filter-reset" onClick={() => setFilters(EMPTY_FILTERS)}>Réinitialiser</button>
        )}

        <span className="filter-count">
          {assignedLoading ? '…' : `${assigned.length} projet${assigned.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* ── LISTE ── */}
      <div className="tasks-grid">
        {assignedLoading && <div className="empty-state"><div className="empty-text">Chargement…</div></div>}
        {!assignedLoading && assigned.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">{hasFilter ? '🔎' : '💻'}</div>
            <div className="empty-text">{hasFilter ? 'Aucun projet ne correspond aux filtres.' : 'Aucun projet à développer.'}</div>
          </div>
        )}
        {!assignedLoading && assigned.map(t => {
          const inProgress = t.status === 'in_progress_dev';
          return (
            <TaskCard key={t._id} t={t} fetchTasks={() => { fetchAssigned(filters); fetchDone(); }} borderClass="dev">
              {inProgress && (
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="field-label">Rapport de développement</label>
                  <textarea className="field-textarea" placeholder="Technologies utilisées, fonctionnalités implémentées..."
                    value={notes[t._id] || t.devNote || ''}
                    onChange={e => setNotes({ ...notes, [t._id]: e.target.value })} />
                  <label className="field-label" style={{ marginTop: 10 }}>Fichiers à joindre</label>
                  <input type="file" multiple style={{ marginTop: 4, fontSize: 13, color: 'var(--muted)' }}
                    onChange={e => setFiles(f => ({ ...f, [t._id]: e.target.files }))} />
                  {files[t._id] && files[t._id].length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                      {Array.from(files[t._id]).map(f => f.name).join(', ')}
                    </div>
                  )}
                </div>
              )}
              <div className="task-actions">
                {!inProgress && <button className="btn-action btn-start" onClick={() => updateStatus(t._id, 'in_progress_dev', 'Développeur a commencé le développement')}>▶ Démarrer le développement</button>}
                {inProgress && (
                  <button className="btn-action btn-done" disabled={uploading[t._id]}
                    onClick={() => updateStatus(t._id, 'review_chef_dev', `Développeur a soumis le projet au Chef — "${notes[t._id] || ''}"`, notes[t._id] || '')}>
                    {uploading[t._id] ? '⏳ Envoi...' : '✓ Soumettre au Chef'}
                  </button>
                )}
              </div>
            </TaskCard>
          );
        })}
      </div>

      {doneTasks.length > 0 && (
        <>
          <br />
          <div className="section-title">En attente de revue Chef</div>
          <div className="tasks-grid">
            {doneTasks.map(t => <TaskCard key={t._id} t={t} borderClass="chef" />)}
          </div>
        </>
      )}
    </div>
  );
}
