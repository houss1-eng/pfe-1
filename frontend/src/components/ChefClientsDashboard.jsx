import { useMemo, useState } from 'react';

export default function ChefClientsDashboard({ tasks = [], users = [] }) {
  const [search, setSearch] = useState('');
  const clients = useMemo(() => {
    const clientUsers = users.filter(u => u.role === 'client');
    return clientUsers.map(client => {
      const clientTasks = tasks.filter(t => t.clientEmail === client.email);
      const active = clientTasks.filter(t => !['completed', 'delivered'].includes(t.status)).length;
      const completed = clientTasks.filter(t => ['completed', 'delivered'].includes(t.status)).length;
      const lastTask = [...clientTasks].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

      return {
        ...client,
        taskCount: clientTasks.length,
        activeCount: active,
        completedCount: completed,
        lastActivity: lastTask ? lastTask.updatedAt : client.createdAt,
      };
    }).filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.email.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => b.activeCount - a.activeCount);
  }, [tasks, users, search]);

  return (
    <div className="chef-clients-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Aperçu par Client</div>
        <div style={{ position: 'relative', width: 260 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 32px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text)', fontSize: 13, outline: 'none'
            }}
          />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>✕</button>}
        </div>
      </div>
      <div className="clients-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24 }}>
        {clients.map(client => (
          <div key={client._id} className="client-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            transition: 'transform .2s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'var(--accent-client-bg)', color: 'var(--accent-client)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700
              }}>
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.3px' }}>
                  {client.name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {client.email}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <div style={{ flex: 1, background: 'var(--surface2)', padding: '12px 14px', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#6366f1' }}>{client.activeCount}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Actifs</div>
              </div>
              <div style={{ flex: 1, background: 'var(--surface2)', padding: '12px 14px', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>{client.completedCount}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Terminés</div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Dernière activité : {new Date(client.lastActivity).toLocaleDateString('fr-FR')}
              </div>
              <button style={{
                background: 'none', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 12, fontWeight: 600,
                padding: '4px 10px', borderRadius: 6, cursor: 'pointer'
              }}>
                Détails
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
