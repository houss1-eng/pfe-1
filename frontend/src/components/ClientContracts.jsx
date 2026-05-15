import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ClientContracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeContract, setActiveContract] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [file, setFile] = useState(null);

  const fetchContracts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/contracts');
      setContracts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleOpenModal = (c) => {
    setActiveContract(c);
    setShowModal(true);
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!file) return alert('Veuillez sélectionner un fichier PDF.');
    
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      
      // 1. Upload signed file
      await axios.post(`http://localhost:5000/api/contracts/${activeContract._id}/upload-signed`, fd);
      
      // 2. Return to chef (update status)
      await axios.post(`http://localhost:5000/api/contracts/${activeContract._id}/return`);
      
      alert('Contrat signé envoyé avec succès !');
      setShowModal(false);
      setFile(null);
      fetchContracts();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'envoi.');
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) return <div className="loading">Chargement des contrats...</div>;

  return (
    <div className="client-contracts-view">
      <div className="page-header">
        <div>
          <div className="page-title">Mes <span className="color-client">Contrats & Devis</span></div>
          <div className="page-subtitle">Signez et renvoyez vos contrats ici.</div>
        </div>
      </div>

      {!contracts.length ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-icon">📄</div>
          <div className="empty-text">Aucun contrat ou document n'a été partagé pour le moment.</div>
        </div>
      ) : (
        <div className="contracts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20, marginTop: 24 }}>
          {contracts.map(c => (
            <div key={c._id} className="contract-card" style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--accent-client-bg)', color: 'var(--accent-client)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20
                }}>
                  📂
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Réf: {c.ref} • {new Date(c.createdAt).toLocaleDateString('fr-FR')}</div>
                </div>
                <div className={`status-badge ${c.status}`} style={{
                  fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6,
                  background: c.status === 'sent' ? '#fef3c7' : (c.status === 'signed' ? '#d1fae5' : '#e0f2fe'),
                  color: c.status === 'sent' ? '#92400e' : (c.status === 'signed' ? '#065f46' : '#075985'),
                  textTransform: 'uppercase'
                }}>
                  {c.status === 'sent' ? 'À signer' : (c.status === 'signed' ? 'Signé' : 'Terminé')}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>PDF</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.ref}.pdf</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a 
                    href={`http://localhost:5000/uploads/contracts/${c.pdfFilename}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn-download"
                    style={{
                      padding: '6px 12px',
                      background: 'var(--accent-client)',
                      color: '#fff',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    Télécharger
                  </a>
                  
                  {c.status === 'sent' && (
                    <button 
                      onClick={() => handleOpenModal(c)}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--text)',
                        color: 'var(--surface)',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Répondre
                    </button>
                  )}
                </div>
              </div>
              
              {c.status === 'signed' && (
                <div style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  ✓ Contrat signé renvoyé le {new Date(c.returnedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Réponse */}
      {showModal && (
        <div className="modal-overlay open" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-title">Renvoyer le contrat signé</div>
            <div className="modal-subtitle" style={{ marginBottom: 20 }}>
              Veuillez uploader la version PDF signée de <strong>{activeContract?.title}</strong>.
            </div>
            
            <form onSubmit={handleSendResponse}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="field-label">Fichier PDF signé</label>
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="field-input" 
                  onChange={e => setFile(e.target.files[0])}
                  required 
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-confirm" disabled={uploadLoading} style={{ background: 'var(--accent-client)', color: '#fff' }}>
                  {uploadLoading ? 'Envoi...' : 'Envoyer au chef'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
