import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Chip, CircularProgress,
  Collapse, Divider, Typography,
} from '@mui/material';
import { getTasks } from '@/services/api';

type LogEntry = { time: string; msg: string };
type Task = {
  _id: string; title: string; status: string; createdAt: string;
  devNote?: string; log?: LogEntry[];
};

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getTasks({ statuses: 'review_chef_dev,done' })
      .then(setTasks)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box className="flex justify-center p-12"><CircularProgress /></Box>;

  return (
    <Box className="flex flex-col gap-4">
      <Box>
        <Typography variant="h4" fontWeight={700}>Historique</Typography>
        <Typography variant="body2" color="text.secondary">
          Journal de toutes vos tâches soumises et terminées
        </Typography>
      </Box>

      {!tasks.length && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          Aucun historique disponible.
        </Typography>
      )}

      <Box className="flex flex-col gap-3">
        {tasks.map(t => {
          const expanded = expandedId === t._id;
          const isDone = t.status === 'done';
          return (
            <Card key={t._id} sx={{ borderLeft: `3px solid ${isDone ? '#10b981' : '#f59e0b'}` }}>
              <CardContent
                sx={{ cursor: 'pointer', pb: 1 }}
                onClick={() => setExpandedId(expanded ? null : t._id)}
              >
                <Box className="flex items-start justify-between gap-2">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>{t.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(t.createdAt).toLocaleDateString('fr-FR')}
                    </Typography>
                  </Box>
                  <Chip
                    label={isDone ? 'Terminé' : 'En revue Chef'}
                    size="small"
                    sx={{
                      bgcolor: isDone ? '#10b98120' : '#f59e0b20',
                      color: isDone ? '#10b981' : '#f59e0b',
                      fontWeight: 600,
                    }}
                  />
                </Box>
                {t.devNote && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Rapport : {t.devNote}
                  </Typography>
                )}
              </CardContent>

              <Collapse in={expanded}>
                <Divider />
                <CardContent sx={{ pt: 1.5 }}>
                  {t.log && t.log.length > 0 ? (
                    <Box>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Journal des actions
                      </Typography>
                      {t.log.map((entry, i) => (
                        <Box key={i} className="flex gap-2 items-start" sx={{ mb: 0.75 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#6366f1', mt: 0.8, flexShrink: 0 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(entry.time).toLocaleString('fr-FR')}
                            </Typography>
                            <Typography variant="body2">{entry.msg}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Aucun journal disponible.</Typography>
                  )}
                </CardContent>
              </Collapse>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
