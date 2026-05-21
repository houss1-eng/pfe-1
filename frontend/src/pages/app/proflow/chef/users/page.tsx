import { useEffect, useState } from 'react';
import {
  Avatar, Box, Card, CardContent, Chip, CircularProgress,
  FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography,
} from '@mui/material';
import { getUsers } from '@/services/api';

type User = { _id: string; name: string; email: string; role: string; createdAt: string; avatar?: string };

const ROLE_COLOR: Record<string, 'primary' | 'secondary' | 'success' | 'info'> = {
  chef: 'primary', client: 'secondary', designer: 'success', developer: 'info',
};

export default function Page() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    getUsers()
      .then(u => setUsers(u))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const counts = { total: users.length, chef: users.filter(u => u.role === 'chef').length, client: users.filter(u => u.role === 'client').length, designer: users.filter(u => u.role === 'designer').length, developer: users.filter(u => u.role === 'developer').length };

  if (loading) return <Box className="flex justify-center p-12"><CircularProgress /></Box>;

  return (
    <Box className="flex flex-col gap-4">
      <Typography variant="h4" fontWeight={700}>Gestion des Utilisateurs</Typography>

      {/* Stat chips */}
      <Box className="flex gap-3 flex-wrap">
        {Object.entries(counts).map(([role, count]) => (
          <Box key={role} sx={{ textAlign: 'center', p: '8px 20px', bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={800}>{count}</Typography>
            <Typography variant="caption" color="text.secondary" textTransform="capitalize">{role}</Typography>
          </Box>
        ))}
      </Box>

      <Box className="flex gap-3">
        <TextField
          size="small" placeholder="Rechercher…" value={search}
          onChange={e => setSearch(e.target.value)} sx={{ flex: 1, maxWidth: 280 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Rôle</InputLabel>
          <Select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} label="Rôle">
            <MenuItem value=''>Tous</MenuItem>
            <MenuItem value='chef'>Chef</MenuItem>
            <MenuItem value='client'>Client</MenuItem>
            <MenuItem value='designer'>Designer</MenuItem>
            <MenuItem value='developer'>Développeur</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2}>
        {filtered.map(u => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={u._id}>
            <Card>
              <CardContent>
                <Box className="flex items-center gap-3">
                  <Avatar sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontWeight: 700 }}>
                    {u.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>{u.name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{u.email}</Typography>
                  </Box>
                  <Chip label={u.role} size="small" color={ROLE_COLOR[u.role] || 'default'} />
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {!filtered.length && (
          <Grid size={12}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Aucun utilisateur trouvé</Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
