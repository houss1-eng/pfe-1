import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, CardActions, CardMedia,
  CircularProgress, Collapse, Typography,
} from '@mui/material';
import { listWireframes, deleteWireframe, API_URL } from '@/services/api';

type Wireframe = {
  _id: string; name: string; description?: string; createdAt: string;
  elements?: unknown[]; imageUrl?: string;
};

const toAbs = (url: string) => (url?.startsWith('/') ? `${API_URL}${url}` : url);

export default function WireframesPage() {
  const [wireframes, setWireframes] = useState<Wireframe[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    listWireframes()
      .then(setWireframes)
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce wireframe ?')) return;
    setDeletingId(id);
    try {
      await deleteWireframe(id);
      setWireframes(prev => prev.filter(w => w._id !== id));
      if (viewId === id) setViewId(null);
    } catch { setError('Erreur lors de la suppression'); }
    finally { setDeletingId(null); }
  };

  if (loading) return <Box className="flex justify-center p-12"><CircularProgress /></Box>;

  return (
    <Box className="flex flex-col gap-4">
      <Box className="flex items-center justify-between">
        <Typography variant="h4" fontWeight={700}>Mes Wireframes</Typography>
        <Button variant="outlined" size="small" onClick={load}>Actualiser</Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {!wireframes.length && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          Aucun wireframe sauvegardé.
        </Typography>
      )}

      <Box className="flex flex-col gap-3">
        {wireframes.map(wf => (
          <Card key={wf._id}>
            <CardContent sx={{ pb: 1 }}>
              <Box className="flex items-start justify-between">
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{wf.name}</Typography>
                  {wf.description && (
                    <Typography variant="body2" color="text.secondary">{wf.description}</Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {new Date(wf.createdAt).toLocaleDateString('fr-FR')}
                    {wf.elements && wf.elements.length > 0 && ` · ${wf.elements.length} élément(s)`}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => setViewId(viewId === wf._id ? null : wf._id)}>
                {viewId === wf._id ? 'Masquer' : 'Voir'}
              </Button>
              <Button size="small" color="error" disabled={deletingId === wf._id} onClick={() => handleDelete(wf._id)}>
                {deletingId === wf._id ? <CircularProgress size={14} /> : 'Supprimer'}
              </Button>
              {wf.imageUrl && (
                <Button size="small" href={toAbs(wf.imageUrl)} download={`wireframe-${wf._id}`}>
                  Télécharger
                </Button>
              )}
            </CardActions>
            <Collapse in={viewId === wf._id}>
              {wf.imageUrl ? (
                <CardMedia
                  component="img"
                  image={toAbs(wf.imageUrl)}
                  alt={wf.name}
                  sx={{ maxHeight: 400, objectFit: 'contain', bgcolor: 'background.default' }}
                />
              ) : (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">Aperçu non disponible</Typography>
                </Box>
              )}
            </Collapse>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
