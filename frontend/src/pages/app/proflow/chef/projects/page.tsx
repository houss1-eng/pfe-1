import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Collapse, Divider, FormControl, InputLabel, MenuItem, Select,
  TextField, Typography,
} from '@mui/material';
import { getTasks, getUsers, updateTask, assignTask, uploadChefFiles, API_URL } from '@/services/api';

const ACTION_STATUSES = ['pending_chef', 'review_chef_design', 'approved_client', 'rejected_client', 'review_chef_dev'];

const STATUS_LABELS: Record<string, string> = {
  pending_chef: 'Nouvelle demande', review_chef_design: 'Révision Design',
  approved_client: 'Approuvé Client', rejected_client: 'Rejeté Client',
  review_chef_dev: 'Révision Dev',
};

const STATUS_COLOR: Record<string, string> = {
  pending_chef: '#6366f1', review_chef_design: '#f59e0b',
  approved_client: '#22c55e', rejected_client: '#ef4444', review_chef_dev: '#f59e0b',
};

const PRIORITY_COLOR: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

type Task = {
  _id: string; title: string; description: string; status: string;
  priority: string; clientEmail: string; createdAt: string;
  chefNote?: string; designerNote?: string; devNote?: string;
  designerFiles?: { name: string; url: string }[];
  devFiles?: { name: string; url: string }[];
  log?: { time: string; msg: string }[];
};
type User = { _id: string; name: string; email: string; role: string };

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chefNotes, setChefNotes] = useState<Record<string, string>>({});
  const [chefFiles, setChefFiles] = useState<Record<string, FileList | null>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [assignDesigner, setAssignDesigner] = useState<Record<string, string>>({});
  const [assignDev, setAssignDev] = useState<Record<string, string>>({});
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(() => {
    Promise.all([getTasks(), getUsers()])
      .then(([t, u]) => { setTasks(t); setUsers(u); })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccess(''), 3500);
  };

  const doAction = async (id: string, action: () => Promise<unknown>, msg: string) => {
    if (!window.confirm('Confirmer cette action ?')) return;
    setError('');
    try {
      const taskFiles = chefFiles[id];
      if (taskFiles && taskFiles.length > 0) {
        setUploading(u => ({ ...u, [id]: true }));
        const fd = new FormData();
        Array.from(taskFiles).forEach(f => fd.append('files', f));
        await uploadChefFiles(id, fd);
        setUploading(u => ({ ...u, [id]: false }));
        setChefFiles(f => ({ ...f, [id]: null }));
      }
      await action();
      showSuccess(msg);
      load();
    } catch {
      setError('Erreur lors de l\'action');
      setUploading(u => ({ ...u, [id]: false }));
    }
  };

  const designers = users.filter(u => u.role === 'designer');
  const devs = users.filter(u => u.role === 'developer');
  const actionTasks = tasks.filter(t => ACTION_STATUSES.includes(t.status));

  if (loading) return <Box className="flex justify-center p-12"><CircularProgress /></Box>;

  return (
    <Box className="flex flex-col gap-4">
      <Typography variant="h4" fontWeight={700}>Actions requises</Typography>
      <Typography variant="body2" color="text.secondary">Projets nécessitant votre intervention</Typography>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Stats row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
        {[
          { label: 'Total projets', value: tasks.length, color: '#6366f1' },
          { label: 'Action requise', value: actionTasks.length, color: '#f59e0b' },
          { label: 'En production', value: tasks.filter(t => ['assigned_designer','in_progress_designer','assigned_dev','in_progress_dev'].includes(t.status)).length, color: '#ec4899' },
          { label: 'Terminés', value: tasks.filter(t => t.status === 'completed').length, color: '#10b981' },
        ].map(k => (
          <Card key={k.label} sx={{ borderLeft: `3px solid ${k.color}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">{k.label}</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: k.color }}>{k.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Typography variant="h6" fontWeight={600}>Projets nécessitant votre action ({actionTasks.length})</Typography>

      {!actionTasks.length && (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography fontSize={32} sx={{ mb: 1 }}>🎉</Typography>
          <Typography variant="body2" color="text.secondary">Aucune action requise pour l'instant.</Typography>
        </Card>
      )}

      <Box className="flex flex-col gap-3">
        {actionTasks.map(t => {
          const color = STATUS_COLOR[t.status] || '#6b7280';
          const expanded = expandedId === t._id;

          return (
            <Card key={t._id} sx={{ borderLeft: `3px solid ${color}` }}>
              {/* Card header - click to expand */}
              <CardContent
                sx={{ pb: 1, cursor: 'pointer' }}
                onClick={() => setExpandedId(expanded ? null : t._id)}
              >
                <Box className="flex items-start justify-between gap-3">
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>{t.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.clientEmail} · {new Date(t.createdAt).toLocaleDateString('fr-FR')} ·{' '}
                      <span style={{ color: PRIORITY_COLOR[t.priority], fontWeight: 600 }}>{t.priority}</span>
                    </Typography>
                  </Box>
                  <Chip
                    label={STATUS_LABELS[t.status] || t.status} size="small"
                    sx={{ bgcolor: `${color}20`, color, fontWeight: 700, flexShrink: 0 }}
                  />
                </Box>
              </CardContent>

              <Collapse in={expanded}>
                <Divider />
                <CardContent sx={{ pt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t.description}</Typography>

                  {/* Designer files to review */}
                  {(t.designerFiles?.length || 0) > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 1 }}>Fichiers Designer</Typography>
                      <Box className="flex flex-wrap gap-1">
                        {t.designerFiles!.map((f, i) => (
                          <Button key={i} size="small" variant="outlined" href={`${API_URL}${f.url}`} target="_blank">{f.name}</Button>
                        ))}
                      </Box>
                      {t.designerNote && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          Note designer: {t.designerNote}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Dev files to review */}
                  {(t.devFiles?.length || 0) > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 1 }}>Fichiers Développeur</Typography>
                      <Box className="flex flex-wrap gap-1">
                        {t.devFiles!.map((f, i) => (
                          <Button key={i} size="small" variant="outlined" href={`${API_URL}${f.url}`} target="_blank">{f.name}</Button>
                        ))}
                      </Box>
                      {t.devNote && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          Note dev: {t.devNote}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* ── PENDING_CHEF: assign designer ── */}
                  {t.status === 'pending_chef' && (
                    <Box className="flex flex-col gap-2">
                      <FormControl size="small" fullWidth>
                        <InputLabel>Choisir un Designer</InputLabel>
                        <Select
                          value={assignDesigner[t._id] || ''}
                          onChange={e => setAssignDesigner(a => ({ ...a, [t._id]: e.target.value }))}
                          label="Choisir un Designer"
                        >
                          <MenuItem value=''>— Sélectionner —</MenuItem>
                          {designers.map(d => <MenuItem key={d._id} value={d._id}>{d.name} ({d.email})</MenuItem>)}
                        </Select>
                      </FormControl>
                      <Button
                        variant="contained" size="small" disabled={!assignDesigner[t._id] || uploading[t._id]}
                        onClick={() => doAction(t._id, () => assignTask(t._id, { designerId: assignDesigner[t._id] }), 'Designer assigné avec succès')}
                      >
                        Assigner au Designer
                      </Button>
                    </Box>
                  )}

                  {/* ── REVIEW_CHEF_DESIGN: note + files + send/return ── */}
                  {t.status === 'review_chef_design' && (
                    <Box className="flex flex-col gap-2">
                      <TextField
                        fullWidth size="small" multiline rows={2}
                        label="Note de livraison pour le client"
                        placeholder="Commentaires sur les maquettes..."
                        value={chefNotes[t._id] ?? t.chefNote ?? ''}
                        onChange={e => setChefNotes(n => ({ ...n, [t._id]: e.target.value }))}
                      />
                      <Box className="flex items-center gap-2">
                        <Button variant="outlined" size="small" component="label">
                          Joindre fichiers
                          <input type="file" multiple hidden onChange={e => setChefFiles(f => ({ ...f, [t._id]: e.target.files }))} />
                        </Button>
                        {chefFiles[t._id] && chefFiles[t._id]!.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {chefFiles[t._id]!.length} fichier(s)
                          </Typography>
                        )}
                      </Box>
                      <Box className="flex gap-2">
                        <Button
                          variant="contained" color="warning" size="small" disabled={uploading[t._id]}
                          onClick={() => doAction(t._id, () => updateTask(t._id, { status: 'review_client', logMsg: 'Chef: Maquettes envoyées au client', chefNote: chefNotes[t._id] || t.chefNote }), 'Envoyé au client')}
                        >
                          {uploading[t._id] ? <CircularProgress size={14} color="inherit" /> : 'Envoyer au Client'}
                        </Button>
                        <Button
                          variant="outlined" color="error" size="small"
                          onClick={() => doAction(t._id, () => updateTask(t._id, { status: 'assigned_designer', logMsg: 'Chef: Design retourné au Designer pour corrections' }), 'Retourné au Designer')}
                        >
                          Retourner au Designer
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* ── APPROVED_CLIENT: assign dev ── */}
                  {t.status === 'approved_client' && (
                    <Box className="flex flex-col gap-2">
                      <FormControl size="small" fullWidth>
                        <InputLabel>Choisir un Développeur</InputLabel>
                        <Select
                          value={assignDev[t._id] || ''}
                          onChange={e => setAssignDev(a => ({ ...a, [t._id]: e.target.value }))}
                          label="Choisir un Développeur"
                        >
                          <MenuItem value=''>— Sélectionner —</MenuItem>
                          {devs.map(d => <MenuItem key={d._id} value={d._id}>{d.name} ({d.email})</MenuItem>)}
                        </Select>
                      </FormControl>
                      <Button
                        variant="contained" color="info" size="small" disabled={!assignDev[t._id] || uploading[t._id]}
                        onClick={() => doAction(t._id, () => assignTask(t._id, { devId: assignDev[t._id] }), 'Développeur assigné avec succès')}
                      >
                        Assigner au Développeur
                      </Button>
                    </Box>
                  )}

                  {/* ── REJECTED_CLIENT: re-assign designer ── */}
                  {t.status === 'rejected_client' && (
                    <Button
                      variant="contained" color="warning" size="small"
                      onClick={() => doAction(t._id, () => updateTask(t._id, { status: 'assigned_designer', logMsg: 'Chef: Projet re-assigné au Designer (révision client)' }), 'Re-assigné au Designer')}
                    >
                      Re-assigner au Designer
                    </Button>
                  )}

                  {/* ── REVIEW_CHEF_DEV: note + files + deliver/return ── */}
                  {t.status === 'review_chef_dev' && (
                    <Box className="flex flex-col gap-2">
                      <TextField
                        fullWidth size="small" multiline rows={2}
                        label="Note de livraison finale"
                        placeholder="Commentaires sur le développement livré..."
                        value={chefNotes[t._id] ?? t.chefNote ?? ''}
                        onChange={e => setChefNotes(n => ({ ...n, [t._id]: e.target.value }))}
                      />
                      <Box className="flex items-center gap-2">
                        <Button variant="outlined" size="small" component="label">
                          Joindre fichiers
                          <input type="file" multiple hidden onChange={e => setChefFiles(f => ({ ...f, [t._id]: e.target.files }))} />
                        </Button>
                        {chefFiles[t._id] && chefFiles[t._id]!.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {chefFiles[t._id]!.length} fichier(s)
                          </Typography>
                        )}
                      </Box>
                      <Box className="flex gap-2">
                        <Button
                          variant="contained" color="success" size="small" disabled={uploading[t._id]}
                          onClick={() => doAction(t._id, () => updateTask(t._id, { status: 'delivered', logMsg: 'Chef: Projet livré au client', chefNote: chefNotes[t._id] || t.chefNote }), 'Livré au client !')}
                        >
                          {uploading[t._id] ? <CircularProgress size={14} color="inherit" /> : 'Livrer au Client'}
                        </Button>
                        <Button
                          variant="outlined" color="error" size="small"
                          onClick={() => doAction(t._id, () => updateTask(t._id, { status: 'assigned_dev', logMsg: 'Chef: Dev retourné pour corrections' }), 'Retourné au Développeur')}
                        >
                          Retourner au Dev
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* Activity log */}
                  {t.log && t.log.length > 0 && (
                    <Box sx={{ mt: 2, borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                      <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 1 }}>Activité récente</Typography>
                      {[...t.log].reverse().slice(0, 4).map((l, i) => (
                        <Typography key={i} variant="caption" display="block" color="text.secondary">
                          {new Date(l.time).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} — {l.msg}
                        </Typography>
                      ))}
                    </Box>
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
