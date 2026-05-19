import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import NotificationPanel from './NotificationPanel';

const API_URL = 'http://localhost:5000';
const toAbs = (url) => (url && url.startsWith('/') ? `${API_URL}${url}` : url);

export default function MesWireframesPage() {
  const [myWireframes, setMyWireframes] = useState([]);
  const [wfLoading, setWfLoading]       = useState(false);
  const [viewingWf, setViewingWf]       = useState(null);
  const [deletingId, setDeletingId]     = useState(null);

  const fetchMyWireframes = async () => {
    setWfLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/wireframes`);
      setMyWireframes(res.data.wireframes || []);
    } catch (err) { console.error(err); }
    finally { setWfLoading(false); }
  };

  const deleteWireframe = async (id) => {
    if (!window.confirm('Supprimer ce wireframe ?')) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/api/wireframes/${id}`);
      setMyWireframes(prev => prev.filter(wf => wf._id !== id));
      if (viewingWf === id) setViewingWf(null);
    } catch (err) { console.error(err); alert('Erreur lors de la suppression.'); }
    finally { setDeletingId(null); }
  };

  useEffect(() => { fetchMyWireframes(); }, []);

  return (
    <div id="app" style={{ display: 'flex' }}>
      <Sidebar activeSection="designer-wireframes" />
      <div className="main-with-sidebar">
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="page-title">📁 Mes <span className="color-designer">Wireframes</span></div>
            <div className="page-subtitle">Toutes vos créations sauvegardées</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-action btn-start" onClick={fetchMyWireframes}>🔄 Actualiser</button>
            <NotificationPanel role="designer" />
          </div>
        </div>

        <div className="my-wireframes-panel">
          {wfLoading && <p className="wf-loading">Chargement…</p>}
          {!wfLoading && myWireframes.length === 0 && (
            <div className="empty-state" style={{ padding: '48px 0' }}>
              <div className="empty-icon">🖼️</div>
              <div className="empty-text">Aucun wireframe sauvegardé.</div>
            </div>
          )}
          {!wfLoading && myWireframes.map(wf => (
            <div key={wf._id} className="wf-item">
              <div className="wf-item-info">
                <div className="wf-item-name">{wf.name}</div>
                {wf.description && <div className="wf-item-desc">{wf.description}</div>}
                <div className="wf-item-meta">
                  {new Date(wf.createdAt).toLocaleDateString('fr-FR')}
                  {wf.elements?.length > 0 && (
                    <span> · {wf.elements.length} élément{wf.elements.length > 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="wf-view-btn"
                  onClick={e => { e.stopPropagation(); setViewingWf(viewingWf === wf._id ? null : wf._id); }}
                >
                  {viewingWf === wf._id ? '🙈 Masquer' : '👁️ Voir'}
                </button>
                <button
                  className="wf-view-btn"
                  disabled={deletingId === wf._id}
                  onClick={e => { e.stopPropagation(); deleteWireframe(wf._id); }}
                  style={{ color: '#ef4444', borderColor: '#ef4444' }}
                >
                  {deletingId === wf._id ? '⏳' : '🗑️ Supprimer'}
                </button>
              </div>
              {viewingWf === wf._id && (
                <div className="wf-preview-inline">
                  {wf.imageUrl ? (
                    <img src={toAbs(wf.imageUrl)} alt={wf.name} className="wf-preview-img" />
                  ) : (
                    <div className="wf-no-preview">Aperçu non disponible</div>
                  )}
                  {wf.imageUrl && (
                    <a
                      href={toAbs(wf.imageUrl)}
                      download={`wireframe-${wf._id}`}
                      className="wf-download-btn"
                      onClick={e => e.stopPropagation()}
                    >
                      ⬇️ Télécharger
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
