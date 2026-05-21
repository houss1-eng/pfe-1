import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Typography,
} from "@mui/material";

import { useAuth } from "@/context/AuthContext";
import { deleteAccount } from "@/services/api";

export default function SettingsWork() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user?.role === 'chef') return null;

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await deleteAccount();
      logout();
      navigate('/auth/sign-in');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erreur lors de la suppression du compte');
      setLoading(false);
    }
  };

  return (
    <Grid size={12}>
      <Card sx={{ border: '1px solid', borderColor: 'error.light' }}>
        <CardContent>
          <Typography variant="h6" component="h6" className="card-title" color="error">
            Zone de danger
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box className="outlined lg:flex-row lg:gap-2.5" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="body2" fontWeight={600}>Supprimer mon compte</Typography>
              <Typography variant="caption" color="text.secondary">
                Cette action est irréversible. Toutes vos données seront définitivement supprimées.
              </Typography>
            </Box>
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={() => setOpen(true)}
            >
              Supprimer le compte
            </Button>
          </Box>

          <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront perdues.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)} color="inherit" disabled={loading}>
                Annuler
              </Button>
              <Button onClick={handleDelete} color="error" variant="contained" disabled={loading}>
                {loading ? 'Suppression...' : 'Supprimer'}
              </Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
    </Grid>
  );
}
