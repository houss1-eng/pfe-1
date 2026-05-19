import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import TaskCard from './TaskCard';
import NotificationPanel from './NotificationPanel';


const EMPTY_FILTERS = { search: '', priority: '', status: '' };
const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
const PRIORITY_LABELS = { low: 'Faible', medium: 'Moyen', high: 'Élevé' };
const SUB_STATUSES = [
  { value: '',                      label: 'Tous'      },
  { value: 'assigned_designer',     label: 'Assigné'   },
  { value: 'in_progress_designer',  label: 'En cours'  },
];

export default function DesignerView() {
  const navigate = useNavigate();
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
      const res = await axios.get('http://localhost:5000/api/tasks?status=review_chef_design');
      setDoneTasks(res.data);
    } catch (err) { console.error(err); }
  };

  /* ── fetch projets assignés filtrés ── */
  const fetchAssigned = async (f) => {
    setAssignedLoading(true);
    try {
      const params = new URLSearchParams();
      // filtre de statut : un sous-statut précis ou les deux par défaut
      if (f.status) params.set('status',   f.status);
      else          params.set('statuses', 'assigned_designer,in_progress_designer');
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
        await axios.post(`http://localhost:5000/api/tasks/${id}/upload/designer`, fd);
        setUploading(u => ({ ...u, [id]: false }));
        setFiles(f => ({ ...f, [id]: null }));
      }
      const data = { status, logMsg };
      if (noteStr !== undefined) data.designerNote = noteStr;
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
          <div className="page-title">Espace <span className="color-designer">Designer</span></div>
          <div className="page-subtitle">Vos projets assignés et livrables design</div>
        </div>
        <NotificationPanel role="designer" />
      </div>

      <div id="designer-stats" className="stats-row">
        <div className="stat-card"><div className="stat-value" style={{color:'var(--accent-designer)'}}>{assigned.length}</div><div className="stat-label">À travailler</div></div>
        <div className="stat-card"><div className="stat-value color-chef">{doneTasks.length}</div><div className="stat-label">En revue Chef</div></div>
        <div className="stat-card"><div className="stat-value color-dev">{statsTotal}</div><div className="stat-label">Total assignés</div></div>
      </div>

      <div id="designer-tools" className="design-tools-section">
        <div className="section-title">🎨 Outils de Design</div>
        <div className="tools-grid">
          <div className="tool-card" onClick={() => navigate('/n8n-automation')}>
            <div className="tool-icon">🤖</div>
            <h3>Génération IA (n8n)</h3>
            <p>Générez des wireframes automatiquement avec l'IA</p>
            <button className="btn-primary">Automatiser</button>
          </div>
        </div>
      </div>

      {/* ── TITRE + FILTRE ── */}
      <div id="designer-projects" className="section-title">🎨 Projets assignés</div>

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
              style={filters.status === s.value ? { borderColor: '#ec4899', color: '#ec4899', background: 'rgba(236,72,153,.12)' } : {}}
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
            <div className="empty-icon">{hasFilter ? '🔎' : '🎨'}</div>
            <div className="empty-text">{hasFilter ? 'Aucun projet ne correspond aux filtres.' : 'Aucun projet à traiter.'}</div>
          </div>
        )}
        {!assignedLoading && assigned.map(t => {
          const inProgress = t.status === 'in_progress_designer';
          return (
            <TaskCard key={t._id} t={t} fetchTasks={() => { fetchAssigned(filters); fetchDone(); }} borderClass="designer">
              {inProgress && (
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="field-label">Note de livraison</label>
                  <textarea className="field-textarea" placeholder="Décrivez ce qui a été réalisé..."
                    value={notes[t._id] || t.designerNote || ''}
                    onChange={e => setNotes({ ...notes, [t._id]: e.target.value })} />
                  <label className="field-label" style={{ marginTop: 10 }}>Fichiers à joindre</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <label style={{ cursor: 'pointer', fontSize: 13, padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--muted)', background: 'var(--surface)' }}>
                      📄 Fichiers
                      <input type="file" multiple hidden
                        onChange={e => setFiles(f => ({ ...f, [t._id]: e.target.files }))} />
                    </label>
                    <label style={{ cursor: 'pointer', fontSize: 13, padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--muted)', background: 'var(--surface)' }}>
                      📁 Dossier
                      <input type="file" webkitdirectory="" mozdirectory="" hidden
                        onChange={e => setFiles(f => ({ ...f, [t._id]: e.target.files }))} />
                    </label>
                  </div>
                  {files[t._id] && files[t._id].length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                      {files[t._id].length} fichier{files[t._id].length > 1 ? 's' : ''} sélectionné{files[t._id].length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
              <div className="task-actions">
                {!inProgress && <button className="btn-action btn-start" onClick={() => updateStatus(t._id, 'in_progress_designer', 'Designer a commencé le travail')}>▶ Commencer</button>}
                {inProgress && (
                  <button className="btn-action btn-done" disabled={uploading[t._id]}
                    onClick={() => updateStatus(t._id, 'review_chef_design', `Designer a soumis le design au Chef — "${notes[t._id] || ''}"`, notes[t._id] || '')}>
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
