import { useState } from "react";

import {
  Alert,
  Button,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Typography,
} from "@mui/material";

import { changePassword } from "@/services/api";

export default function SettingsContact() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSuccess('');
    setError('');
    if (!current || !next || !confirm) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (next !== confirm) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    if (next.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setSaving(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      setSuccess('Mot de passe modifié avec succès');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Grid size={12}>
      <Card>
        <CardContent>
          <Typography variant="h6" component="h6" className="card-title">
            Changer le mot de passe
          </Typography>

          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

          <FormControl className="outlined lg:flex-row lg:gap-2.5" variant="standard" size="small" fullWidth>
            <FormLabel component="label" className="min-w-60">
              Mot de passe actuel
            </FormLabel>
            <Input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full"
              placeholder="••••••••"
            />
          </FormControl>

          <FormControl className="outlined lg:flex-row lg:gap-2.5" variant="standard" size="small" fullWidth>
            <FormLabel component="label" className="min-w-60">
              Nouveau mot de passe
            </FormLabel>
            <Input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="w-full"
              placeholder="••••••••"
            />
          </FormControl>

          <FormControl className="outlined lg:flex-row lg:gap-2.5" variant="standard" size="small" fullWidth>
            <FormLabel component="label" className="min-w-60">
              Confirmer le mot de passe
            </FormLabel>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full"
              placeholder="••••••••"
            />
          </FormControl>

          <Button
            size="medium"
            color="primary"
            variant="outlined"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Enregistrement...' : 'Modifier le mot de passe'}
          </Button>
        </CardContent>
      </Card>
    </Grid>
  );
}
