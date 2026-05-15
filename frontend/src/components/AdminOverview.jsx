import { useMemo } from 'react';

const STATUS_PROGRESS = {
  pending_chef: 5,
  assigned_designer: 15,
  in_progress_designer: 30,
  review_chef_design: 42,
  review_client: 52,
  rejected_client: 38,
  approved_client: 55,
  assigned_dev: 65,
  in_progress_dev: 78,
  review_chef_dev: 88,
  delivered: 95,
  completed: 100,
};

const STATUS_LABELS = {
  pending_chef: 'En attente',
  assigned_designer: 'Design assigné',
  in_progress_designer: 'En cours (Design)',
  review_chef_design: 'Révision Design',
  review_client: 'Révision Client',
  rejected_client: 'Rejeté',
  approved_client: 'Approuvé',
  assigned_dev: 'Dev assigné',
  in_progress_dev: 'En cours (Dev)',
  review_chef_dev: 'Révision Dev',
  delivered: 'Livré',
  completed: 'Terminé',
};

const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
const PRIORITY_LABELS = { low: 'Faible', medium: 'Moyen', high: 'Élevé' };


function getStatusColor(status) {
  if (status === 'completed')       return '#10b981';
  if (status === 'delivered')       return '#6366f1';
  if (status === 'rejected_client') return '#ef4444';
  if (status === 'approved_client') return '#22c55e';
  if (status?.includes('review'))   return '#f59e0b';
  if (status?.includes('in_progress')) return '#ec4899';
  if (status?.includes('assigned')) return '#6366f1';
  return '#6b7280';
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}


function estimateDelivery(tasks) {
  const active = tasks.filter(t => !['completed', 'delivered'].includes(t.status));
  if (!active.length) return 'Tous livrés';
  const days = Math.min(active.length * 10, 120);
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function MetricCard({ label, value, sub, color, progress, icon }) {
  const R = 24, circ = 2 * Math.PI * R;
  return (
    <div className="ov-metric-card" style={{ borderTopColor: color }}>
      {progress !== undefined ? (
        <div className="ov-metric-ring">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={R} fill="none" stroke="var(--border)" strokeWidth="5" />
            <circle
              cx="32" cy="32" r={R} fill="none" stroke={color} strokeWidth="5"
              strokeDasharray={`${(progress / 100) * circ} ${circ}`}
              strokeLinecap="round" transform="rotate(-90 32 32)"
              style={{ transition: 'stroke-dasharray .6s ease' }}
            />
          </svg>
          <span className="ov-ring-pct" style={{ color }}>{progress}%</span>
        </div>
      ) : (
        <>
          <div className="ov-metric-icon" style={{ color }}>{icon}</div>
          <div className="ov-metric-value" style={{ color }}>{value}</div>
        </>
      )}
      <div className="ov-metric-label">{label}</div>
      <div className="ov-metric-sub">{sub}</div>
    </div>
  );
}

export default function AdminOverview({ tasks = [] }) {




  return (
    <div className="admin-overview">




    </div>
  );
}
