import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip,
  CircularProgress, Typography,
} from '@mui/material';
import { getContracts, markContractCompleted, getContractUrl } from '@/services/api';

const STATUS_META: Record<string, { label: string; color: 'warning' | 'success' | 'primary' }> = {
  sent: { label: 'Envoyé — en attente', color: 'warning' },
  signed: { label: 'Signé — retourné', color: 'success' },
  completed: { label: 'Complété', color: 'primary' },
};

type Contract = {
  _id: string; ref: string; title: string; status: string;
  clientName: string; clientEmail: string; sentAt: string;
  signedAt?: string; pdfFilename?: string; signedFilename?: string;
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Page() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState<string | null>(null);

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

  const handleComplete = async (id: string) => {
    setCompleting(id);
    try {
      const { contract } = await markContractCompleted(id);
      setContracts(prev => prev.map(c => c._id === id ? contract : c));
    } catch {
      setError('Erreur lors de la mise à jour.');
    } finally {
      setCompleting(null);
    }
  };

  if (loading) return <Box className="flex justify-center p-12"><CircularProgress /></Box>;

  return (
    <Box className="flex flex-col gap-4">
      <Box className="flex items-center justify-between">
        <Typography variant="h4" fontWeight={700}>Suivi des Contrats</Typography>
        <Button variant="outlined" size="small" onClick={load}>Actualiser</Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {!contracts.length && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          Aucun contrat envoyé pour l'instant.
        </Typography>
      )}

      <Box className="flex flex-col gap-3">
        {contracts.map(c => {
          const meta = STATUS_META[c.status] || STATUS_META.sent;
          return (
            <Card key={c._id}>
              <CardContent>
                <Box className="flex items-start justify-between mb-2">
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{c.ref}</Typography>
                    <Typography variant="body2" color="text.secondary">{c.title}</Typography>
                  </Box>
                  <Chip label={meta.label} color={meta.color} size="small" />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
                  {[
                    ['Client', `${c.clientName} (${c.clientEmail})`],
                    ['Envoyé le', fmtDate(c.sentAt)],
                    ['Signé le', fmtDate(c.signedAt)],
                  ].map(([k, v]) => (
                    <Box key={k}>
                      <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600} display="block">{k}</Typography>
                      <Typography variant="body2" fontWeight={500}>{v}</Typography>
                    </Box>
                  ))}
                </Box>

                <Box className="flex gap-2 flex-wrap">
                  {c.pdfFilename && (
                    <Button size="small" variant="outlined" href={getContractUrl(c.pdfFilename)} target="_blank">
                      Contrat original
                    </Button>
                  )}
                  {c.signedFilename && (
                    <Button size="small" variant="outlined" color="success" href={getContractUrl(c.signedFilename)} target="_blank">
                      Contrat signé
                    </Button>
                  )}
                  {c.status === 'signed' && (
                    <Button
                      size="small" variant="contained" color="success"
                      disabled={completing === c._id}
                      onClick={() => handleComplete(c._id)}
                    >
                      {completing === c._id ? <CircularProgress size={14} color="inherit" /> : '✓ Marquer complété'}
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
