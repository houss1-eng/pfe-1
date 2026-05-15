import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import NotificationPanel from './NotificationPanel';
import ClientContracts from './ClientContracts';
import { AuthContext } from '../context/AuthContext';

/* ── Status metadata ── */
const STATUS_PROGRESS = {
  pending_chef: 5, assigned_designer: 15, in_progress_designer: 30,
  review_chef_design: 42, review_client: 52, rejected_client: 38,
  approved_client: 55, assigned_dev: 65, in_progress_dev: 78,
  review_chef_dev: 88, delivered: 95, completed: 100,
};

const STATUS_INFO = {
  pending_chef:         { label: 'En attente',        color: '#6b7280' },
  assigned_designer:    { label: 'Design assigné',    color: '#ec4899' },
  in_progress_designer: { label: 'Design en cours',   color: '#ec4899' },
  review_chef_design:   { label: 'Révision interne',  color: '#f59e0b' },
  review_client:        { label: 'À valider ⚡',       color: '#f59e0b' },
  rejected_client:      { label: 'Révision demandée', color: '#ef4444' },
  approved_client:      { label: 'Approuvé',           color: '#22c55e' },
  assigned_dev:         { label: 'Développement',     color: '#10b981' },
  in_progress_dev:      { label: 'En développement',  color: '#10b981' },
  review_chef_dev:      { label: 'Révision dev',      color: '#f59e0b' },
  delivered:            { label: 'Livré ⚡',           color: '#6366f1' },
  completed:            { label: 'Terminé',            color: '#10b981' },
};

/* ── Workflow steps ── */
const WF_STEPS = [
  'Soumis', 'Chef de projet', 'Designer', 'Maquettes', 'Votre validation', 'Développement', 'Livraison',
];

/* Returns which step index the task is currently AT */
const STATUS_STEP = {
  pending_chef: 1,
  assigned_designer: 2, in_progress_designer: 2,
  review_chef_design: 3,
  review_client: 4, rejected_client: 4, approved_client: 4,
  assigned_dev: 5, in_progress_dev: 5, review_chef_dev: 5,
  delivered: 6, completed: 7,
};

