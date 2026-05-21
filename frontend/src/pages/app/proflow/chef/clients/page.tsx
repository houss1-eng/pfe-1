import { useEffect, useMemo, useState } from 'react';
import {
  Avatar, Box, Card, CardContent, CircularProgress, Grid,
  TextField, Typography,
} from '@mui/material';
import { getTasks, getUsers } from '@/services/api';

type Task = { _id: string; status: string; clientEmail: string; updatedAt: string };
type User = { _id: string; name: string; email: string; role: string; createdAt: string };

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([getTasks(), getUsers()])
      .then(([t, u]) => { setTasks(t); setUsers(u); })
      .finally(() => setLoading(false));
  }, []);

  const clients = useMemo(() => {
    const clientUsers = users.filter(u => u.role === 'client');
    return clientUsers
      .map(client => {
        const ct = tasks.filter(t => t.clientEmail === client.email);
        const active = ct.filter(t => !['completed', 'delivered'].includes(t.status)).length;
        const completed = ct.filter(t => ['completed', 'delivered'].includes(t.status)).length;
        const last = [...ct].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
        return { ...client, taskCount: ct.length, active, completed, lastActivity: last?.updatedAt || client.createdAt };
      })
      .filter(c =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.active - a.active);
  }, [tasks, users, search]);

  if (loading) return <Box className="flex justify-center p-12"><CircularProgress /></Box>;

  return (
    <Box className="flex flex-col gap-4">
      <Typography variant="h4" fontWeight={700}>Aperçu Clients</Typography>

      <TextField
        size="small" placeholder="Rechercher un client…" value={search}
        onChange={e => setSearch(e.target.value)} sx={{ maxWidth: 300 }}
      />

      {!clients.length && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          Aucun client trouvé
        </Typography>
      )}

      <Grid container spacing={3}>
        {clients.map(client => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={client._id}>
            <Card>
              <CardContent>
                <Box className="flex items-center gap-3 mb-3">
                  <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: 20, fontWeight: 700 }}>
                    {client.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>{client.name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{client.email}</Typography>
                  </Box>
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={6}>
                    <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="h5" fontWeight={800} color="primary">{client.active}</Typography>
                      <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={700}>Actifs</Typography>
                    </Box>
                  </Grid>
                  <Grid size={6}>
                    <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="h5" fontWeight={800} color="success.main">{client.completed}</Typography>
                      <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={700}>Terminés</Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Typography variant="caption" color="text.secondary">
                  Dernière activité : {new Date(client.lastActivity).toLocaleDateString('fr-FR')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
