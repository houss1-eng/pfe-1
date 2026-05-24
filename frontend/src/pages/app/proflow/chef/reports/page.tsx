import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import {
  Box, Card, CardContent, Chip, CircularProgress,
  Divider, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, useTheme,
} from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import GroupsIcon from '@mui/icons-material/Groups';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { getTasks, getUsers } from '@/services/api';

dayjs.locale('fr');

type Task = {
  _id: string; title: string; status: string; priority: string;
  clientEmail: string; createdAt: string; updatedAt: string; deadline?: string;
};
type User = { _id: string; name: string; email: string; role: string };

const STATUS_COLOR: Record<string, string> = {
  pending_chef: '#6b7280', assigned_designer: '#ec4899', in_progress_designer: '#ec4899',
  review_chef_design: '#f59e0b', review_client: '#f59e0b', rejected_client: '#ef4444',
  approved_client: '#22c55e', assigned_dev: '#6366f1', in_progress_dev: '#6366f1',
  review_chef_dev: '#f59e0b', delivered: '#8b5cf6', completed: '#10b981',
};

const STATUS_LABEL: Record<string, string> = {
  pending_chef: 'En attente', assigned_designer: 'Designer assigné', in_progress_designer: 'Design en cours',
  review_chef_design: 'Révision design', review_client: 'Validation client', rejected_client: 'Rejeté',
  approved_client: 'Approuvé', assigned_dev: 'Dev assigné', in_progress_dev: 'Dev en cours',
  review_chef_dev: 'Révision dev', delivered: 'Livré', completed: 'Terminé',
};

const PRIO_COLOR: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

