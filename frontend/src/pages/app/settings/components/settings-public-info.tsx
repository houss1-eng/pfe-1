import { useRef, useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Typography,
} from "@mui/material";

import NiPen from "@/icons/nexture/ni-pen";
import { useAuth } from "@/context/AuthContext";
import { getAvatarUrl, uploadAvatar, updateProfile } from "@/services/api";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  chef:      { label: 'Chef de Projet', color: '#6366f1' },
  client:    { label: 'Client',         color: '#f59e0b' },
  designer:  { label: 'Designer',       color: '#ec4899' },
  developer: { label: 'Développeur',    color: '#10b981' },
};

export default function SettingsPublicInfo() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const roleInfo = ROLE_LABELS[user?.role ?? ''] ?? { label: user?.role ?? '', color: '#6b7280' };
  const currentAvatarSrc = avatarPreview ?? (user?.avatar ? getAvatarUrl(user.avatar) ?? undefined : undefined);
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        await uploadAvatar(fd);
        setAvatarFile(null);
        setAvatarPreview(null);
      }
      if (name.trim() && name.trim() !== user?.name) {
        await updateProfile({ name: name.trim() });
      }
      await refreshUser();
      setSuccess('Profil mis à jour avec succès');
    } catch {
      setError('Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Grid size={12}>
      <Card>
        <CardContent>
          <Typography variant="h6" component="h6" className="card-title">
            Informations du profil
          </Typography>

          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

          <FormControl variant="standard" size="small" fullWidth className="outlined lg:flex-row lg:gap-2.5 relative items-start">
            <FormLabel component="label" className="min-w-60">
              Photo de profil
            </FormLabel>
            <Box className="relative">
              <Avatar
                alt={user?.name}
                src={currentAvatarSrc as string}
                sx={{ width: 80, height: 80, bgcolor: roleInfo.color, fontWeight: 700, fontSize: 28 }}
              >
                {!currentAvatarSrc && initials}
              </Avatar>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
              <Button
                className="icon-only bg-background-paper hover:text-primary hover:bg-background-paper absolute -end-1 -bottom-1"
                size="small"
                color="grey"
                variant="outlined"
                startIcon={<NiPen size="small" />}
                onClick={() => fileRef.current?.click()}
              />
            </Box>
          </FormControl>

          <FormControl className="outlined lg:flex-row lg:gap-2.5" variant="standard" size="small" fullWidth>
            <FormLabel component="label" className="min-w-60">
              Nom complet
            </FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              placeholder="Votre nom"
            />
          </FormControl>

          <FormControl className="outlined lg:flex-row lg:gap-2.5" variant="standard" size="small" fullWidth>
            <FormLabel component="label" className="min-w-60">
              Email
            </FormLabel>
            <Input value={user?.email ?? ''} disabled className="w-full" />
          </FormControl>

          <FormControl className="outlined lg:flex-row lg:gap-2.5" variant="standard" size="small" fullWidth>
            <FormLabel component="label" className="min-w-60">
              Rôle
            </FormLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', pt: 0.5 }}>
              <Chip
                label={roleInfo.label}
                size="small"
                sx={{ bgcolor: `${roleInfo.color}18`, color: roleInfo.color, fontWeight: 700 }}
              />
            </Box>
          </FormControl>

          <Button
            size="medium"
            color="primary"
            variant="outlined"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </CardContent>
      </Card>
    </Grid>
  );
}
