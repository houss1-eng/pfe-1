import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const ROLE_COLORS = {
  chef:      '#f59e0b',
  client:    '#f59e0b',
  designer:  '#ec4899',
  developer: '#10b981',
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

export default function NotificationPanel({ role }) {
  const [open, setOpen]       = useState(false);
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);
  const panelRef              = useRef(null);
  const color                 = ROLE_COLORS[role] || '#6366f1';

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get(`/api/notifications?role=${role}`);
      setNotifs(res.data);
    } catch (err) {
      console.error('Notifications fetch error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  const markAllRead = async () => {
    try {
      await api.patch(`/api/notifications/read?role=${role}`);
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markOne = async (id) => {
    try {
      await api.patch('/api/notifications/read', { ids: [id] });
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open) fetchNotifs();
  };

  return (
    <div ref={panelRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* ── Bouton cloche ── */}
      <button
        onClick={handleOpen}
        title="Notifications"
        style={{
          position: 'relative',
          background: open ? `${color}18` : 'var(--surface)',
          border: `1.5px solid ${open ? color : 'var(--border)'}`,
          borderRadius: 10,
          width: 42,
          height: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 18,
          transition: 'all .18s',
          flexShrink: 0,
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            top: -6,
            right: -6,
            background: '#ef4444',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            borderRadius: '50%',
            minWidth: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            lineHeight: 1,
            boxShadow: '0 0 0 2px var(--bg)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* ── Panneau dropdown ── */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 50,
          right: 0,
          width: 340,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,.25)',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px 12px',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
              🔔 Notifications {unread > 0 && <span style={{ color: color }}>({unread})</span>}
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: color,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '2px 6px',
                }}
              >
                Tout lire
              </button>
            )}
          </div>

          {/* Liste */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading && (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                Chargement…
              </div>
            )}
            {!loading && error && (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>⚠️</div>
                <div style={{ color: '#ef4444', fontSize: 13 }}>Impossible de charger les notifications</div>
                <button onClick={fetchNotifs} style={{ marginTop: 8, fontSize: 12, color: color, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Réessayer</button>
              </div>
            )}
            {!loading && !error && notifs.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>Aucune notification</div>
              </div>
            )}
            {!loading && !error && notifs.map(n => (
              <div
                key={n._id}
                onClick={() => !n.read && markOne(n._id)}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: n.read ? 'transparent' : `${color}0d`,
                  cursor: n.read ? 'default' : 'pointer',
                  transition: 'background .15s',
                }}
              >
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: n.read ? 'transparent' : color,
                  marginTop: 5,
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
