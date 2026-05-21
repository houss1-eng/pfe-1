import { useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Typography,
} from '@mui/material';
import { getContracts, uploadSignedContract, returnContractToChef, getContractUrl } from '@/services/api';

type Contract = {
  _id: string; title: string; ref: string; status: string;
  pdfFilename?: string; signedFilename?: string;
  createdAt: string; returnedAt?: string;
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  sent:      { label: 'À signer',  color: '#f59e0b' },
  signed:    { label: 'Signé',     color: '#22c55e' },
  completed: { label: 'Terminé',   color: '#6b7280' },
};

export default function Page() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    getContracts()
      .then(setContracts)
      .catch(() => setError('Erreur de chargement des contrats'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSendSigned = async () => {
    if (!file || !activeContract) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      await uploadSignedContract(activeContract._id, fd);
      await returnContractToChef(activeContract._id);
      setActiveContract(null);
      setFile(null);
      load();
    } catch {
      setError('Erreur lors de l\'envoi du contrat signé');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Box className="flex justify-center p-12"><CircularProgress /></Box>;

  return (
    <Box className="flex flex-col gap-4">
      <Typography variant="h4" fontWeight={700}>Mes Contrats &amp; Devis</Typography>
      <Typography variant="body2" color="text.secondary">Signez et renvoyez vos contrats ici.</Typography>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      {!contracts.length ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          Aucun contrat ou document n'a été partagé pour le moment.
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 2 }}>
          {contracts.map(c => {
            const s = STATUS_MAP[c.status] || { label: c.status, color: '#6b7280' };
            return (
              <Card key={c._id} sx={{ borderLeft: `3px solid ${s.color}` }}>
                <CardContent>
                  <Box className="flex items-start justify-between gap-2 mb-2">
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>{c.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Réf: {c.ref} · {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                      </Typography>
                    </Box>
                    <Chip
                      label={s.label} size="small"
                      sx={{ bgcolor: `${s.color}20`, color: s.color, fontWeight: 700 }}
                    />
                  </Box>

                  <Box className="flex items-center justify-between p-2 rounded" sx={{ bgcolor: 'action.hover', mt: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{c.ref}.pdf</Typography>
                    <Box className="flex gap-1">
                      {c.pdfFilename && (
                        <Button
                          size="small" variant="contained" color="primary"
                          href={getContractUrl(c.pdfFilename)} target="_blank"
                        >
                          Télécharger
                        </Button>
                      )}
                      {c.status === 'sent' && (
                        <Button
                          size="small" variant="outlined"
                          onClick={() => { setActiveContract(c); setFile(null); }}
                        >
                          Répondre
                        </Button>
                      )}
                    </Box>
                  </Box>

                  {c.status === 'signed' && c.returnedAt && (
                    <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
                      Contrat signé renvoyé le {new Date(c.returnedAt).toLocaleDateString('fr-FR')}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Upload signed contract dialog */}
      <Dialog open={!!activeContract} onClose={() => setActiveContract(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Renvoyer le contrat signé</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Uploadez la version PDF signée de <strong>{activeContract?.title}</strong>.
          </Typography>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          <Button variant="outlined" fullWidth onClick={() => fileRef.current?.click()}>
            {file ? file.name : 'Sélectionner le PDF signé'}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActiveContract(null)}>Annuler</Button>
          <Button
            variant="contained" disabled={!file || uploading}
            onClick={handleSendSigned}
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {uploading ? 'Envoi…' : 'Envoyer au chef'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
