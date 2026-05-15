import React, { useState } from 'react';

const API_URL = 'http://localhost:5000';
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

const isImage = (name) => IMAGE_EXTS.some(ext => name.toLowerCase().endsWith(ext));

const FilesSection = ({ files, label, color }) => {
  const [lightbox, setLightbox] = useState(null);
  if (!files || files.length === 0) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {files.map((f, i) => {
          const url = `${API_URL}${f.url}`;
          if (isImage(f.name)) {
            return (
              <div key={i} style={{ position: 'relative' }}>
                <img
                  src={url}
                  alt={f.name}
                  title={f.name}
                  onClick={() => setLightbox(url)}
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in', border: '1px solid var(--border)' }}
                />
              </div>
            );
          }
          return (
            <a key={i} href={url} download={f.name} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color, textDecoration: 'none',
                background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px' }}>
              📎 {f.name}
            </a>
          );
        })}
      </div>

      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={lightbox} alt="preview"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,.6)' }} />
        </div>
      )}
    </div>
  );
};

const STATUS = {
  new:                  { label: 'Nouveau',              cls: 'bg-muted' },
  pending_chef:         { label: 'En attente — Chef',    cls: 'bg-chef' },
  assigned_designer:    { label: 'Assigné — Designer',   cls: 'bg-designer' },
  in_progress_designer: { label: 'En cours — Designer',  cls: 'bg-designer' },
  review_chef_design:   { label: 'Revue Chef (Design)',  cls: 'bg-chef' },
  review_client:        { label: 'Revue Client',         cls: 'bg-client' },
  rejected_client:      { label: 'Refusé par Client',    cls: 'bg-muted' },
  approved_client:      { label: 'Approuvé par Client',  cls: 'bg-success' },
  assigned_dev:         { label: 'Assigné — Dev',        cls: 'bg-dev' },
  in_progress_dev:      { label: 'En cours — Dev',       cls: 'bg-dev' },
  review_chef_dev:      { label: 'Revue Chef (Dev)',     cls: 'bg-chef' },
  delivered:            { label: 'Livré au Client',      cls: 'bg-client' },
  completed:            { label: '✓ Terminé',            cls: 'bg-success' },
};

const PRIORITIES = {
  low:    '🟢 Faible',
  medium: '🟡 Moyen',
  high:   '🔴 Urgent',
};

const badge = (status) => {
  const s = STATUS[status] || STATUS['new'];
  return <span className={`task-badge ${s.cls}`}>{s.label}</span>;
};

const PipelineHtml = ({ currentStatus }) => {
  const steps = [
    { key: 'client', icon: '👤', name: 'Client' },
    { key: 'chef1',  icon: '📋', name: 'Chef' },
    { key: 'design', icon: '🎨', name: 'Designer' },
    { key: 'chef2',  icon: '📋', name: 'Chef' },
    { key: 'review', icon: '👤', name: 'Revue' },
    { key: 'dev',    icon: '💻', name: 'Développeur' },
    { key: 'chef3',  icon: '📋', name: 'Chef' },
    { key: 'done',   icon: '✅', name: 'Livré' },
  ];

  const activeMap = {
    new: 0, pending_chef: 1,
    assigned_designer: 2, in_progress_designer: 2,
    review_chef_design: 3,
    review_client: 4, rejected_client: 4, approved_client: 4,
    assigned_dev: 5, in_progress_dev: 5,
    review_chef_dev: 6,
    delivered: 7, completed: 7,
  };

  const activeIdx = activeMap[currentStatus] ?? 0;
  const colors = [
    'var(--accent-client)', 'var(--accent-chef)', 'var(--accent-designer)',
    'var(--accent-chef)',   'var(--accent-client)','var(--accent-dev)',
    'var(--accent-chef)',   'var(--success)',
  ];

  return (
    <div className="pipeline">
      <div className="pipeline-label">Workflow de progression</div>
      <div className="pipeline-steps">
        {steps.map((s, i) => {
          const cls = i < activeIdx ? 'done' : i === activeIdx ? 'active' : '';
          const borderColor = i <= activeIdx ? colors[i] : 'var(--border)';
          return (
            <React.Fragment key={s.key + i}>
              <div className="pipeline-step">
                <div className={`pipeline-dot ${cls}`} style={{ borderColor }}>{s.icon}</div>
                <div className="pipeline-name">{s.name}</div>
              </div>
              {i < steps.length - 1 && <div className={`pipeline-line ${i < activeIdx ? 'done' : ''}`}></div>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const LogHtml = ({ log }) => {
  if (!log || !log.length) return null;
  return (
    <div className="task-timeline">
      {log.slice(-3).reverse().map((l, i) => (
        <div className="timeline-item" key={i}>
          <span className="timeline-dot"></span>
          <span>{l.time} — {l.msg}</span>
        </div>
      ))}
    </div>
  );
};

const TaskCard = ({ t, fetchTasks, borderClass, showPipeline, children }) => {
  return (
    <div className={`task-card border-${borderClass || 'chef'}`}>
      <div className="task-header">
        <div className="task-title">{t.title}</div>
        {badge(t.status)}
      </div>
      <div className="task-desc">{t.description}</div>
      <div className="task-meta">
        <span className="task-meta-item">🎯 {PRIORITIES[t.priority]}</span>
        <span className="task-meta-item">📅 {new Date(t.createdAt).toLocaleDateString('fr-FR')}</span>
        <span className="task-meta-item">👤 {t.clientEmail}</span>
        {t.designerNote && <span className="task-meta-item" style={{ color: 'var(--accent-designer)' }}>🎨 {t.designerNote}</span>}
        {t.devNote && <span className="task-meta-item" style={{ color: 'var(--accent-dev)' }}>💻 {t.devNote}</span>}
      </div>
      <FilesSection files={t.designerFiles} label="🎨 Fichiers Designer" color="var(--accent-designer)" />
      <FilesSection files={t.devFiles}      label="💻 Fichiers Développeur" color="var(--accent-dev)" />
      <FilesSection files={t.chefFiles}     label="📋 Fichiers Chef" color="var(--accent-chef)" />
      {showPipeline && <PipelineHtml currentStatus={t.status} />}
      {children}
      <LogHtml log={t.log} />
    </div>
  );
};

export default TaskCard;
