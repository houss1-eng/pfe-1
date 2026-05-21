'use client';
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  InputAdornment,
  Paper,
  Typography,
} from "@mui/material";

import Logo from "@/components/logo/logo";
import NiEyeClose from "@/icons/nexture/ni-eye-close";
import NiEyeOpen from "@/icons/nexture/ni-eye-open";
import { useAuth } from "@/context/AuthContext";

export default function Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname;

  const getRoleDefault = (role?: string) => {
    switch (role) {
      case 'chef': return '/proflow/chef/dashboard';
      case 'client': return '/proflow/client/dashboard';
      case 'designer': return '/proflow/designer/tasks';
      case 'developer': return '/proflow/developer/tasks';
      default: return '/';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    setError('');
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      const stored = localStorage.getItem('proflow_token');
      let role = 'chef';
      if (stored) {
        try {
          const p = JSON.parse(atob(stored.split('.')[1]));
          role = p.role || 'chef';
        } catch { /* ignore */ }
      }
      navigate(from || getRoleDefault(role), { replace: true });
    } else {
      setError('Email ou mot de passe incorrect.');
    }
  };

  return (
    <Box className="bg-waves flex min-h-screen w-full items-center justify-center bg-cover bg-center p-4">
      <Paper elevation={3} className="bg-background-paper shadow-darker-xs w-lg max-w-full rounded-4xl py-14">
        <Box className="flex flex-col gap-4 px-8 sm:px-14">
          <Box className="mb-10 flex justify-center">
            <Logo classNameMobile="hidden" />
          </Box>

          <Box className="flex flex-col gap-2 mb-6">
            <Typography variant="h1" component="h1">Connexion</Typography>
            <Typography variant="body1" className="text-text-secondary">
              Accédez à votre espace ProFlow
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" className="mb-2">{error}</Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormControl variant="standard" size="small">
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                disabled={loading}
              />
            </FormControl>

            <FormControl variant="standard" size="small">
              <FormLabel>Mot de passe</FormLabel>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(s => !s)} size="small">
                      {showPassword
                        ? <NiEyeClose size="medium" className="text-text-secondary" />
                        : <NiEyeOpen size="medium" className="text-text-secondary" />}
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              className="mt-2"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