function KpiCard({ label, value, sub, color, icon }: {
  label: string; value: number | string; sub?: string; color: string; icon: React.ReactNode;
}) {
  return (
    <Card sx={{ borderLeft: `4px solid ${color}`, height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: 2,
          bgcolor: `${color}18`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color, lineHeight: 1 }}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          {sub && <Typography variant="caption" display="block" sx={{ color, fontWeight: 600 }}>{sub}</Typography>}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { palette } = useTheme();

  useEffect(() => {
    Promise.all([getTasks(), getUsers()])
      .then(([t, u]) => { setTasks(t); setUsers(u); })
      .finally(() => setLoading(false));
  }, []);

  // KPIs
  const kpis = useMemo(() => {
    const completed = tasks.filter(t => ['completed', 'delivered'].includes(t.status));
    const active = tasks.filter(t => !['completed', 'delivered'].includes(t.status));
    const thisMonth = tasks.filter(t => dayjs(t.createdAt).isSame(dayjs(), 'month'));
    const onTime = completed.filter(t => !t.deadline || dayjs(t.updatedAt).isBefore(dayjs(t.deadline).add(1, 'day')));
    return {
      total: tasks.length,
      completed: completed.length,
      active: active.length,
      thisMonth: thisMonth.length,
      onTimeRate: completed.length > 0 ? Math.round((onTime.length / completed.length) * 100) : 0,
    };
  }, [tasks]);

  // Status distribution
  const statusPieData = useMemo(() => {
    const groups: Record<string, number> = {};
    tasks.forEach(t => { groups[t.status] = (groups[t.status] || 0) + 1; });
    return Object.entries(groups)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ label: STATUS_LABEL[k] || k, value: v, color: STATUS_COLOR[k] || '#6b7280' }));
  }, [tasks]);

  // Priority distribution
  const prioBarData = useMemo(() => [
    { label: 'Urgent', value: tasks.filter(t => t.priority === 'high').length, color: '#ef4444' },
    { label: 'Moyen',  value: tasks.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
    { label: 'Faible', value: tasks.filter(t => t.priority === 'low').length, color: '#10b981' },
  ], [tasks]);

  // Monthly activity — last 6 months
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, 'month'));
    return {
      labels: months.map(m => m.format('MMM')),
      created:   months.map(m => tasks.filter(t => dayjs(t.createdAt).isSame(m, 'month')).length),
      completed: months.map(m => tasks.filter(t =>
        ['completed', 'delivered'].includes(t.status) && dayjs(t.updatedAt).isSame(m, 'month')
      ).length),
    };
  }, [tasks]);

  // Team workload
  const teamStats = useMemo(() => {
    const designers = users.filter(u => u.role === 'designer');
    const devs = users.filter(u => u.role === 'developer');
    return [
      ...designers.map(u => ({
        name: u.name, role: 'Designer', color: '#ec4899',
        active: tasks.filter(t => t.status === 'in_progress_designer').length,
        done: tasks.filter(t => ['completed', 'delivered'].includes(t.status)).length,
      })),
      ...devs.map(u => ({
        name: u.name, role: 'Développeur', color: '#10b981',
        active: tasks.filter(t => t.status === 'in_progress_dev').length,
        done: tasks.filter(t => ['completed', 'delivered'].includes(t.status)).length,
      })),
    ];
  }, [tasks, users]);

  // Recent completions
  const recentDone = useMemo(() =>
    tasks
      .filter(t => ['completed', 'delivered'].includes(t.status))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8),
    [tasks]);

  // Client ranking
  const clientStats = useMemo(() => {
    const map: Record<string, { email: string; total: number; done: number }> = {};
    tasks.forEach(t => {
      if (!map[t.clientEmail]) map[t.clientEmail] = { email: t.clientEmail, total: 0, done: 0 };
      map[t.clientEmail].total++;
      if (['completed', 'delivered'].includes(t.status)) map[t.clientEmail].done++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [tasks]);

  if (loading) return <Box className="flex justify-center p-12"><CircularProgress /></Box>;

  return (
    <Box className="flex flex-col gap-5">
      <Box>
        <Typography variant="h4" fontWeight={700}>Rapports & Statistiques</Typography>
        <Typography variant="body2" color="text.secondary">
          Analyse des performances au {dayjs().format('D MMMM YYYY')}
        </Typography>
      </Box>

      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
        <KpiCard label="Total projets"    value={kpis.total}     color="#6366f1" icon={<TrendingUpIcon />} />
        <KpiCard label="Projets actifs"   value={kpis.active}    color="#f59e0b" icon={<PendingActionsIcon />} />
        <KpiCard label="Terminés"         value={kpis.completed} color="#10b981" icon={<AssignmentTurnedInIcon />} />
        <KpiCard label="Ce mois-ci"       value={kpis.thisMonth} color="#ec4899" icon={<GroupsIcon />}
          sub={`Taux livraison: ${kpis.onTimeRate}%`} />
      </Box>

      {/* Charts row 1 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>

        {/* Status pie */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Répartition par statut</Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Distribution des {kpis.total} projets
            </Typography>
            {statusPieData.length === 0 ? (
              <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">Aucune donnée</Typography>
              </Box>
            ) : (
              <PieChart
                series={[{ innerRadius: 50, paddingAngle: 3, cornerRadius: 4, data: statusPieData }]}
                height={240}
                slotProps={{
                  legend: {
                    direction: 'column',
                    position: { horizontal: 'right', vertical: 'middle' },
                    itemMarkWidth: 10, itemMarkHeight: 10, markGap: 5, itemGap: 6,
                  },
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Priority bar */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Répartition par priorité</Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Nombre de projets par niveau
            </Typography>
            <BarChart
              xAxis={[{ scaleType: 'band', data: prioBarData.map(p => p.label) }]}
              series={[{ data: prioBarData.map(p => p.value) }]}
              colors={prioBarData.map(p => p.color)}
              height={240}
              margin={{ top: 10, bottom: 30, left: 35, right: 10 }}
            />
          </CardContent>
        </Card>
      </Box>

      {/* Monthly activity chart */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Activité mensuelle</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Projets créés vs terminés sur les 6 derniers mois
          </Typography>
          <BarChart
            xAxis={[{ scaleType: 'band', data: monthlyData.labels }]}
            series={[
              { data: monthlyData.created,   label: 'Créés',    color: palette.primary.main },
              { data: monthlyData.completed, label: 'Terminés', color: '#10b981' },
            ]}
            height={240}
            margin={{ top: 20, bottom: 30, left: 35, right: 20 }}
          />
        </CardContent>
      </Card>

      {/* Bottom row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>

        {/* Top clients */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Top clients</Typography>
            {clientStats.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>Aucun client.</Typography>
            ) : (
              <Box className="flex flex-col gap-0">
                {clientStats.map((c, i) => {
                  const pct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
                  return (
                    <Box key={c.email}>
                      {i > 0 && <Divider />}
                      <Box sx={{ py: 1.5 }}>
                        <Box className="flex items-center justify-between mb-1">
                          <Box className="flex items-center gap-2">
                            <Box sx={{
                              width: 30, height: 30, borderRadius: 1, flexShrink: 0,
                              bgcolor: '#6366f120', color: '#6366f1',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 800,
                            }}>
                              {c.email.charAt(0).toUpperCase()}
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{c.email.split('@')[0]}</Typography>
                              <Typography variant="caption" color="text.secondary">{c.total} projet(s)</Typography>
                            </Box>
                          </Box>
                          <Typography variant="caption" fontWeight={700} color="success.main">{pct}% livré</Typography>
                        </Box>
                        <Box sx={{ height: 5, borderRadius: 3, bgcolor: 'action.hover', overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: '#10b981', borderRadius: 3, transition: 'width 0.6s' }} />
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Team workload */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Charge de l'équipe</Typography>
            {teamStats.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>Aucun membre d'équipe.</Typography>
            ) : (
              <Box className="flex flex-col gap-2">
                {teamStats.map(m => (
                  <Box key={m.name} className="flex items-center gap-3" sx={{
                    p: 1.5, borderRadius: 1.5, bgcolor: 'action.hover',
                  }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      bgcolor: `${m.color}22`, color: m.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 13,
                    }}>
                      {m.name.charAt(0).toUpperCase()}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} noWrap>{m.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{m.role}</Typography>
                    </Box>
                    <Box className="flex gap-1">
                      <Chip label={`${m.active} actif`} size="small"
                        sx={{ bgcolor: `${m.color}18`, color: m.color, fontWeight: 600, fontSize: 10 }} />
                      <Chip label={`${m.done} fait`} size="small"
                        sx={{ bgcolor: '#10b98118', color: '#10b981', fontWeight: 600, fontSize: 10 }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Recent completions table */}
      <Card>
        <CardContent sx={{ pb: '0 !important' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Derniers projets terminés</Typography>
          {recentDone.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Aucun projet terminé pour le moment.
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Projet', 'Client', 'Statut', 'Priorité', 'Date fin'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentDone.map(t => (
                    <TableRow key={t._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{t.title}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{t.clientEmail.split('@')[0]}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={STATUS_LABEL[t.status] || t.status} size="small"
                          sx={{ bgcolor: `${STATUS_COLOR[t.status]}18`, color: STATUS_COLOR[t.status], fontWeight: 700, fontSize: 10 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" fontWeight={700} sx={{ color: PRIO_COLOR[t.priority] }}>
                          ● {t.priority === 'high' ? 'Urgent' : t.priority === 'medium' ? 'Moyen' : 'Faible'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(t.updatedAt).format('D MMM YYYY')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
