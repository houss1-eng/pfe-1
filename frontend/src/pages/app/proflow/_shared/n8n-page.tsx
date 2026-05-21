import { useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, CardActions, Chip,
  CircularProgress, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import { generateWireframe, listAutomationTemplates, getWireframe, API_URL } from '@/services/api';

type WireframeResult = {
  _id: string; name: string; description?: string; status: string;
  imageUrl?: string; elements?: unknown[]; updatedAt?: string;
};
type Template = { id: string; name: string; description: string; prompt: string };

const statusColor = (s: string): 'warning' | 'success' | 'error' | 'default' => {
  if (s === 'generating') return 'warning';
  if (s === 'completed') return 'success';
  if (s === 'failed') return 'error';
  return 'default';
};

const toAbsoluteUrl = (url: string) => (url?.startsWith('/') ? `${API_URL}${url}` : url);

export default function N8nPage() {
  const [tab, setTab] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<WireframeResult | null>(null);
  const [genError, setGenError] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    listAutomationTemplates().then(setTemplates).catch(() => {});
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const startPolling = (id: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    const iv = setInterval(async () => {
      try {
        const wf = await getWireframe(id);
        if (wf) {
          setResult(wf);
          if (wf.status === 'completed' || wf.status === 'failed') {
            clearInterval(iv);
          }
        }
      } catch { clearInterval(iv); }
    }, 3000);
    pollingRef.current = iv;
    setTimeout(() => clearInterval(iv), 120000);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenError('');
    setResult(null);
    try {
      const data = await generateWireframe({
        prompt: prompt.trim(),
        projectName: projectName.trim() || `Wireframe - ${new Date().toLocaleDateString()}`,
        description: description.trim(),
      });
      if (data.success && data.wireframe) {
        setResult({ ...data.wireframe, status: 'generating' });
        setPrompt(''); setProjectName(''); setDescription('');
        startPolling(data.wireframe._id);
      } else {
        setGenError(data.message || 'La génération a échoué');
      }
    } catch (e: unknown) {
      setGenError((e as Error).message || 'Erreur réseau');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box className="flex flex-col gap-4">
      <Typography variant="h4" fontWeight={700}>Génération IA de Wireframes</Typography>
      <Typography variant="body2" color="text.secondary">Utilisez l'IA pour créer des wireframes automatiquement via n8n</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Générer" />
        <Tab label="Templates" />
      </Tabs>

      {tab === 0 && (
        <Box className="flex flex-col gap-3">
          <TextField
            fullWidth multiline rows={4} label="Description du wireframe *"
            placeholder="Ex: Crée un dashboard admin avec sidebar, cartes de statistiques et tableau de données"
            value={prompt} onChange={e => setPrompt(e.target.value)} disabled={generating}
          />
          <TextField
            label="Nom du projet (optionnel)"
            value={projectName} onChange={e => setProjectName(e.target.value)} disabled={generating}
          />
          <TextField
            multiline rows={2} label="Description détaillée (optionnel)"
            value={description} onChange={e => setDescription(e.target.value)} disabled={generating}
          />

          {genError && <Alert severity="error">{genError}</Alert>}

          <Button
            variant="contained" size="large" disabled={generating || !prompt.trim()}
            onClick={handleGenerate}
            startIcon={generating ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {generating ? 'Génération en cours…' : '🚀 Générer le Wireframe'}
          </Button>

          {result && (
            <Card>
              <CardContent>
                <Box className="flex items-center justify-between mb-2">
                  <Typography variant="h6" fontWeight={700}>{result.name}</Typography>
                  <Chip label={result.status === 'generating' ? 'En cours…' : result.status === 'completed' ? 'Terminé' : 'Échoué'} color={statusColor(result.status)} size="small" />
                </Box>
                {result.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{result.description}</Typography>
                )}

                {result.status === 'generating' && (
                  <Box className="flex items-center gap-2">
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">Génération en cours… (mise à jour automatique)</Typography>
                  </Box>
                )}

                {result.status === 'completed' && result.imageUrl && result.imageUrl.endsWith('.png') && (
                  <Box>
                    <img
                      src={`${toAbsoluteUrl(result.imageUrl)}?v=${result.updatedAt || ''}`}
                      alt="Wireframe généré"
                      style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }}
                    />
                  </Box>
                )}
              </CardContent>
              {result.status === 'completed' && result.imageUrl && (
                <CardActions>
                  <Button
                    size="small" variant="outlined"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = toAbsoluteUrl(result.imageUrl!);
                      a.download = `wireframe-${result._id}.${result.imageUrl!.endsWith('.png') ? 'png' : 'svg'}`;
                      a.click();
                    }}
                  >
                    Télécharger
                  </Button>
                </CardActions>
              )}
            </Card>
          )}
        </Box>
      )}

      {tab === 1 && (
        <Box className="flex flex-col gap-3">
          {!templates.length && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Aucun template disponible
            </Typography>
          )}
          {templates.map(t => (
            <Card key={t.id}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700}>{t.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{t.description}</Typography>
                <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  Prompt: {t.prompt}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => { setPrompt(t.prompt); setProjectName(t.name); setDescription(t.description); setTab(0); }}>
                  Utiliser ce template
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
