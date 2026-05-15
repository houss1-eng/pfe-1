import { useState, useEffect, useCallback } from 'react';
import { getContracts, markContractCompleted, getContractUrl } from '../services/api';

const STATUS_META = {
  sent:      { label: 'Envoyé — en attente',     color: '#D4890A', bg: 'rgba(212,137,10,.1)'   },
  signed:    { label: 'Signé — retourné',         color: '#009E7E', bg: 'rgba(0,158,126,.1)'    },
  completed: { label: 'Complété',                 color: '#1A3FFF', bg: 'rgba(26,63,255,.1)'    },
};

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ChefContractSuivi() {
  const [contracts, setContracts] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [completing, setCompleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getContracts();
      setContracts(data);
    } catch {
      setError('Impossible de charger les contrats.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async (id) => {
    setCompleting(id);
    try {
      const { contract } = await markContractCompleted(id);
      setContracts(prev => prev.map(c => c._id === id ? contract : c));
    } catch {
      alert('Erreur lors de la mise à jour.');
    } finally {
      setCompleting(null);
    }
  };

  if (loading) return <div className="cg-suivi-empty">Chargement…</div>;
  if (error)   return <div className="cg-suivi-empty" style={{ color: 'var(--cg-red)' }}>{error}</div>;

  return (
    <div>
      <div className="cg-section-hdr">
        <div className="cg-section-title">Suivi des contrats envoyés</div>
        <div className="cg-section-desc">Statut de chaque contrat transmis au client.</div>
      </div>

      {contracts.length === 0 ? (
        <div className="cg-suivi-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--cg-ink4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p>Aucun contrat envoyé pour l'instant.</p>
        </div>
      ) : (
        contracts.map(c => {
          const meta = STATUS_META[c.status] || STATUS_META.sent;
          return (
            <div key={c._id} className="cg-card" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--cg-ink)', marginBottom: 2 }}>
                    {c.ref}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--cg-ink3)' }}>{c.title}</div>
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 700,
                  color: meta.color, background: meta.bg,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
                  {meta.label}
                </span>
              </div>

              {/* Meta row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[
                  ['Client', `${c.clientName} (${c.clientEmail})`],
                  ['Envoyé le', fmtDate(c.sentAt)],
                  ['Signé le',  fmtDate(c.signedAt)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10.5, color: 'var(--cg-ink4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--cg-ink2)', fontWeight: 500, wordBreak: 'break-word' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {c.pdfFilename && (
                  <a
                    href={getContractUrl(c.pdfFilename)}
                    target="_blank"
                    rel="noreferrer"
                    className="cg-btn cg-btn-ghost cg-btn-sm"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Contrat original
                  </a>
                )}
                {c.signedFilename && (
                  <a
                    href={getContractUrl(c.signedFilename)}
                    target="_blank"
                    rel="noreferrer"
                    className="cg-btn cg-btn-sm"
                    style={{ background: 'rgba(0,158,126,.12)', color: 'var(--cg-teal)', border: '1px solid rgba(0,158,126,.25)' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Contrat signé
                  </a>
                )}
                {c.status === 'signed' && (
                  <button
                    className="cg-btn cg-btn-primary cg-btn-sm"
                    disabled={completing === c._id}
                    onClick={() => handleComplete(c._id)}
                  >
                    {completing === c._id ? 'En cours…' : '✓ Marquer complété'}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      <button className="cg-btn cg-btn-ghost cg-btn-sm" onClick={load} style={{ marginTop: 4 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        Actualiser
      </button>
    </div>
  );
}
