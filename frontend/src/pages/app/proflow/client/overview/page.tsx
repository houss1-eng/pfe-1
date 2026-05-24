import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Chip, CircularProgress,
  Divider, Typography, useTheme,
} from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { AuthContext } from '@/context/AuthContext';
import { getTasks, getContracts } from '@/services/api';

type Task = {
  _id: string; title: string; status: string;
  priority: string; createdAt: string; updatedAt: string;
};
type Contract = { _id: string; title: string; status: string; createdAt: string };

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  pending_chef:         { label: 'En attente',       color: '#6b7280' },
  assigned_designer:    { label: 'Design assigné',   color: '#ec4899' },
  in_progress_designer: { label: 'Design en cours',  color: '#ec4899' },
  review_chef_design:   { label: 'Révision interne', color: '#f59e0b' },
  review_client:        { label: 'À valider',        color: '#f59e0b' },
  rejected_client:      { label: 'Révision demandée',color: '#ef4444' },
  approved_client:      { label: 'Approuvé',         color: '#22c55e' },
  assigned_dev:         { label: 'Développement',    color: '#10b981' },
  in_progress_dev:      { label: 'En développement', color: '#10b981' },
  review_chef_dev:      { label: 'Révision dev',     color: '#f59e0b' },
  delivered:            { label: 'Livré',            color: '#6366f1' },
  completed:            { label: 'Terminé',          color: '#10b981' },
};

const PRIO_COLOR: Record<string, string> = {
  high: '#ef4444', medium: '#f59e0b', low: '#10b981',
};
const PRIO_LABEL: Record<string, string> = {
  high: 'Urgent', medium: 'Moyen', low: 'Faible',
};

