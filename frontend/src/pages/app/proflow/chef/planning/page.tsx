import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import {
  Box, Button, Card, CardContent, Chip, CircularProgress,
  Divider, IconButton, Tooltip, Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import { getTasks } from '@/services/api';

dayjs.locale('fr');

type Task = {
  _id: string; title: string; status: string; priority: string;
  clientEmail: string; createdAt: string; deadline?: string;
};

const STATUS_COLOR: Record<string, string> = {
  pending_chef: '#6b7280', assigned_designer: '#ec4899', in_progress_designer: '#ec4899',
  review_chef_design: '#f59e0b', review_client: '#f59e0b', rejected_client: '#ef4444',
  approved_client: '#22c55e', assigned_dev: '#6366f1', in_progress_dev: '#6366f1',
  review_chef_dev: '#f59e0b', delivered: '#8b5cf6', completed: '#10b981',
};

const STATUS_LABEL: Record<string, string> = {
  pending_chef: 'En attente', assigned_designer: 'Designer', in_progress_designer: 'Design en cours',
  review_chef_design: 'Révision design', review_client: 'Validation client', rejected_client: 'Rejeté',
  approved_client: 'Approuvé', assigned_dev: 'Dev assigné', in_progress_dev: 'Dev en cours',
  review_chef_dev: 'Révision dev', delivered: 'Livré', completed: 'Terminé',
};

const PRIO_COLOR: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf('month'));
  const [selected, setSelected] = useState<string | null>(null); // selected date YYYY-MM-DD

  useEffect(() => {
    getTasks().then(setTasks).finally(() => setLoading(false));
  }, []);

  // Build calendar grid: 6 weeks × 7 days
  const calendarDays = useMemo(() => {
    const start = currentMonth.startOf('month').startOf('isoWeek');
    const days: dayjs.Dayjs[] = [];
    for (let i = 0; i < 42; i++) days.push(start.add(i, 'day'));
    return days;
  }, [currentMonth]);

  // Map tasks by deadline date
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(t => {
      const d = t.deadline ? dayjs(t.deadline).format('YYYY-MM-DD') : null;
      if (d) {
        if (!map[d]) map[d] = [];
        map[d].push(t);
      }
    });
    return map;
  }, [tasks]);

  // Tasks for selected day
  const selectedTasks = selected ? (tasksByDate[selected] || []) : [];

  // Upcoming deadlines (next 30 days, not completed)
  const upcoming = useMemo(() => {
    const now = dayjs();
    return tasks
      .filter(t => t.deadline && !['completed', 'delivered'].includes(t.status))
      .map(t => ({ ...t, daysLeft: dayjs(t.deadline).diff(now, 'day') }))
      .filter(t => t.daysLeft >= 0 && t.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [tasks]);

  // Overdue tasks
  const overdue = useMemo(() =>
    tasks.filter(t => t.deadline && dayjs(t.deadline).isBefore(dayjs(), 'day') && !['completed', 'delivered'].includes(t.status)),
    [tasks]);

  if (loading) return <Box className="flex justify-center p-12"><CircularProgress /></Box>;

  return (
    <Box className="flex flex-col gap-4">
      <Typography variant="h4" fontWeight={700}>Planning & Calendrier</Typography>
      <Typography variant="body2" color="text.secondary">
        Visualisez les échéances et la charge de travail de l'équipe
      </Typography>

      {/* Summary row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {[
          { label: 'Projets avec échéance', value: tasks.filter(t => t.deadline).length, color: '#6366f1' },
          { label: 'Échéances proches (30j)', value: upcoming.length, color: '#f59e0b' },
          { label: 'En retard', value: overdue.length, color: '#ef4444' },
        ].map(k => (
          <Card key={k.label} sx={{ borderLeft: `4px solid ${k.color}` }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">{k.label}</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: k.color }}>{k.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' }, gap: 2, alignItems: 'start' }}>

        {/* Calendar */}
        <Card>
          <CardContent>
            {/* Month navigation */}
            <Box className="flex items-center justify-between mb-3">
              <Box className="flex items-center gap-2">
                <IconButton size="small" onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))}>
                  <ChevronLeftIcon />
                </IconButton>
                <Typography variant="h6" fontWeight={700} sx={{ minWidth: 180, textAlign: 'center', textTransform: 'capitalize' }}>
                  {currentMonth.format('MMMM YYYY')}
                </Typography>
                <IconButton size="small" onClick={() => setCurrentMonth(m => m.add(1, 'month'))}>
                  <ChevronRightIcon />
                </IconButton>
              </Box>
              <Button
                size="small" variant="outlined" startIcon={<TodayIcon />}
                onClick={() => { setCurrentMonth(dayjs().startOf('month')); setSelected(dayjs().format('YYYY-MM-DD')); }}
              >
                Aujourd'hui
              </Button>
            </Box>

            {/* Day headers */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1 }}>
              {DAYS_FR.map(d => (
                <Typography key={d} variant="caption" fontWeight={700} color="text.secondary"
                  sx={{ textAlign: 'center', py: 0.5 }}>
                  {d}
                </Typography>
              ))}
            </Box>

            {/* Calendar grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
              {calendarDays.map(day => {
                const key = day.format('YYYY-MM-DD');
                const isToday = day.isSame(dayjs(), 'day');
                const isCurrentMonth = day.isSame(currentMonth, 'month');
                const dayTasks = tasksByDate[key] || [];
                const isSelected = selected === key;
                const hasOverdue = dayTasks.some(t => !['completed', 'delivered'].includes(t.status));

                return (
                  <Box
                    key={key}
                    onClick={() => setSelected(isSelected ? null : key)}
                    sx={{
                      minHeight: 72, p: 0.5, borderRadius: 1, cursor: 'pointer',
                      border: '1px solid', borderColor: isSelected ? 'primary.main' : 'transparent',
                      bgcolor: isSelected ? 'primary.main' + '10' : isToday ? 'action.hover' : 'transparent',
                      opacity: isCurrentMonth ? 1 : 0.35,
                      '&:hover': { bgcolor: isSelected ? 'primary.main' + '15' : 'action.hover' },
                      transition: 'all 0.15s',
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={isToday ? 800 : 500}
                      sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 22, height: 22, borderRadius: '50%',
                        bgcolor: isToday ? 'primary.main' : 'transparent',
                        color: isToday ? '#fff' : isCurrentMonth ? 'text.primary' : 'text.disabled',
                        fontSize: 11, mb: 0.5,
                      }}
                    >
                      {day.date()}
                    </Typography>
                    {dayTasks.slice(0, 2).map(t => (
                      <Tooltip key={t._id} title={t.title} arrow>
                        <Box sx={{
                          fontSize: 9, fontWeight: 600, px: 0.5, py: 0.25, borderRadius: 0.5, mb: 0.25,
                          bgcolor: `${STATUS_COLOR[t.status] || '#6b7280'}25`,
                          color: STATUS_COLOR[t.status] || '#6b7280',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {t.title}
                        </Box>
                      </Tooltip>
                    ))}
                    {dayTasks.length > 2 && (
                      <Typography variant="caption" sx={{ fontSize: 9, color: 'text.secondary' }}>
                        +{dayTasks.length - 2} autre{dayTasks.length - 2 > 1 ? 's' : ''}
                      </Typography>
                    )}
                    {dayTasks.length > 0 && hasOverdue && !isCurrentMonth && null}
                  </Box>
                );
              })}
            </Box>

            {/* Selected day detail */}
            {selected && selectedTasks.length > 0 && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Échéances du {dayjs(selected).format('D MMMM YYYY')}
                </Typography>
                <Box className="flex flex-col gap-1">
                  {selectedTasks.map(t => (
                    <Box key={t._id} className="flex items-center justify-between gap-2 p-2 rounded"
                      sx={{ bgcolor: 'action.hover' }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{t.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{t.clientEmail}</Typography>
                      </Box>
                      <Box className="flex gap-1">
                        <Chip label={STATUS_LABEL[t.status] || t.status} size="small"
                          sx={{ bgcolor: `${STATUS_COLOR[t.status]}20`, color: STATUS_COLOR[t.status], fontWeight: 600, fontSize: 10 }} />
                        <Chip label={t.priority} size="small"
                          sx={{ bgcolor: `${PRIO_COLOR[t.priority]}20`, color: PRIO_COLOR[t.priority], fontWeight: 600, fontSize: 10 }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            {selected && selectedTasks.length === 0 && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                  Aucune échéance ce jour.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Right panel */}
        <Box className="flex flex-col gap-2">

          {/* Overdue */}
          {overdue.length > 0 && (
            <Card sx={{ borderTop: '3px solid #ef4444' }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={700} color="error" sx={{ mb: 1.5 }}>
                  ⚠ En retard ({overdue.length})
                </Typography>
                <Box className="flex flex-col gap-1">
                  {overdue.map(t => (
                    <Box key={t._id} sx={{ p: 1, bgcolor: '#ef444410', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{t.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Échéance: {dayjs(t.deadline).format('D MMM YYYY')} · {dayjs(t.deadline).fromNow()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Upcoming deadlines */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Prochaines échéances
              </Typography>
              {upcoming.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  Aucune échéance dans les 30 prochains jours.
                </Typography>
              ) : (
                <Box className="flex flex-col gap-0">
                  {upcoming.map((t, i) => (
                    <Box key={t._id}>
                      {i > 0 && <Divider />}
                      <Box sx={{ py: 1.5 }}>
                        <Box className="flex items-start justify-between gap-1">
                          <Typography variant="body2" fontWeight={600} sx={{ flex: 1, minWidth: 0 }} noWrap>
                            {t.title}
                          </Typography>
                          <Chip
                            label={t.daysLeft === 0 ? "Aujourd'hui" : `J-${t.daysLeft}`}
                            size="small"
                            sx={{
                              bgcolor: t.daysLeft <= 3 ? '#ef444420' : t.daysLeft <= 7 ? '#f59e0b20' : '#6366f120',
                              color: t.daysLeft <= 3 ? '#ef4444' : t.daysLeft <= 7 ? '#f59e0b' : '#6366f1',
                              fontWeight: 700, fontSize: 10, flexShrink: 0,
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {t.clientEmail.split('@')[0]} · {dayjs(t.deadline).format('D MMM YYYY')}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip label={STATUS_LABEL[t.status] || t.status} size="small"
                            sx={{ bgcolor: `${STATUS_COLOR[t.status]}18`, color: STATUS_COLOR[t.status], fontWeight: 600, fontSize: 10 }} />
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* No deadline tasks */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Sans échéance ({tasks.filter(t => !t.deadline && !['completed', 'delivered'].includes(t.status)).length})
              </Typography>
              <Box className="flex flex-col gap-1">
                {tasks
                  .filter(t => !t.deadline && !['completed', 'delivered'].includes(t.status))
                  .slice(0, 5)
                  .map(t => (
                    <Box key={t._id} className="flex items-center justify-between gap-2">
                      <Typography variant="caption" noWrap sx={{ flex: 1 }}>{t.title}</Typography>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_COLOR[t.status] || '#6b7280', flexShrink: 0 }} />
                    </Box>
                  ))}
                {tasks.filter(t => !t.deadline && !['completed', 'delivered'].includes(t.status)).length === 0 && (
                  <Typography variant="caption" color="text.secondary">Tous les projets ont une échéance.</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
