import { useMemo, useState } from 'react';

const STATUS_PROGRESS = {
  pending_chef: 5,
  assigned_designer: 15, in_progress_designer: 30,
  review_chef_design: 42,
  review_client: 52, rejected_client: 38, approved_client: 55,
  assigned_dev: 65, in_progress_dev: 78, review_chef_dev: 88,
  delivered: 95, completed: 100,
};

const STATUS_LABELS = {
  pending_chef:         'Nouvelle demande',
  assigned_designer:    'Design assigné',
  in_progress_designer: 'Design en cours',
  review_chef_design:   'Révision Design',
  review_client:        'Validation client',
  rejected_client:      'Révision demandée',
  approved_client:      'Approuvé',
  assigned_dev:         'Dev assigné',
  in_progress_dev:      'Dev en cours',
  review_chef_dev:      'Révision Dev',
  delivered:            'Livré',
  completed:            'Terminé',
};

const PIPE_COLS = [
  { id: 'inbox',      label: 'Nouvelles demandes',  color: '#6366f1', statuses: ['pending_chef'] },
  { id: 'design',     label: 'Chez le designer',     color: '#ec4899', statuses: ['assigned_designer','in_progress_designer','review_chef_design'] },
  { id: 'validation', label: 'Validation client',    color: '#f59e0b', statuses: ['review_client','rejected_client','approved_client'], highlight: true },
  { id: 'dev',        label: 'En développement',     color: '#10b981', statuses: ['assigned_dev','in_progress_dev','review_chef_dev'] },
  { id: 'done',       label: 'Livrés / Terminés',    color: '#22c55e', statuses: ['delivered','completed'] },
];

const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
const PRIORITY_LABELS = { low: 'Faible', medium: 'Moyen', high: 'Urgent' };

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function statusChip(status) {
  const color =
    status === 'completed'        ? '#10b981' :
    status === 'delivered'        ? '#6366f1' :
    status === 'rejected_client'  ? '#ef4444' :
    status === 'approved_client'  ? '#22c55e' :
    status?.includes('review')    ? '#f59e0b' :
    status?.includes('in_progress') ? '#ec4899' :
    status?.includes('assigned')  ? '#6366f1' : '#6b7280';
  return { color, label: STATUS_LABELS[status] || status };
}