function KpiCard({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: React.ReactNode;
}) {
  return (
    <Card sx={{ borderLeft: `4px solid ${color}`, height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: 2,
          bgcolor: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color, lineHeight: 1 }}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Page() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { palette } = useTheme();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTasks(), getContracts()])
      .then(([t, c]) => { setTasks(t); setContracts(c); })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    active:   tasks.filter(t => !['completed', 'delivered'].includes(t.status)).length,
    review:   tasks.filter(t => ['review_client', 'delivered'].includes(t.status)).length,
    inDev:    tasks.filter(t => ['assigned_dev', 'in_progress_dev', 'review_chef_dev'].includes(t.status)).length,
    completed:tasks.filter(t => ['completed', 'delivered'].includes(t.status)).length,
    total:    tasks.length,
  }), [tasks]);

  // Status distribution for pie chart
  const statusData = useMemo(() => {
    const groups: Record<string, { label: string; color: string; count: number }> = {};
    tasks.forEach(t => {
      const key = t.status;
      if (!groups[key]) groups[key] = { ...STATUS_INFO[key] || { label: key, color: '#6b7280' }, count: 0 };
      groups[key].count++;
    });
    return Object.values(groups)
      .filter(g => g.count > 0)
      .map(g => ({ label: g.label, value: g.count, color: g.color }));
  }, [tasks]);

  // Priority distribution for bar chart
  const prioData = useMemo(() => [
    { label: 'Urgent',  value: tasks.filter(t => t.priority === 'high').length,   color: '#ef4444' },
    { label: 'Moyen',   value: tasks.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
    { label: 'Faible',  value: tasks.filter(t => t.priority === 'low').length,    color: '#10b981' },
  ], [tasks]);

  // Recent 4 tasks
  const recentTasks = useMemo(() =>
    [...tasks].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5),
    [tasks]);

  // Contract stats
  const contractStats = useMemo(() => ({
    total:   contracts.length,
    toSign:  contracts.filter(c => c.status === 'sent').length,
    signed:  contracts.filter(c => c.status === 'signed').length,
    done:    contracts.filter(c => c.status === 'completed').length,
  }), [contracts]);

  if (loading) return <Box className="flex justify-center p-12"><CircularProgress /></Box>;

  return (
    <Box className="flex flex-col gap-5">

      {/* Header */}
      <Box className="flex items-center justify-between flex-wrap gap-2">
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Bonjour, {user?.name?.split(' ')[0]} 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vue d'ensemble de votre espace client
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<AddIcon />} size="small"
          onClick={() => navigate('/proflow/client/new-project')}
        >
          Nouveau projet
        </Button>
      </Box>

      {/* KPI cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
        <KpiCard label="Projets actifs"        value={stats.active}    color="#6366f1" icon={<FolderOpenIcon />} />
        <KpiCard label="En attente validation" value={stats.review}    color="#f59e0b" icon={<PendingActionsIcon />} />
        <KpiCard label="En développement"      value={stats.inDev}     color="#10b981" icon={<RocketLaunchIcon />} />
        <KpiCard label="Livrés"                value={stats.completed} color="#6b7280" icon={<TaskAltIcon />} />
      </Box>

      {/* Charts row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>

        {/* Status pie chart */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
              Répartition par statut
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Distribution de vos {stats.total} projet(s)
            </Typography>
            {statusData.length === 0 ? (
              <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">Aucun projet</Typography>
              </Box>
            ) : (
              <PieChart
                series={[{
                  innerRadius: 45,
                  paddingAngle: 3,
                  cornerRadius: 4,
                  data: statusData,
                }]}
                height={220}
                slotProps={{
                  legend: {
                    direction: 'column',
                    position: { horizontal: 'right', vertical: 'middle' },
                    itemMarkWidth: 10,
                    itemMarkHeight: 10,
                    markGap: 6,
                    itemGap: 8,
                  },
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Priority bar chart */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
              Répartition par priorité
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Nombre de projets par niveau de priorité
            </Typography>
            <BarChart
              xAxis={[{ scaleType: 'band', data: prioData.map(p => p.label) }]}
              series={[{
                data: prioData.map(p => p.value),
                color: palette.primary.main,
              }]}
              height={220}
              margin={{ top: 10, bottom: 30, left: 30, right: 10 }}
              colors={prioData.map(p => p.color)}
            />
          </CardContent>
        </Card>
      </Box>

      {/* Bottom row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>

        {/* Recent projects */}
        <Card>
          <CardContent>
            <Box className="flex items-center justify-between mb-3">
              <Typography variant="subtitle1" fontWeight={700}>Activité récente</Typography>
              <Button size="small" variant="text" onClick={() => navigate('/proflow/client/dashboard')}>
                Voir tout →
              </Button>
            </Box>
            {recentTasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                Aucun projet pour le moment.
              </Typography>
            ) : (
              <Box className="flex flex-col gap-0">
                {recentTasks.map((t, i) => {
                  const info = STATUS_INFO[t.status] || { label: t.status, color: '#6b7280' };
                  return (
                    <Box key={t._id}>
                      {i > 0 && <Divider />}
                      <Box
                        className="flex items-center justify-between gap-3 py-2"
                        sx={{ cursor: 'pointer', borderRadius: 1, px: 1, '&:hover': { bgcolor: 'action.hover' } }}
                        onClick={() => navigate('/proflow/client/dashboard')}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>{t.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Modifié le {new Date(t.updatedAt).toLocaleDateString('fr-FR')} ·{' '}
                            <span style={{ color: PRIO_COLOR[t.priority], fontWeight: 600 }}>
                              {PRIO_LABEL[t.priority]}
                            </span>
                          </Typography>
                        </Box>
                        <Chip
                          label={info.label} size="small"
                          sx={{ bgcolor: `${info.color}18`, color: info.color, fontWeight: 600, flexShrink: 0 }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Contracts summary */}
        <Card>
          <CardContent>
            <Box className="flex items-center justify-between mb-3">
              <Typography variant="subtitle1" fontWeight={700}>Contrats</Typography>
              <Button size="small" variant="text" onClick={() => navigate('/proflow/client/contracts')}>
                Voir tout →
              </Button>
            </Box>

            {contractStats.total === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                Aucun contrat.
              </Typography>
            ) : (
              <Box className="flex flex-col gap-2">
                {[
                  { label: 'Total',      value: contractStats.total,  color: '#6366f1' },
                  { label: 'À signer',   value: contractStats.toSign, color: '#f59e0b' },
                  { label: 'Signés',     value: contractStats.signed, color: '#22c55e' },
                  { label: 'Terminés',   value: contractStats.done,   color: '#6b7280' },
                ].map(item => (
                  <Box key={item.label} className="flex items-center justify-between" sx={{ py: 0.5 }}>
                    <Box className="flex items-center gap-2">
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} sx={{ color: item.color }}>{item.value}</Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 1 }} />

                {/* Completion bar */}
                <Box>
                  <Box className="flex justify-between mb-1">
                    <Typography variant="caption" color="text.secondary">Taux de complétion</Typography>
                    <Typography variant="caption" fontWeight={700}>
                      {contractStats.total > 0
                        ? Math.round(((contractStats.signed + contractStats.done) / contractStats.total) * 100)
                        : 0}%
                    </Typography>
                  </Box>
                  <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', overflow: 'hidden' }}>
                    <Box sx={{
                      height: '100%', borderRadius: 3, bgcolor: '#22c55e',
                      width: `${contractStats.total > 0
                        ? Math.round(((contractStats.signed + contractStats.done) / contractStats.total) * 100)
                        : 0}%`,
                      transition: 'width 0.6s ease',
                    }} />
                  </Box>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
