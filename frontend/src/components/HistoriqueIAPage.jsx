import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import NotificationPanel from './NotificationPanel';

const API_URL = 'http://localhost:5000';
const toAbs = (url) => (url && url.startsWith('/') ? `${API_URL}${url}` : url);

const statusColor = (s) => ({ generating: '#f59e0b', completed: '#10b981', failed: '#ef4444' }[s] || '#6b7280');
const statusText  = (s) => ({ generating: 'En cours…', completed: 'Terminé', failed: 'Échoué' }[s] || 'Inconnu');

export default function HistoriqueIAPage() {
  const [wireframes, setWireframes] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [viewingId, setViewingId]   = useState(null);
  const [savedIds, setSavedIds]     = useState(new Set());
  const [savingId, setSavingId]     = useState(null);

  const fetchWireframes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/automation/automated`);
      if (res.data.success) setWireframes(res.data.wireframes || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const saveToMyWireframes = async (wf) => {
    setSavingId(wf._id);
    try {
      await axios.post(`${API_URL}/api/wireframes`, {
        name: wf.name,
        description: wf.description || '',
        elements: wf.elements || [],
        imageUrl: wf.imageUrl || null,
      });
      setSavedIds(prev => new Set([...prev, wf._id]));
    } catch (err) { console.error(err); alert('Erreur lors de la sauvegarde.'); }
    finally { setSavingId(null); }
  };

  useEffect(() => { fetchWireframes(); }, []);

  return (
    <div id="app" style={{ display: 'flex' }}>
      <Sidebar activeSection="designer-history" />
      <div className="main-with-sidebar">
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="page-title">📚 Historique <span className="color-designer">IA</span></div>
            <div className="page-subtitle">Wireframes générés automatiquement via n8n</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-action btn-start" onClick={fetchWireframes}>🔄 Actualiser</button>
            <NotificationPanel role="designer" />
          </div>
        </div>

        <div className="my-wireframes-panel">
          {loading && <p className="wf-loading">Chargement…</p>}
          {!loading && wireframes.length === 0 && (
            <div className="empty-state" style={{ padding: '48px 0' }}>
              <div className="empty-icon">📚</div>
              <div className="empty-text">Aucun wireframe généré automatiquement.</div>
            </div>
          )}
          {!loading && wireframes.map(wf => {
            const isViewing = viewingId === wf._id;
            const isSaved   = savedIds.has(wf._id);
            const isSaving  = savingId === wf._id;
            const isPng     = wf.imageUrl && wf.imageUrl.endsWith('.png');
            const hasElems  = wf.elements?.length > 0;

            return (
              <div key={wf._id} className="wf-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="wf-item-info" style={{ flex: 1 }}>
                    <div className="wf-item-name">{wf.name}</div>
                    {wf.description && <div className="wf-item-desc">{wf.description}</div>}
                    <div className="wf-item-meta">
                      {new Date(wf.createdAt).toLocaleDateString('fr-FR')}
                      <span style={{
                        backgroundColor: statusColor(wf.status), color: '#fff',
                        padding: '2px 8px', borderRadius: 8, marginLeft: 8, fontSize: 11
                      }}>
                        {statusText(wf.status)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {wf.status === 'completed' && (
                      <>
                        <button
                          className="wf-view-btn"
                          disabled={!isPng && !hasElems}
                          onClick={() => setViewingId(isViewing ? null : wf._id)}
                        >
                          {isViewing ? '🙈 Masquer' : '👁️ Voir'}
                        </button>
                        <button
                          className="wf-view-btn"
                          disabled={isSaved || isSaving}
                          onClick={() => saveToMyWireframes(wf)}
                        >
                          {isSaving ? '⏳' : isSaved ? '✅ Sauvegardé' : '💾 Sauvegarder'}
                        </button>
                      </>
                    )}
                    {wf.status === 'generating' && (
                      <button className="wf-view-btn" onClick={fetchWireframes}>🔄 Actualiser</button>
                    )}
                  </div>
                </div>

                {isViewing && wf.status === 'completed' && (
                  <div className="wf-preview-inline">
                    {isPng ? (
                      <img
                        src={`${toAbs(wf.imageUrl)}?v=${wf.updatedAt || ''}`}
                        alt={wf.name}
                        className="wf-preview-img"
                      />
                    ) : hasElems ? (
                      <div className="wf-no-preview">Aperçu SVG — ouvrir dans Génération IA</div>
                    ) : (
                      <div className="wf-no-preview">Aperçu non disponible</div>
                    )}
                    {wf.imageUrl && (
                      <a
                        href={toAbs(wf.imageUrl)}
                        download={`wireframe-${wf._id}.${isPng ? 'png' : 'svg'}`}
                        className="wf-download-btn"
                        onClick={e => e.stopPropagation()}
                      >
                        ⬇️ Télécharger
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
