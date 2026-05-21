import { useEffect, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Card, CardContent, CircularProgress,
  Collapse, Divider, IconButton, TextField, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getUsers } from '@/services/api';
import api from '@/services/api';

type Member = { _id: string; name: string; email: string; role: string; createdAt: string };

const ROLES = [
  { key: 'designer',  label: 'Designers',     color: '#ec4899', icon: '🎨' },
  { key: 'developer', label: 'Développeurs',   color: '#10b981', icon: '💻' },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Page() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openRole, setOpenRole] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = () => {
    getUsers().then(setMembers).catch(() => setError('Erreur de chargement')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (userId: string, userName: string, role: string) => {
    if (!window.confirm(`Supprimer "${userName}" définitivement ?`)) return;
    try {
      await api.delete(`/api/auth/users/${userId}`);
      setMembers(prev => prev.filter(u => u._id !== userId));
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const toggleRole = (role: string) => setOpenRole(prev => prev === role ? null : role);

  const searchFilter = (u: Member) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());

  if (loading) return <Box className="flex justify-center p-12"><CircularProgress /></Box>;

  return (
    <Box className="flex flex-col gap-4">
      <Box className="flex items-center justify-between flex-wrap gap-2">
        <Box>
          <Typography variant="h4" fontWeight={700}>Statistiques de l'équipe</Typography>
          <Typography variant="body2" color="text.secondary">Gérez votre équipe de designers et développeurs</Typography>
        </Box>
        <TextField
          size="small" placeholder="Filtrer par nom ou email…" value={search}
          onChange={e => setSearch(e.target.value)} sx={{ width: 260 }}
        />
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 2 }}>
        {ROLES.map(({ key, label, color, icon }) => {
          const roleMembers = members.filter(u => u.role === key);
          const filtered = roleMembers.filter(searchFilter);
          const isOpen = openRole === key;

          return (
            <Card key={key} sx={{ borderTopWidth: 3, borderTopStyle: 'solid', borderTopColor: color }}>
              <CardContent>
                <Box className="flex items-center gap-3 mb-2">
                  <Typography fontSize={28}>{icon}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight={800} sx={{ color, lineHeight: 1 }}>{roleMembers.length}</Typography>
                    <Typography variant="caption" color="text.secondary">{label} enregistré(s)</Typography>
                  </Box>
                </Box>
                <Button
                  fullWidth size="small" variant="outlined"
                  sx={{ borderColor: isOpen ? color : 'divider', color: isOpen ? color : 'text.secondary', bgcolor: isOpen ? `${color}10` : 'transparent' }}
                  onClick={() => toggleRole(key)}
                >
                  {isOpen ? '▲ Masquer' : '▼ Voir la liste'}
                </Button>
              </CardContent>

              <Collapse in={isOpen}>
                <Divider />
                <Box sx={{ maxHeight: 320, overflowY: 'auto', p: 1 }}>
                  {filtered.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      {search ? 'Aucun résultat.' : `Aucun ${label.toLowerCase()} enregistré.`}
                    </Typography>
                  )}
                  {filtered.map(u => (
                    <Box
                      key={u._id}
                      className="flex items-center gap-2 p-2 rounded"
                      sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'default' }}
                    >
                      <Avatar sx={{ width: 36, height: 36, bgcolor: `${color}22`, color, fontSize: 14, fontWeight: 700 }}>
                        {u.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>{u.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{u.email}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                        {fmtDate(u.createdAt)}
                      </Typography>
                      <IconButton
                        size="small" color="error"
                        onClick={() => handleDelete(u._id, u.name, key)}
                        title="Supprimer"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
