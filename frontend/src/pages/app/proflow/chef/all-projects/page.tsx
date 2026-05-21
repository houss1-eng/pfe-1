import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Chip, CircularProgress, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography, Button, MenuItem, Select,
} from '@mui/material';
import { getTasks } from '@/services/api';

const STATUS_LABELS: Record<string, string> = {
  pending_chef: 'En attente', assigned_designer: 'Assigné Designer',
  in_progress_designer: 'En cours (Design)', review_chef_design: 'Révision Design',
  review_client: 'Validation Client', rejected_client: 'Rejeté Client',
  approved_client: 'Approuvé', assigned_dev: 'Assigné Dev',
  in_progress_dev: 'En cours (Dev)', review_chef_dev: 'Révision Dev',
  delivered: 'Livré', completed: 'Terminé',
};

const STATUS_PROGRESS: Record<string, number> = {
  pending_chef: 5, assigned_designer: 15, in_progress_designer: 30, review_chef_design: 42,
  review_client: 52, rejected_client: 38, approved_client: 55, assigned_dev: 65,
  in_progress_dev: 78, review_chef_dev: 88, delivered: 95, completed: 100,
};

function getStatusColor(status: string): string {
  if (status === 'completed') return '#10b981';
  if (status === 'delivered') return '#6366f1';
  if (status === 'rejected_client') return '#ef4444';
  if (status === 'approved_client') return '#22c55e';
  if (status.includes('review')) return '#f59e0b';
  if (status.includes('in_progress')) return '#ec4899';
  if (status.includes('assigned')) return '#6366f1';
  return '#6b7280';
}

const PRIORITY_COLORS: Record<string, string> = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
const PRIORITY_LABELS: Record<string, string> = { low: 'Faible', medium: 'Moyen', high: 'Urgent' };

type Task = {
  _id: string; title: string; status: string; priority: string;
  clientEmail: string; createdAt: string;
};

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('all');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTasks = (q?: string, sf?: string, pf?: string) => {
    const params: Record<string, string> = {};
    if (q) params.search = q;
    if (sf) params.status = sf;
    if (pf) params.priority = pf;
    getTasks(params).then(setTasks).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchTasks(search, statusFilter, priorityFilter), search ? 400 : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, statusFilter, priorityFilter]);

  const tableTasks = useMemo(() => {
    if (tableFilter === 'active') return tasks.filter(t => !['completed', 'delivered'].includes(t.status));
    if (tableFilter === 'validation') return tasks.filter(t => ['review_client', 'delivered'].includes(t.status));
    if (tableFilter === 'done') return tasks.filter(t => ['completed', 'delivered'].includes(t.status));
    return tasks;
  }, [tasks, tableFilter]);

  const hasFilter = search || statusFilter || priorityFilter;

  if (loading) return <Box className="flex justify-center p-12"><CircularProgress /></Box>;

  return (
    <Box className="flex flex-col gap-4">
      <Typography variant="h4" fontWeight={700}>Tous les projets</Typography>

      {/* Filter bar */}
      <Box className="flex flex-wrap items-center gap-2">
        <TextField
          size="small" placeholder="Rechercher par titre…" value={search}
          onChange={e => setSearch(e.target.value)} sx={{ width: 240 }}
        />
        <Select
          size="small" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          displayEmpty sx={{ minWidth: 200 }}
        >
          <MenuItem value=''>Tous les statuts</MenuItem>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
        </Select>
        <Box className="flex gap-1">
          {(['', 'low', 'medium', 'high'] as const).map(p => (
            <Button
              key={p} size="small" variant={priorityFilter === p ? 'contained' : 'outlined'}
              onClick={() => setPriorityFilter(p)}
              sx={p && priorityFilter === p ? { bgcolor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] } : {}}
            >
              {p === '' ? 'Toutes' : PRIORITY_LABELS[p]}
            </Button>
          ))}
        </Box>
        {hasFilter && (
          <Button size="small" color="error" onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); }}>
            Réinitialiser
          </Button>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {tasks.length} projet{tasks.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Table with filter tabs */}
      <TableContainer component={Paper}>
        {/* Table sub-filter */}
        <Box className="flex items-center justify-between p-3 border-b" sx={{ borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700}>Tous les clients &amp; projets</Typography>
          <Box className="flex gap-1">
            {([['all', 'Tous'], ['active', 'Actifs'], ['validation', 'En attente'], ['done', 'Livrés']] as const).map(([val, lbl]) => (
              <Button
                key={val} size="small" variant={tableFilter === val ? 'contained' : 'text'}
                color="primary" onClick={() => setTableFilter(val)}
                sx={{ minWidth: 'auto', fontSize: 12 }}
              >
                {lbl}
              </Button>
            ))}
          </Box>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary' }}>Client</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary' }}>Projet</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary' }}>Statut</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary' }}>Progression</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary' }}>Priorité</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!tableTasks.length && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>Aucun projet trouvé.</Typography>
                </TableCell>
              </TableRow>
            )}
            {tableTasks.map(t => {
              const color = getStatusColor(t.status);
              const pct = STATUS_PROGRESS[t.status] || 0;
              const initials = (t.clientEmail || '').split('@')[0].slice(0, 2).toUpperCase();
              return (
                <TableRow key={t._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>
                    <Box className="flex items-center gap-2">
                      <Box sx={{
                        width: 34, height: 34, borderRadius: 1.5, flexShrink: 0,
                        bgcolor: '#6366f122', color: '#6366f1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700,
                      }}>{initials}</Box>
                      <Typography variant="body2" fontWeight={600}>
                        {(t.clientEmail || '').split('@')[0]}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{t.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABELS[t.status] || t.status} size="small"
                      sx={{ bgcolor: `${color}18`, color, fontWeight: 700, fontSize: 11 }}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 140 }}>
                    <Box className="flex items-center gap-2">
                      <Box sx={{ flex: 1, height: 6, bgcolor: 'action.hover', borderRadius: 4, overflow: 'hidden' }}>
                        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: 4 }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, minWidth: 32 }}>{pct}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" fontWeight={700} sx={{ color: PRIORITY_COLORS[t.priority] }}>
                      ● {PRIORITY_LABELS[t.priority]}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
