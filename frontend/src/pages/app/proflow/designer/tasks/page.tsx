import { useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Collapse, Divider, TextField, ToggleButton, ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { getTasks, updateTask, uploadDesignerFiles, API_URL } from '@/services/api';
import { useConfirm } from '@/components/common/ConfirmDialog';

type Task = {
  _id: string; title: string; description: string; status: string;
  priority: string; createdAt: string; deadline?: string;
  chefNote?: string; designerNote?: string;
  designerFiles?: { name: string; url: string }[];
  log?: { time: string; msg: string }[];
};

const PRIORITY_COLOR: Record<string, string> = {
  high: '#ef4444', medium: '#f59e0b', low: '#10b981',
};

const STATUS_LABEL: Record<string, string> = {
  assigned_designer: 'Assigné',
  in_progress_designer: 'En cours',
  review_chef_design: 'Revue chef',
};

export default function Page() {
  const [assigned, setAssigned] = useState<Task[]>([]);
  const [doneTasks, setDoneTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, FileList | null>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { confirm, dialog } = useConfirm();

  const fetchDone = async () => {
    try {
      const data = await getTasks({ status: 'review_chef_design' });
      setDoneTasks(data);
    } catch { /* ignore */ }
  };

  const fetchAssigned = async (sf: string, q: string) => {
    try {
      const params: Record<string, string> = {};
      if (sf) params.status = sf;
      else params.statuses = 'assigned_designer,in_progress_designer';
      if (q) params.search = q;
      const data = await getTasks(params);
      setAssigned(data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    Promise.all([fetchDone(), fetchAssigned('', '')]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchAssigned(statusFilter, search), search ? 400 : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [statusFilter, search]);

  const updateStatus = async (id: string, status: string, logMsg: string, noteStr?: string) => {
    if (!await confirm('Confirmer cette action ?')) return;
    setError('');
    try {
      const taskFiles = files[id];
      if (taskFiles && taskFiles.length > 0) {
        setUploading(u => ({ ...u, [id]: true }));
        const fd = new FormData();
        Array.from(taskFiles).forEach(f => fd.append('files', f));
        await uploadDesignerFiles(id, fd);
        setUploading(u => ({ ...u, [id]: false }));
        setFiles(f => ({ ...f, [id]: null }));
      }
      const payload: Parameters<typeof updateTask>[1] = { status, logMsg };
      if (noteStr !== undefined) payload.designerNote = noteStr;
      await updateTask(id, payload);
      fetchAssigned(statusFilter, search);
      fetchDone();
    } catch {
      setError('Erreur de mise à jour');
      setUploading(u => ({ ...u, [id]: false }));
    }
  };

  if (loading) return <Box className="flex justify-center p-12"><CircularProgress /></Box>;

  return (
    <Box className="flex flex-col gap-4">
      {dialog}
      <Typography variant="h4" fontWeight={700}>Espace Designer</Typography>
      <Typography variant="body2" color="text.secondary">Vos projets assignés et livrables design</Typography>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {[
          { label: 'À travailler', value: assigned.length, color: '#ec4899' },
          { label: 'En revue Chef', value: doneTasks.length, color: '#f59e0b' },
          { label: 'Total assignés', value: assigned.length + doneTasks.length, color: '#10b981' },
        ].map(k => (
          <Card key={k.label} sx={{ borderLeft: `3px solid ${k.color}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">{k.label}</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: k.color }}>{k.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Filters */}
      <Box className="flex flex-wrap items-center gap-2">
        <TextField
          size="small" placeholder="Rechercher…" value={search}
          onChange={e => setSearch(e.target.value)} sx={{ width: 200 }}
        />
        <ToggleButtonGroup size="small" value={statusFilter} exclusive onChange={(_, v) => setStatusFilter(v ?? '')}>
          <ToggleButton value="">Tous</ToggleButton>
          <ToggleButton value="assigned_designer">Assigné</ToggleButton>
          <ToggleButton value="in_progress_designer">En cours</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Assigned tasks */}
      <Typography variant="h6" fontWeight={600}>Projets assignés ({assigned.length})</Typography>
      <Box className="flex flex-col gap-2">
        {!assigned.length && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Aucun projet à traiter.
          </Typography>
        )}
        {assigned.map(t => {
          const inProgress = t.status === 'in_progress_designer';
          const expanded = expandedId === t._id;
          return (
            <Card key={t._id}>
              <CardContent
                sx={{ pb: 1, cursor: 'pointer' }}
                onClick={() => setExpandedId(expanded ? null : t._id)}
              >
                <Box className="flex items-start justify-between gap-2">
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>{t.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(t.createdAt).toLocaleDateString('fr-FR')} ·{' '}
                      <span style={{ color: PRIORITY_COLOR[t.priority], fontWeight: 600 }}>{t.priority}</span>
                    </Typography>
                  </Box>
                  <Chip
                    label={STATUS_LABEL[t.status] || t.status} size="small"
                    sx={{ bgcolor: '#ec489920', color: '#ec4899', fontWeight: 600 }}
                  />
                </Box>
                {t.chefNote && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Note chef: {t.chefNote}
                  </Typography>
                )}
              </CardContent>

              <Collapse in={expanded}>
                <Divider />
                <CardContent sx={{ pt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t.description}</Typography>

                  {/* Existing files */}
                  {t.designerFiles && t.designerFiles.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 1 }}>Fichiers déjà joints</Typography>
                      <Box className="flex flex-wrap gap-1">
                        {t.designerFiles.map((f, i) => (
                          <Button key={i} size="small" variant="outlined" href={`${API_URL}${f.url}`} target="_blank">{f.name}</Button>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Actions */}
                  {inProgress && (
                    <Box sx={{ mb: 2 }}>
                      <TextField
                        fullWidth multiline rows={2} size="small"
                        label="Note de livraison"
                        placeholder="Décrivez ce qui a été réalisé…"
                        value={notes[t._id] ?? t.designerNote ?? ''}
                        onChange={e => setNotes(n => ({ ...n, [t._id]: e.target.value }))}
                        sx={{ mb: 1 }}
                      />
                      <Button variant="outlined" size="small" component="label">
                        Joindre fichiers
                        <input type="file" multiple hidden onChange={e => setFiles(f => ({ ...f, [t._id]: e.target.files }))} />
                      </Button>
                      {files[t._id] && files[t._id]!.length > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          {files[t._id]!.length} fichier(s) sélectionné(s)
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Box className="flex gap-2">
                    {!inProgress && (
                      <Button size="small" variant="contained" color="primary"
                        onClick={() => updateStatus(t._id, 'in_progress_designer', 'Designer a commencé le travail')}>
                        Commencer
                      </Button>
                    )}
                    {inProgress && (
                      <Button size="small" variant="contained" color="success"
                        disabled={uploading[t._id]}
                        onClick={() => updateStatus(t._id, 'review_chef_design', `Designer a soumis le design — "${notes[t._id] || ''}"`, notes[t._id] || '')}>
                        {uploading[t._id] ? <CircularProgress size={14} color="inherit" /> : 'Soumettre au Chef'}
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Collapse>
            </Card>
          );
        })}
      </Box>

      {/* In review section */}
      {doneTasks.length > 0 && (
        <>
          <Divider />
          <Typography variant="h6" fontWeight={600}>En attente de revue Chef ({doneTasks.length})</Typography>
          <Box className="flex flex-col gap-2">
            {doneTasks.map(t => (
              <Card key={t._id} sx={{ borderLeft: '3px solid #f59e0b', opacity: 0.85 }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box className="flex items-center justify-between">
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>{t.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(t.createdAt).toLocaleDateString('fr-FR')}
                      </Typography>
                    </Box>
                    <Chip label="Revue chef" size="small" sx={{ bgcolor: '#f59e0b20', color: '#f59e0b', fontWeight: 600 }} />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