const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
const PRIORITY_LABELS = { low: 'Faible', medium: 'Moyen', high: 'Urgent' };

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function getDateLabel() {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/* ── Component ── */
export default function ClientView({ section }) {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);

  /* form */
  const [showForm, setShowForm]     = useState(false);
  const [title, setTitle]           = useState('');
  const [desc, setDesc]             = useState('');
  const [prio, setPrio]             = useState('medium');
  const [deadline, setDeadline]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* selected task for workflow + review */
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  /* project detail modal */
  const [modalTask, setModalTask]   = useState(null);
  const [msgText, setMsgText]       = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  /* ── fetch ── */
  const fetchTasks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tasks');
      setTasks(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTasks(); }, []);

  /* auto-select most relevant task */
  useEffect(() => {
    if (!tasks.length || selectedTaskId) return;
    const pick =
      tasks.find(t => t.status === 'review_client') ||
      tasks.find(t => t.status === 'delivered')     ||
      tasks.find(t => !['completed'].includes(t.status)) ||
      tasks[0];
    if (pick) setSelectedTaskId(pick._id);
  }, [tasks, selectedTaskId]);

  const selectedTask = tasks.find(t => t._id === selectedTaskId) || null;

  /* ── computed ── */
  const stats = useMemo(() => ({
    active:    tasks.filter(t => !['completed', 'delivered'].includes(t.status)).length,
    review:    tasks.filter(t => ['review_client', 'delivered'].includes(t.status)).length,
    inDev:     tasks.filter(t => ['assigned_dev', 'in_progress_dev', 'review_chef_dev'].includes(t.status)).length,
    completed: tasks.filter(t => ['completed', 'delivered'].includes(t.status)).length,
  }), [tasks]);

  /* activity feed — logs du projet sélectionné uniquement */
  const activity = useMemo(() => {
    if (!selectedTask) return [];
    return [...(selectedTask.log || [])].reverse().slice(0, 8);
  }, [selectedTask]);

  /* ── submit ── */
  const submitTask = async () => {
    if (!title.trim() || !desc.trim()) return alert('Veuillez remplir tous les champs');
    setSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/tasks', { title, description: desc, priority: prio, deadline: deadline || undefined });
      setTitle(''); setDesc(''); setPrio('medium'); setDeadline(''); setShowForm(false);
      fetchTasks();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const updateStatus = async (id, status, logMsg) => {
    if (!window.confirm('Confirmer cette action ?')) return;
    try {
      await axios.put(`http://localhost:5000/api/tasks/${id}`, { status, logMsg });
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Supprimer ce projet définitivement ? Cette action est irréversible.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${id}`);
      setModalTask(null);
      if (selectedTaskId === id) setSelectedTaskId(null);
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  const sendMessage = async () => {
    if (!msgText.trim()) return;
    setSendingMsg(true);
    try {
      await axios.put(`http://localhost:5000/api/tasks/${modalTask._id}`, {
        logMsg: `💬 Message du client : ${msgText.trim()}`,
        notifyChef: true,
      });
      setMsgText('');
      setModalTask(prev => ({
        ...prev,
        log: [...(prev.log || []), { time: new Date().toLocaleString('fr-FR'), msg: `💬 Message du client : ${msgText.trim()}` }],
      }));
      fetchTasks();
    } catch (err) { console.error(err); }
    finally { setSendingMsg(false); }
  };

  /* ── workflow step state ── */
  const currentStep = selectedTask ? (STATUS_STEP[selectedTask.status] ?? 0) : 0;
  const allDone     = selectedTask?.status === 'completed';
  const isRejected  = selectedTask?.status === 'rejected_client';

  /* ── render ── */
  return (
    <div className="client-view-container">
      {section === 'client-contracts' ? (
        <ClientContracts />
      ) : (
        <>

      {/* ── HEADER ── */}
      <div
        id="client-stats"
        className="page-header"
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}
      >
        <div>
          <div className="page-title">
            {getGreeting()},{' '}
            <span className="color-client">{user?.name?.split(' ')[0]} 👋</span>
          </div>
          <div className="page-subtitle">Voici l'état de vos projets — {getDateLabel()}</div>
        </div>
        <NotificationPanel role="client" />
      </div>

      {/* ── STATS ── */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Projets actifs</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div className="stat-value" style={{ color: '#6366f1' }}>{stats.active}</div>
            <span style={{ fontSize: 20, opacity: .45 }}>📁</span>
          </div>
          <div className="stat-delta" style={{ color: 'var(--muted)' }}>{tasks.length} au total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">En attente de validation</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.review}</div>
            <span style={{ fontSize: 20, opacity: .45 }}>🖼️</span>
          </div>
          <div className="stat-delta" style={{ color: stats.review > 0 ? '#f59e0b' : 'var(--muted)' }}>
            {stats.review > 0 ? 'Action requise' : 'Rien à valider'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">En développement</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div className="stat-value color-dev">{stats.inDev}</div>
            <span style={{ fontSize: 20, opacity: .45 }}>💻</span>
          </div>
          <div className="stat-delta" style={{ color: 'var(--muted)' }}>Phase technique</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Projets livrés</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div className="stat-value" style={{ color: 'var(--muted)' }}>{stats.completed}</div>
            <span style={{ fontSize: 20, opacity: .45 }}>✅</span>
          </div>
          <div className="stat-delta" style={{ color: 'var(--muted)' }}>Historique total</div>
        </div>
      </div>

      {/* ── TWO-COLUMN LAYOUT ── */}
      <div className="cl-grid2">

        {/* ═══════════ LEFT ═══════════ */}
        <div className="cl-col-left">

          {/* New project button */}
          <button id="client-form" className="cl-new-proj-btn" onClick={() => setShowForm(v => !v)}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
            Soumettre un nouveau projet
          </button>

          {/* Collapsible form */}
          {showForm && (
            <div className="cl-form-card">
              <div className="section-title" style={{ marginBottom: 16 }}>✦ Nouvelle demande</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="field-label">Titre du projet</label>
                  <input className="field-input" placeholder="Ex: Site e-commerce…" value={title}
                    onChange={e => setTitle(e.target.value)} style={{ marginBottom: 0 }} />
                </div>
                <div className="form-group">
                  <label className="field-label">Priorité</label>
                  <select className="field-select" value={prio} onChange={e => setPrio(e.target.value)}>
                    <option value="low">🟢 Faible</option>
                    <option value="medium">🟡 Moyen</option>
                    <option value="high">🔴 Urgent</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="field-label">Date limite (deadline)</label>
                <input
                  type="date"
                  className="field-input"
                  value={deadline}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDeadline(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
              <div className="form-group">
                <label className="field-label">Description détaillée</label>
                <textarea className="field-textarea" placeholder="Décrivez votre projet en détail…"
                  value={desc} onChange={e => setDesc(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn-cancel" onClick={() => setShowForm(false)}>Annuler</button>
                <button className="form-submit" disabled={submitting}
                  style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000' }}
                  onClick={submitTask}>
                  {submitting ? 'Envoi…' : '➤ Soumettre'}
                </button>
              </div>
            </div>
          )}

          {/* ── Projects list ── */}
          <div id="client-projects">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="section-title" style={{ marginBottom: 0 }}>Mes projets</div>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                {tasks.length} projet{tasks.length !== 1 ? 's' : ''}
              </span>
            </div>

            {!tasks.length && (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <div className="empty-text">Aucun projet soumis pour l'instant.</div>
              </div>
            )}

            <div className="cl-projects">
              {tasks.map(t => {
                const info = STATUS_INFO[t.status] || { label: t.status, color: '#6b7280' };
                const pct  = STATUS_PROGRESS[t.status] || 0;
                const isSel = selectedTaskId === t._id;
                return (
                  <div
                    key={t._id}
                    className={`cl-proj-card${isSel ? ' cl-proj-selected' : ''}`}
                    onClick={() => { setSelectedTaskId(t._id); setModalTask(t); }}
                  >
                    <div className="cl-proj-main">
                      <div className="cl-proj-top">
                        <span className="cl-proj-name">{t.title}</span>
                        <span className="ov-badge" style={{ background: `${info.color}20`, color: info.color }}>
                          {info.label}
                        </span>
                      </div>
                      <div className="cl-proj-desc">
                        {(t.description || '').slice(0, 80)}{(t.description || '').length > 80 ? '…' : ''}
                      </div>
                      <div className="cl-proj-meta">
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>📅 {formatDate(t.createdAt)}</span>
                        <span style={{ fontSize: 11, color: PRIORITY_COLORS[t.priority], fontWeight: 600 }}>
                          ● {PRIORITY_LABELS[t.priority]}
                        </span>
                      </div>
                    </div>
                    <div className="cl-proj-right">
                      <div style={{ fontSize: 11, color: info.color, fontWeight: 700, textAlign: 'right', marginBottom: 4 }}>
                        {pct}%
                      </div>
                      <div className="cl-prog-wrap">
                        <div className="cl-prog-bar" style={{ width: `${pct}%`, background: info.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Workflow timeline ── */}
          {selectedTask && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, margin: '28px 0 14px' }}>
                <div className="section-title" style={{ marginBottom: 0 }}>
                  Workflow — {selectedTask.title}
                </div>
                {['review_client', 'delivered'].includes(selectedTask.status) && (
                  <span className="ov-badge" style={{ background: '#f59e0b20', color: '#f59e0b' }}>
                    ⚡ Votre action requise
                  </span>
                )}
              </div>

              <div className="cl-workflow">
                <div className="cl-wf-steps">
                  {WF_STEPS.map((label, i) => {
                    const isDone   = allDone || i < currentStep;
                    const isActive = !allDone && i === currentStep;
                    const dotCls   = isDone ? 'done' : isActive ? (isRejected && i === 4 ? 'rejected' : 'active') : 'pending';
                    const stepCls  = isDone ? ' done' : isActive ? ' active' : '';
                    return (
                      <div key={i} className={`cl-wf-step${stepCls}`}>
                        <div className="cl-wf-dot-wrap">
                          <div className={`cl-wf-dot ${dotCls}`}>
                            {isDone ? '✓' : isActive && !isRejected ? '!' : isRejected && i === 4 ? '↩' : i + 1}
                          </div>
                        </div>
                        <div className={`cl-wf-lbl ${dotCls}`}>{label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── Review / Approval section ── */}
          {selectedTask && ['review_client', 'delivered'].includes(selectedTask.status) && (
            <div className="cl-review-card">
              <div className="cl-review-hdr">
                <span className="cl-review-tag">
                  {selectedTask.status === 'review_client' ? '🖼 Maquettes à approuver' : '📦 Livraison à accepter'}
                </span>
                <p style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>
                  {selectedTask.status === 'review_client'
                    ? 'Le designer a soumis les maquettes pour votre approbation.'
                    : 'Le projet vous a été livré. Vérifiez les livrables et confirmez la réception.'}
                </p>
              </div>

              {selectedTask.chefNote && (
                <div className="cl-note">
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                    Note du chef de projet
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{selectedTask.chefNote}</p>
                </div>
              )}

              {((selectedTask.designerFiles?.length > 0) || (selectedTask.chefFiles?.length > 0)) && (
                <div className="cl-files">
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                    Fichiers joints
                  </div>
                  <div className="cl-files-list">
                    {[...(selectedTask.chefFiles || []), ...(selectedTask.designerFiles || [])].map((f, i) => (
                      <a key={i} href={`http://localhost:5000${f.url}`} target="_blank" rel="noreferrer" className="cl-file-link">
                        📎 {f.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="cl-review-actions">
                <button className="btn-action btn-reject"
                  onClick={() => updateStatus(selectedTask._id, 'rejected_client', 'Client a demandé une révision')}>
                  ✗ Demander une révision
                </button>
                <button className="btn-action btn-approve"
                  onClick={() => updateStatus(
                    selectedTask._id,
                    selectedTask.status === 'review_client' ? 'approved_client' : 'completed',
                    'Client a approuvé'
                  )}>
                  ✓ {selectedTask.status === 'review_client' ? 'Approuver les maquettes' : 'Accepter la livraison'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════ RIGHT ═══════════ */}
        <div className="cl-col-right">

          {/* Activity feed */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Activité récente</div>
            {selectedTask && (
              <span style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedTask.title}
              </span>
            )}
          </div>
          <div className="cl-right-card" style={{ marginBottom: 20 }}>
            {!selectedTask ? (
              <div style={{ padding: '8px 0', fontSize: 13, color: 'var(--muted)' }}>
                Sélectionnez un projet pour voir son activité.
              </div>
            ) : !activity.length ? (
              <div style={{ padding: '8px 0', fontSize: 13, color: 'var(--muted)' }}>Aucune activité.</div>
            ) : activity.map((a, i) => (
              <div key={i} className="cl-act-item">
                <div className="cl-act-dot" />
                <div style={{ flex: 1 }}>
                  <div className="cl-act-msg">{a.msg}</div>
                  <div className="cl-act-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Chef contact placeholder */}
          <div className="cl-right-card">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Mon chef de projet</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="cl-contact-avatar">CP</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Chef de Projet</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Responsable du suivi</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <div className="cl-contact-btn" title="Message">💬</div>
                <div className="cl-contact-btn" title="Appel">📞</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── PROJECT DETAIL MODAL ── */}
      {modalTask && (() => {
        const info = STATUS_INFO[modalTask.status] || { label: modalTask.status, color: '#6b7280' };
        const pct  = STATUS_PROGRESS[modalTask.status] || 0;
        return (
          <div
            onClick={() => setModalTask(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000, padding: 20,
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--surface)', borderRadius: 16,
                border: '1px solid var(--border)',
                boxShadow: '0 20px 60px rgba(0,0,0,.4)',
                width: '100%', maxWidth: 520,
                maxHeight: '90vh', overflowY: 'auto',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '18px 20px 14px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                    {modalTask.title}
                  </div>
                  <span className="ov-badge" style={{ background: `${info.color}20`, color: info.color }}>
                    {info.label}
                  </span>
                </div>
                <button
                  onClick={() => setModalTask(null)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--muted)',
                    fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 2, flexShrink: 0,
                  }}
                >✕</button>
              </div>

              {/* Body */}
              <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Description */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)', marginBottom: 6 }}>
                    Description
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
                    {modalTask.description || '—'}
                  </p>
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)', marginBottom: 4 }}>Priorité</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: PRIORITY_COLORS[modalTask.priority] }}>
                      ● {PRIORITY_LABELS[modalTask.priority]}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)', marginBottom: 4 }}>Soumis le</div>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{formatDate(modalTask.createdAt)}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)', marginBottom: 4 }}>Mis à jour</div>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{formatDate(modalTask.updatedAt)}</span>
                  </div>
                  {modalTask.deadline && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)', marginBottom: 4 }}>Deadline</div>
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: new Date(modalTask.deadline) < new Date() ? '#ef4444' : '#f59e0b',
                      }}>
                        📅 {formatDate(modalTask.deadline)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)' }}>Progression</div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: info.color }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: 'var(--border)' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: info.color, width: `${pct}%`, transition: 'width .4s' }} />
                  </div>
                </div>

                {/* Delete — uniquement si projet terminé */}
                {modalTask.status === 'completed' ? (
                  <button
                    onClick={() => deleteTask(modalTask._id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                      padding: '10px 16px', borderRadius: 10,
                      background: '#ef444415', border: '1px solid #ef444440',
                      color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#ef444425'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ef444415'}
                  >
                    🗑 Supprimer ce projet
                  </button>
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                    padding: '10px 16px', borderRadius: 10,
                    background: 'var(--border)', border: '1px solid var(--border)',
                    color: 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'not-allowed',
                  }}>
                    🗑 Suppression disponible uniquement après livraison
                  </div>
                )}

                {/* Message to chef */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
                    💬 Message au chef de projet
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Écrivez votre message…"
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '10px 12px', borderRadius: 10,
                      border: '1px solid var(--border)', background: 'var(--bg)',
                      color: 'var(--text)', fontSize: 13, resize: 'vertical',
                      fontFamily: 'inherit', outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = '#f59e0b'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      onClick={sendMessage}
                      disabled={sendingMsg || !msgText.trim()}
                      style={{
                        padding: '9px 20px', borderRadius: 10, border: 'none',
                        background: sendingMsg || !msgText.trim() ? 'var(--border)' : 'linear-gradient(135deg,#f59e0b,#d97706)',
                        color: sendingMsg || !msgText.trim() ? 'var(--muted)' : '#000',
                        fontSize: 13, fontWeight: 600, cursor: sendingMsg || !msgText.trim() ? 'not-allowed' : 'pointer',
                        transition: 'all .15s',
                      }}
                    >
                      {sendingMsg ? 'Envoi…' : '➤ Envoyer'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

        </>
      )}
    </div>
  );
}
