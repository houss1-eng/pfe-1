import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardActions, CardContent, Chip,
  CircularProgress, Collapse, Typography,
} from '@mui/material';
import { listAutomatedWireframes, saveWireframe, API_URL } from '@/services/api';

type AutoWireframe = {
  _id: string; name: string; description?: string; status: string;
  imageUrl?: string; elements?: unknown[]; createdAt: string; updatedAt?: string;
};

const STATUS_COLOR: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  generating: 'warning', completed: 'success', failed: 'error',
};
const STATUS_LABEL: Record<string, string> = {
  generating: 'En cours…', completed: 'Terminé', failed: 'Échoué',
};

const toAbs = (url: string) => (url?.startsWith('/') ? `${API_URL}${url}` : url);

export default function Page() {
  const [wireframes, setWireframes] = useState<AutoWireframe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listAutomatedWireframes()
      .then(setWireframes)
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (wf: AutoWireframe) => {
    setSavingId(wf._id);
    try {
      await saveWireframe({
        name: wf.name,
        description: wf.description || '',
        elements: wf.elements || [],
        imageUrl: wf.imageUrl || undefined,
      });
      setSavedIds(prev => new Set([...prev, wf._id]));
    } catch {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <Box className="flex justify-center p-12"><CircularProgress /></Box>;

  return (
    <Box className="flex flex-col gap-4">
      <Box className="flex items-center justify-between">
        <Box>
          <Typography variant="h4" fontWeight={700}>Historique IA</Typography>
          <Typography variant="body2" color="text.secondary">Wireframes générés automatiquement via n8n</Typography>
        </Box>
        <Button variant="outlined" size="small" onClick={load}>Actualiser</Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      {!wireframes.length && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          Aucun wireframe généré automatiquement.
        </Typography>
      )}

      <Box className="flex flex-col gap-3">
        {wireframes.map(wf => {
          const isPng = wf.imageUrl?.endsWith('.png');
          const isViewing = viewingId === wf._id;
          const isSaved = savedIds.has(wf._id);
          const isSaving = savingId === wf._id;

          return (
            <Card key={wf._id}>
              <CardContent sx={{ pb: 1 }}>
                <Box className="flex items-start justify-between gap-2">
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{wf.name}</Typography>
                    {wf.description && (
                      <Typography variant="body2" color="text.secondary">{wf.description}</Typography>
                    )}
                    <Box className="flex items-center gap-2 mt-0.5">
                      <Typography variant="caption" color="text.secondary">
                        {new Date(wf.createdAt).toLocaleDateString('fr-FR')}
                      </Typography>
                      <Chip
                        label={STATUS_LABEL[wf.status] || wf.status}
                        color={STATUS_COLOR[wf.status] || 'default'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>
              </CardContent>

              <CardActions>
                {wf.status === 'completed' && (
                  <>
                    <Button
                      size="small"
                      disabled={!isPng && !(wf.elements?.length)}
                      onClick={() => setViewingId(isViewing ? null : wf._id)}
                    >
                      {isViewing ? 'Masquer' : 'Voir'}
                    </Button>
                    <Button
                      size="small" color="success"
                      disabled={isSaved || isSaving}
                      onClick={() => handleSave(wf)}
                      startIcon={isSaving ? <CircularProgress size={14} color="inherit" /> : undefined}
                    >
                      {isSaved ? 'Sauvegardé' : 'Sauvegarder'}
                    </Button>
                    {wf.imageUrl && (
                      <Button size="small" href={toAbs(wf.imageUrl)} download={`wireframe-${wf._id}`}>
                        Télécharger
                      </Button>
                    )}
                  </>
                )}
                {wf.status === 'generating' && (
                  <Button size="small" onClick={load}>Actualiser</Button>
                )}
              </CardActions>

              <Collapse in={isViewing && wf.status === 'completed'}>
                {isPng ? (
                  <Box sx={{ p: 2 }}>
                    <img
                      src={`${toAbs(wf.imageUrl!)}?v=${wf.updatedAt || ''}`}
                      alt={wf.name}
                      style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">Aperçu non disponible</Typography>
                  </Box>
                )}
              </Collapse>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
