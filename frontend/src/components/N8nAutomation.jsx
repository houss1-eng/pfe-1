import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './N8nAutomation.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const toAbsoluteUrl = (url) => (url && url.startsWith('/') ? `${API_URL}${url}` : url);

// Rendu inline SVG des éléments wireframe
const WireframePreview = ({ elements, name }) => {
  if (!elements || elements.length === 0) return null;
  const W = 800;
  const H = 520;
  const typeTextColor = { nav: '#fff', button: '#fff', input: '#374151', text: '#e2e8f0', container: '#94a3b8', image: '#64748b' };
  const escape = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return (
    <div className="wireframe-svg-preview">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ borderRadius: 12, border: '2px solid #222530', background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 100%)', display: 'block' }}
      >
        <text x="10" y="16" fontSize="10" fill="#475569" fontStyle="italic" fontFamily="Inter,sans-serif">
          {escape(name ? name.substring(0, 90) : 'Wireframe')}
        </text>
        {elements.map((el, i) => {
          const x = Math.min(Math.max(el.x || 0, 0), W - 10);
          const y = Math.min(Math.max(el.y || 0, 0), H - 10);
          const w = Math.min(el.width || 120, W - x);
          const h = Math.min(el.height || 36, H - y);
          const cx = x + w / 2;
          const cy = y + h / 2;
          const fs = h > 30 ? 13 : 10;
          const label = escape(el.text || el.type || '');
          const trunc = label.length > 34 ? label.substring(0, 32) + '…' : label;
          const fill = el.color || '#4F46E5';
          const tc = typeTextColor[el.type] || '#e2e8f0';
          const rx = el.type === 'button' ? 8 : el.type === 'input' ? 6 : el.type === 'nav' ? 4 : 8;
          if (el.type === 'text') {
            return <text key={i} x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={fs} fill={tc} fontFamily="Inter,sans-serif" fontWeight="500">{trunc}</text>;
          }
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} opacity={0.93}
                stroke={el.type === 'input' ? '#4F46E5' : 'none'} strokeWidth={1.5} />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                fontSize={fs} fill={tc} fontFamily="Inter,sans-serif"
                fontWeight={el.type === 'button' ? '600' : '400'}>{trunc}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const N8nAutomation = () => {
  const [prompt, setPrompt] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState('generate');
  const [generatedWireframe, setGeneratedWireframe] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/api/automation/templates');
      if (response.data.success) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des templates:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Veuillez entrer une description pour la génération');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('generating');
    setGeneratedWireframe(null);

    try {
      const response = await api.post('/api/n8n/generate', {
        prompt: prompt.trim(),
        projectName: projectName.trim() || `Wireframe généré - ${new Date().toLocaleDateString()}`,
        description: description.trim()
      });

      if (response.data.success) {
        // Garder status 'generating' jusqu'au polling
        setGeneratedWireframe({ ...response.data.wireframe, status: 'generating' });
        setGenerationStatus('generating');
        setPrompt('');
        setProjectName('');
        setDescription('');
        // Démarrer le polling pour vérifier le statut
        if (response.data.wireframe && response.data.wireframe._id) {
          startPolling(response.data.wireframe._id);
        }
      } else {
        setGenerationStatus('failed');
        alert('La génération a échoué: ' + response.data.message);
      }
    } catch (error) {
      setGenerationStatus('failed');
      console.error('Erreur lors de la génération:', error);
      alert('Erreur lors de la génération: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const startPolling = (wireframeId) => {
    if (pollingInterval) clearInterval(pollingInterval);
    
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/api/n8n/status/${wireframeId}`);
        if (response.data.success && response.data.wireframe) {
          setGeneratedWireframe(response.data.wireframe);
          
          // Mettre à jour le statut global
          if (response.data.wireframe.status === 'completed') {
            setGenerationStatus('completed');
          }

          // Arrêter le polling si terminé ou échoué
          if (response.data.wireframe.status === 'completed' || response.data.wireframe.status === 'failed') {
            clearInterval(interval);
            setPollingInterval(null);
          }
        }
      } catch (error) {
        console.error('Erreur polling:', error);
        clearInterval(interval);
        setPollingInterval(null);
      }
    }, 3000); // Vérifier toutes les 3 secondes
    
    setPollingInterval(interval);
    
    // Arrêter après 2 minutes maximum
    setTimeout(() => {
      if (interval) clearInterval(interval);
      setPollingInterval(null);
    }, 120000);
  };

  const useTemplate = (template) => {
    setPrompt(template.prompt);
    setProjectName(template.name);
    setDescription(template.description);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'generating': return '#f59e0b';
      case 'completed': return '#10b981';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'generating': return 'En cours...';
      case 'completed': return 'Terminé';
      case 'failed': return 'Échoué';
      default: return 'Inconnu';
    }
  };

  return (
    <div className="n8n-automation">
      <div className="automation-header">
        <h1>🤖 Génération Automatisée de Wireframes</h1>
        <p>Utilisez l'IA pour créer des wireframes automatiquement via n8n</p>
      </div>

      <div className="automation-tabs">
        <button 
          className={`tab-button ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          🎨 Générer
        </button>
        <button 
          className={`tab-button ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          📋 Templates
        </button>
      </div>

      {activeTab === 'generate' && (
        <div className="tab-content">
          <div className="generation-form">
            <div className="form-group">
              <label className="form-label">Description du wireframe *</label>
              <textarea
                className="form-textarea"
                placeholder="Décrivez le wireframe que vous souhaitez générer... Ex: Crée un dashboard admin avec sidebar, cartes de statistiques et tableau de données"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                disabled={isGenerating}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nom du projet</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nom optionnel pour votre wireframe"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description détaillée</label>
              <textarea
                className="form-textarea"
                placeholder="Description optionnelle avec plus de détails..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={isGenerating}
              />
            </div>

            <button
              className="generate-button"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <span className="spinner"></span>
                  Génération en cours...
                </>
              ) : (
                <>
                  🚀 Générer le Wireframe
                </>
              )}
            </button>

            {generationStatus && (
              <div className={`status-message ${generationStatus}`}>
                {generationStatus === 'completed' && (
                  <>
                    ✅ Wireframe généré avec succès!
                    {generatedWireframe && generatedWireframe.elements && (
                      <span> ({generatedWireframe.elements.length} éléments)</span>
                    )}
                  </>
                )}
                {generationStatus === 'failed' && '❌ La génération a échoué'}
                {generationStatus === 'generating' && (
                  <>
                    ⏳ Génération en cours...
                    {pollingInterval && <span> (actualisation automatique)</span>}
                  </>
                )}
              </div>
            )}

            {/* Affichage du résultat */}
            {generatedWireframe && (
              <div className="generated-result">
                <h3>�️ Wireframe Généré</h3>
                <div className="result-header">
                  <h4>{generatedWireframe.name}</h4>
                  <span 
                    className="result-status"
                    style={{ backgroundColor: getStatusColor(generatedWireframe.status) }}
                  >
                    {getStatusText(generatedWireframe.status)}
                  </span>
                </div>
                
                {generatedWireframe.description && (
                  <p className="result-description">{generatedWireframe.description}</p>
                )}

                {/* Aperçu Wireframe - PNG HuggingFace */}
                {(() => {
                  const isPng = generatedWireframe.imageUrl && generatedWireframe.imageUrl.endsWith('.png');
                  const hasElements = generatedWireframe.elements && generatedWireframe.elements.length > 0;

                  // PNG depuis HuggingFace → afficher l'image directement
                  if (isPng) {
                    return (
                      <div className="image-preview-main">
                        <img
                          key={generatedWireframe._id}
                          src={`${toAbsoluteUrl(generatedWireframe.imageUrl)}?v=${generatedWireframe.updatedAt || Date.now()}`}
                          alt="Wireframe généré par IA"
                          className="generated-image-main"
                        />
                        <div className="image-actions">
                          <button
                            className="download-button"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = toAbsoluteUrl(generatedWireframe.imageUrl);
                              link.download = `wireframe-${generatedWireframe._id}.png`;
                              link.click();
                            }}
                          >
                            ⬇️ Télécharger le wireframe PNG
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Fallback SVG (n8n down) → WireframePreview inline propre
                  if (hasElements) {
                    return (
                      <div className="image-preview-main">
                        <WireframePreview
                          key={generatedWireframe._id}
                          elements={generatedWireframe.elements}
                          name={generatedWireframe.name}
                        />
                        <div className="image-actions">
                          <button
                            className="download-button"
                            onClick={() => {
                              if (generatedWireframe.imageUrl) {
                                const link = document.createElement('a');
                                link.href = toAbsoluteUrl(generatedWireframe.imageUrl);
                                link.download = `wireframe-${generatedWireframe._id}.svg`;
                                link.click();
                              }
                            }}
                          >
                            ⬇️ Télécharger le wireframe SVG
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // En cours de génération
                  if (generatedWireframe.status === 'generating') {
                    return (
                      <div className="generating-placeholder">
                        <span className="spinner-large"></span>
                        <p>Génération du wireframe en cours...</p>
                      </div>
                    );
                  }

                  return <div className="no-image"><p>⚠️ Aucun élément généré</p></div>;
                })()}

                {generatedWireframe.status === 'generating' && (
                  <div className="polling-indicator">
                    <span className="spinner"></span>
                    Mise à jour automatique...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="tab-content">
          <div className="templates-grid">
            {templates.map((template) => (
              <div key={template.id} className="template-card">
                <h3>{template.name}</h3>
                <p>{template.description}</p>
                <div className="template-prompt">
                  <strong>Prompt:</strong> {template.prompt}
                </div>
                <button 
                  className="use-template-button"
                  onClick={() => useTemplate(template)}
                >
                  Utiliser ce template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default N8nAutomation;
