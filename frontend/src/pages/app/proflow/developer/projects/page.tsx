import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Chip, CircularProgress,
  Collapse, Divider, Typography,
} from '@mui/material';
import { getTasks } from '@/services/api';

type Task = {
  _id: string; title: string; description: string; status: string;
  priority: string; createdAt: string; deadline?: string;
  chefNote?: string; devNote?: string;
};

const PRIORITY_COLOR: Record<string, string> = {
  high: '#ef4444', medium: '#f59e0b', low: '#10b981',
};

const STATUS_LABEL: Record<string, string> = {
  assigned_dev: 'Assigné',
  in_progress_dev: 'En cours',
  review_chef_dev: 'En revue',
  done: 'Terminé',
};

const STATUS_COLOR: Record<string, string> = {
  assigned_dev: '#6366f1',
  in_progress_dev: '#10b981',
  review_chef_dev: '#f59e0b',
  done: '#64748b',
};

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getTasks({ statuses: 'assigned_dev,in_progress_dev,review_chef_dev,done' })
      .then(setTasks)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box className="flex justify-center p-12"><CircularProgress /></Box>;

  const grouped = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const key = t.status;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <Box className="flex flex-col gap-4">
      <Box>
        <Typography variant="h4" fontWeight={700}>Mes Projets</Typography>
        <Typography variant="body2" color="text.secondary">Tous vos projets de développement</Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <Card key={key} sx={{ borderLeft: `3px solid ${STATUS_COLOR[key]}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: STATUS_COLOR[key] }}>
                {(grouped[key] || []).length}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {!tasks.length && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          Aucun projet trouvé.
        </Typography>
      )}

      {Object.entries(STATUS_LABEL).map(([status, label]) => {
        const list = grouped[status] || [];
        if (!list.length) return null;
        return (
          <Box key={status}>
            <Divider sx={{ mb: 2 }}>
              <Chip label={`${label} (${list.length})`} size="small" sx={{ bgcolor: `${STATUS_COLOR[status]}20`, color: STATUS_COLOR[status], fontWeight: 600 }} />
            </Divider>
            <Box className="flex flex-col gap-2">
              {list.map(t => {
                const expanded = expandedId === t._id;
                return (
                  <Card key={t._id} sx={{ borderLeft: `3px solid ${STATUS_COLOR[t.status]}` }}>
                    <CardContent
                      sx={{ cursor: 'pointer', pb: expanded ? 1 : undefined }}
                      onClick={() => setExpandedId(expanded ? null : t._id)}
                    >
                      <Box className="flex items-start justify-between gap-2">
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight={700} noWrap>{t.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(t.createdAt).toLocaleDateString('fr-FR')}
                            {t.deadline && ` · Deadline: ${new Date(t.deadline).toLocaleDateString('fr-FR')}`}
                            {' · '}
                            <span style={{ color: PRIORITY_COLOR[t.priority], fontWeight: 600 }}>{t.priority}</span>
                          </Typography>
                        </Box>
                        <Chip
                          label={STATUS_LABEL[t.status] || t.status} size="small"
                          sx={{ bgcolor: `${STATUS_COLOR[t.status]}20`, color: STATUS_COLOR[t.status], fontWeight: 600 }}
                        />
                      </Box>
                    </CardContent>
                    <Collapse in={expanded}>
                      <Divider />
                      <CardContent sx={{ pt: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">{t.description}</Typography>
                        {t.chefNote && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Note chef : {t.chefNote}
                          </Typography>
                        )}
                        {t.devNote && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Votre note : {t.devNote}
                          </Typography>
                        )}
                      </CardContent>
                    </Collapse>
                  </Card>
                );
              })}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