/* ═══════════════════════════════════════════════ */
export default function ChefDashboard({ tasks = [] }) {
  const [tableFilter, setTableFilter] = useState('all');

  /* ── KPI stats ── */
  const stats = useMemo(() => ({
    clients:    [...new Set(tasks.map(t => t.clientEmail))].length,
    active:     tasks.filter(t => !['completed','delivered'].includes(t.status)).length,
    designPend: tasks.filter(t => t.status === 'review_chef_design').length,
    validation: tasks.filter(t => ['review_client','delivered'].includes(t.status)).length,
    delivered:  tasks.filter(t => ['completed','delivered'].includes(t.status)).length,
  }), [tasks]);

  /* ── Pipeline ── */
  const pipeline = useMemo(() => (
    PIPE_COLS.map(col => ({ ...col, tasks: tasks.filter(t => col.statuses.includes(t.status)) }))
  ), [tasks]);

  /* ── Table ── */
  const tableTasks = useMemo(() => {
    if (tableFilter === 'active')     return tasks.filter(t => !['completed','delivered'].includes(t.status));
    if (tableFilter === 'validation') return tasks.filter(t => ['review_client','delivered'].includes(t.status));
    if (tableFilter === 'done')       return tasks.filter(t => ['completed','delivered'].includes(t.status));
    return tasks;
  }, [tasks, tableFilter]);


  /* ══════════════ RENDER ══════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── 1. KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
        {[
          { label: 'Clients actifs',        value: stats.clients,    color: '#6366f1', icon: '👥', sub: `${tasks.length} projets total` },
          { label: 'Projets en cours',       value: stats.active,     color: '#10b981', icon: '📁', sub: 'En production' },
          { label: 'Maquettes à traiter',    value: stats.designPend, color: '#f59e0b', icon: '🖼️', sub: 'Révision en attente' },
          { label: 'Validations clients',    value: stats.validation, color: '#ef4444', icon: '⚡', sub: 'En attente de réponse' },
          { label: 'Livrés',                 value: stats.delivered,  color: '#22c55e', icon: '✅', sub: 'Total terminés' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
            padding: '20px 22px', borderTopWidth: 3, borderTopStyle: 'solid', borderTopColor: s.color,
            transition: '.25s', boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: s.color, letterSpacing: -1, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, fontWeight: 500 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── 2. PIPELINE KANBAN ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
          <div>
            <div className="section-title" style={{ marginBottom: 2 }}>Pipeline — Tous les projets</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {tasks.length} projet{tasks.length !== 1 ? 's' : ''} répartis sur 5 étapes
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {pipeline.map(col => (
            <div key={col.id} style={{
              background: col.highlight ? `${col.color}08` : 'var(--surface2)',
              border: `1px solid ${col.highlight ? `${col.color}30` : 'var(--border)'}`,
              borderRadius: 14, padding: 12,
            }}>
              {/* Column header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{col.label}</span>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                  background: col.highlight ? `${col.color}20` : 'var(--border)',
                  color: col.highlight ? col.color : 'var(--muted)',
                }}>{col.tasks.length}</span>
              </div>

              {/* Empty */}
              {col.tasks.length === 0 && (
                <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', padding: '14px 0' }}>—</div>
              )}

              {/* Task cards */}
              {col.tasks.map(t => {
                const pct = STATUS_PROGRESS[t.status] || 0;
                const isDev = ['assigned_dev','in_progress_dev','review_chef_dev'].includes(t.status);
                return (
                  <div key={t._id} style={{
                    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
                    padding: '12px 14px', marginBottom: 10, cursor: 'default',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 5, lineHeight: 1.4 }}>
                      {t.title.length > 30 ? t.title.slice(0, 30) + '…' : t.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: isDev ? 8 : 0 }}>
                      📧 {(t.clientEmail || '').split('@')[0]}
                    </div>
                    {isDev && (
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Progression</span>
                          <span style={{ fontSize: 11, color: col.color, fontWeight: 700 }}>{pct}%</span>
                        </div>
                        <div style={{ height: 5, background: 'var(--border)', borderRadius: 4 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: col.color, borderRadius: 4 }} />
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                        background: `${PRIORITY_COLORS[t.priority]}18`, color: PRIORITY_COLORS[t.priority],
                      }}>{PRIORITY_LABELS[t.priority]}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{fmtDate(t.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. TABLE + RIGHT PANEL ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>

        {/* LEFT: Project table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {/* Table header + filters */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
              Tous les clients &amp; projets
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                ['all',        'Tous'],
                ['active',     'Actifs'],
                ['validation', 'En attente'],
                ['done',       'Livrés'],
              ].map(([val, lbl]) => (
                <button key={val} onClick={() => setTableFilter(val)} style={{
                  fontSize: 11.5, fontWeight: 500, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                  border: tableFilter === val ? 'none' : '1px solid var(--border)',
                  background: tableFilter === val ? '#6366f118' : 'transparent',
                  color: tableFilter === val ? '#6366f1' : 'var(--muted)',
                  fontFamily: 'inherit', transition: '.12s',
                }}>{lbl}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Client', 'Projet', 'Statut', 'Progression', 'Priorité'].map(h => (
                    <th key={h} style={{
                      fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: .8,
                      textTransform: 'uppercase', padding: '14px 20px', textAlign: 'left',
                      background: 'var(--surface2)', borderBottom: '1px solid var(--border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableTasks.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                      Aucun projet.
                    </td>
                  </tr>
                )}
                {tableTasks.map(t => {
                  const chip = statusChip(t.status);
                  const pct  = STATUS_PROGRESS[t.status] || 0;
                  const init = (t.clientEmail || '').split('@')[0].slice(0, 2).toUpperCase();
                  return (
                    <tr key={t._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: '#6366f122', color: '#6366f1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700,
                          }}>{init}</div>
                          <span style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 600 }}>
                            {(t.clientEmail || '').split('@')[0]}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{t.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{fmtDate(t.createdAt)}</div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5,
                          fontWeight: 700, padding: '5px 12px', borderRadius: 20, whiteSpace: 'nowrap',
                          background: `${chip.color}18`, color: chip.color,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: chip.color, flexShrink: 0 }} />
                          {chip.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: chip.color, borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--muted)', width: 35, textAlign: 'right', fontWeight: 600 }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: PRIORITY_COLORS[t.priority] }}>
                          ● {PRIORITY_LABELS[t.priority]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
