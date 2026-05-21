import { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Grid,
  MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography,
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

const PIPE_COLS = [
  { id: 'inbox',      label: 'Nouvelles demandes', color: '#6366f1', icon: '📥', statuses: ['pending_chef'] },
  { id: 'design',     label: 'Chez le designer',   color: '#ec4899', icon: '🎨', statuses: ['assigned_designer','in_progress_designer','review_chef_design'] },
  { id: 'validation', label: 'Validation client',  color: '#f59e0b', icon: '👀', statuses: ['review_client','rejected_client','approved_client'] },
  { id: 'dev',        label: 'En développement',   color: '#10b981', icon: '💻', statuses: ['assigned_dev','in_progress_dev','review_chef_dev'] },
  { id: 'done',       label: 'Livrés / Terminés',  color: '#22c55e', icon: '✅', statuses: ['delivered','completed'] },
];

const PRIORITY_COLORS: Record<string, string> = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
const PRIORITY_LABELS: Record<string, string> = { low: 'Faible', medium: 'Moyen', high: 'Urgent' };

type Task = { _id: string; title: string; status: string; priority: string; clientEmail: string; createdAt: string };

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

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    getTasks()
      .then(t => setTasks(t))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const kpis = useMemo(() => ({
    clients:    [...new Set(tasks.map(t => t.clientEmail))].length,
    active:     tasks.filter(t => !['completed','delivered'].includes(t.status)).length,
    designPend: tasks.filter(t => t.status === 'review_chef_design').length,
    validation: tasks.filter(t => ['review_client','delivered'].includes(t.status)).length,
    delivered:  tasks.filter(t => ['completed','delivered'].includes(t.status)).length,
  }), [tasks]);

  const pipeline = useMemo(() =>
    PIPE_COLS.map(col => ({ ...col, tasks: tasks.filter(t => col.statuses.includes(t.status)) }))
  , [tasks]);

  const tableTasks = useMemo(() => {
    let list = tasks;
    if (tableFilter === 'active') list = list.filter(t => !['completed','delivered'].includes(t.status));
    else if (tableFilter === 'validation') list = list.filter(t => ['review_client','delivered'].includes(t.status));
    else if (tableFilter === 'done') list = list.filter(t => ['completed','delivered'].includes(t.status));
    if (search) list = list.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.clientEmail.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter) list = list.filter(t => t.status === statusFilter);
    return list;
  }, [tasks, tableFilter, search, statusFilter]);

  if (loading) return <Box className="flex justify-center p-12"><CircularProgress /></Box>;

  return (
    <Box className="flex flex-col gap-6">
      {/* Header */}
      <Box>
        <Typography variant="h4" fontWeight={700}>Tableau de bord Chef de Projet</Typography>
        <Typography variant="body2" color="text.secondary">Pilotez les projets, coordonnez l'équipe et suivez les livrables</Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2}>
        {[
          { label: 'Clients actifs',      value: kpis.clients,    color: '#6366f1', icon: '👥', sub: `${tasks.length} projets total` },
          { label: 'Projets en cours',    value: kpis.active,     color: '#10b981', icon: '📁', sub: 'En production' },
          { label: 'Maquettes à traiter', value: kpis.designPend, color: '#f59e0b', icon: '🖼️', sub: 'Révision en attente' },
          { label: 'Validations clients', value: kpis.validation, color: '#ef4444', icon: '⚡', sub: 'En attente de réponse' },
          { label: 'Livrés',              value: kpis.delivered,  color: '#22c55e', icon: '✅', sub: 'Total terminés' },
        ].map((s) => (
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={s.label}>
            <Card sx={{ borderTopWidth: 3, borderTopStyle: 'solid', borderTopColor: s.color }}>
              <CardContent sx={{ py: 2 }}>
                <Box className="flex justify-between items-center mb-2">
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 11 }}>
                    {s.label}
                  </Typography>
                  <Typography fontSize={18}>{s.icon}</Typography>
                </Box>
                <Typography variant="h3" fontWeight={900} sx={{ color: s.color, lineHeight: 1 }}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{s.sub}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pipeline Kanban */}
      <Box>
        <Box className="flex justify-between items-center mb-3">
          <Box>
            <Typography variant="h6" fontWeight={700}>Pipeline — Tous les projets</Typography>
            <Typography variant="caption" color="text.secondary">
              {tasks.length} projet(s) répartis sur {PIPE_COLS.length} étapes
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, alignItems: 'flex-start' }}>
          {pipeline.map(col => (
            <Box key={col.id} sx={{ minWidth: 230, maxWidth: 230, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

              {/* Column header */}
              <Box sx={{
                p: 1.5, borderRadius: 2,
                bgcolor: `${col.color}12`,
                border: `1.5px solid ${col.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography fontSize={14}>{col.icon}</Typography>
                  <Typography variant="caption" fontWeight={700} fontSize={11.5} sx={{ color: col.color }}>
                    {col.label}
                  </Typography>
                </Box>
                <Box sx={{
                  minWidth: 22, height: 22, borderRadius: '50%',
                  bgcolor: col.color, color: '#fff',
                  fontSize: 11, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {col.tasks.length}
                </Box>
              </Box>

              {/* Cards */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 500, overflowY: 'auto', pr: 0.5 }}>
                {col.tasks.length === 0 ? (
                  <Box sx={{
                    textAlign: 'center', py: 4, borderRadius: 2,
                    border: '1.5px dashed', borderColor: `${col.color}30`,
                    bgcolor: `${col.color}06`,
                  }}>
                    <Typography fontSize={20} display="block" sx={{ mb: 0.5, opacity: 0.4 }}>{col.icon}</Typography>
                    <Typography variant="caption" color="text.secondary">Aucun projet</Typography>
                  </Box>
                ) : (
                  col.tasks.map(t => {
                    const pct = STATUS_PROGRESS[t.status] || 0;
                    const initials = (t.clientEmail || '').split('@')[0].slice(0, 2).toUpperCase();
                    const dateStr = new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                    return (
                      <Card key={t._id} elevation={0} sx={{
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderLeft: `4px solid ${col.color}`,
                        transition: 'box-shadow 0.15s',
                        '&:hover': { boxShadow: 3 },
                      }}>
                        <CardContent sx={{ p: '10px 12px !important' }}>
                          {/* Title */}
                          <Typography
                            variant="caption" fontWeight={700} display="block"
                            sx={{ lineHeight: 1.35, mb: 1.2, fontSize: 12 }}
                          >
                            {t.title.length > 34 ? t.title.slice(0, 34) + '…' : t.title}
                          </Typography>

                          {/* Client row */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Box sx={{
                                width: 22, height: 22, borderRadius: '50%',
                                bgcolor: `${col.color}22`, color: col.color,
                                fontSize: 9, fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>
                                {initials}
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>
                                {(t.clientEmail || '').split('@')[0]}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9.5 }}>
                              {dateStr}
                            </Typography>
                          </Box>

                          {/* Status + Priority row */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                            <Chip
                              label={STATUS_LABELS[t.status] || t.status}
                              size="small"
                              sx={{
                                bgcolor: `${col.color}15`, color: col.color,
                                fontSize: 9, height: 18, fontWeight: 600,
                                maxWidth: 130,
                              }}
                            />
                            <Box sx={{
                              px: 0.75, py: 0.15, borderRadius: 1,
                              bgcolor: `${PRIORITY_COLORS[t.priority]}18`,
                              color: PRIORITY_COLORS[t.priority],
                              fontSize: 9, fontWeight: 700,
                            }}>
                              {PRIORITY_LABELS[t.priority]}
                            </Box>
                          </Box>

                          {/* Progress bar */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1, height: 4, bgcolor: 'action.hover', borderRadius: 2, overflow: 'hidden' }}>
                              <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: col.color, borderRadius: 2, transition: 'width 0.4s' }} />
                            </Box>
                            <Typography sx={{ fontSize: 9.5, color: col.color, fontWeight: 700, minWidth: 28 }}>
                              {pct}%
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Projects Table */}
      <Box>
        <Box className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <Typography variant="h6" fontWeight={700}>Tous les clients &amp; projets</Typography>
          <Box className="flex gap-1 flex-wrap">
            {([['all','Tous'], ['active','Actifs'], ['validation','En attente'], ['done','Livrés']] as const).map(([v, l]) => (
              <Button key={v} size="small" variant={tableFilter === v ? 'contained' : 'text'} onClick={() => setTableFilter(v)} sx={{ fontSize: 11 }}>
                {l}
              </Button>
            ))}
          </Box>
        </Box>
        <Box className="flex gap-2 mb-2 flex-wrap">
          <TextField size="small" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} sx={{ width: 220 }} />
          <Select size="small" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} displayEmpty sx={{ minWidth: 180 }}>
            <MenuItem value=''>Tous les statuts</MenuItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </Select>
        </Box>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Client', 'Projet', 'Statut', 'Progression', 'Priorité'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary', bgcolor: 'background.default' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!tableTasks.length && (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>Aucun projet.</Typography></TableCell></TableRow>
              )}
              {tableTasks.map(t => {
                const color = getStatusColor(t.status);
                const pct = STATUS_PROGRESS[t.status] || 0;
                const initials = (t.clientEmail || '').split('@')[0].slice(0, 2).toUpperCase();
                return (
                  <TableRow key={t._id} hover>
                    <TableCell>
                      <Box className="flex items-center gap-2">
                        <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: '#6366f122', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{initials}</Box>
                        <Typography variant="body2" fontWeight={600}>{(t.clientEmail || '').split('@')[0]}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{t.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={STATUS_LABELS[t.status] || t.status} size="small" sx={{ bgcolor: `${color}18`, color, fontWeight: 700, fontSize: 11 }} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 130 }}>
                      <Box className="flex items-center gap-2">
                        <Box sx={{ flex: 1, height: 6, bgcolor: 'action.hover', borderRadius: 4, overflow: 'hidden' }}>
                          <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: 4 }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ minWidth: 32 }}>{pct}%</Typography>
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

    </Box>
  );
}
