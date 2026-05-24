import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfirm } from '@/components/common/ConfirmDialog';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  IconButton, LinearProgress, Step, StepLabel, Stepper, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import SendIcon from '@mui/icons-material/Send';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { getTasks, updateTask, deleteTask } from '@/services/api';
import { API_URL } from '@/services/api';

const STATUS_PROGRESS: Record<string, number> = {
  pending_chef: 5, assigned_designer: 15, in_progress_designer: 30, review_chef_design: 42,
  review_client: 52, rejected_client: 38, approved_client: 55, assigned_dev: 65,
  in_progress_dev: 78, review_chef_dev: 88, delivered: 95, completed: 100,
};

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  pending_chef: { label: 'En attente', color: '#6b7280' },
  assigned_designer: { label: 'Design assigné', color: '#ec4899' },
  in_progress_designer: { label: 'Design en cours', color: '#ec4899' },
  review_chef_design: { label: 'Révision interne', color: '#f59e0b' },
  review_client: { label: 'À valider ⚡', color: '#f59e0b' },
  rejected_client: { label: 'Révision demandée', color: '#ef4444' },
  approved_client: { label: 'Approuvé', color: '#22c55e' },
  assigned_dev: { label: 'Développement', color: '#10b981' },
  in_progress_dev: { label: 'En développement', color: '#10b981' },
  review_chef_dev: { label: 'Révision dev', color: '#f59e0b' },
  delivered: { label: 'Livré ⚡', color: '#6366f1' },
  completed: { label: 'Terminé', color: '#10b981' },
};

const WF_STEPS = ['Soumis', 'Chef de projet', 'Designer', 'Maquettes', 'Votre validation', 'Développement', 'Livraison'];
const STATUS_STEP: Record<string, number> = {
  pending_chef: 1, assigned_designer: 2, in_progress_designer: 2, review_chef_design: 3,
  review_client: 4, rejected_client: 4, approved_client: 4, assigned_dev: 5,
  in_progress_dev: 5, review_chef_dev: 5, delivered: 6, completed: 7,
};

type Task = {
  _id: string; title: string; description: string; status: string;
  priority: string; createdAt: string; updatedAt: string; deadline?: string;
  clientEmail: string; chefNote?: string;
  designerFiles?: { name: string; url: string }[];
  chefFiles?: { name: string; url: string }[];
  log?: { time: string; msg: string }[];
};

export default function Page() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [error, setError] = useState('');
  const { confirm, dialog } = useConfirm();

  const load = () => {
    getTasks().then(setTasks).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string, logMsg: string) => {
    if (!await confirm('Confirmer cette action ?')) return;
    try {
      await updateTask(id, { status, logMsg });
      load();
    } catch { setError('Erreur de mise à jour'); }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm('Supprimer ce projet définitivement ?', { danger: true, confirmLabel: 'Supprimer' })) return;
    try {
      await deleteTask(id);
      setSelectedTask(null);
      load();
    } catch { setError('Erreur de suppression'); }
  };

  const sendMessage = async () => {
    if (!selectedTask || !msgText.trim()) return;
    setSendingMsg(true);
    try {
      await updateTask(selectedTask._id, { logMsg: `💬 Message du client : ${msgText.trim()}`, notifyChef: true });
      setMsgText('');
      load();
    } catch { setError('Erreur d\'envoi du message'); }
    finally { setSendingMsg(false); }
  };

  if (loading) return <Box className="flex justify-center p-12"><CircularProgress /></Box>;

  return (
    <Box className="flex flex-col gap-4">
      {dialog}
      <Box className="flex items-center justify-between flex-wrap gap-2">
        <Box>
          <Typography variant="h4" fontWeight={700}>Mes Projets</Typography>
          <Typography variant="body2" color="text.secondary">
            Liste et suivi de vos projets
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
          onClick={() => navigate('/proflow/client/new-project')}
        >
          Nouveau projet
        </Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      {/* Projects list */}
      <Typography variant="h6" fontWeight={600}>Tous les projets ({tasks.length})</Typography>

      <Box className="flex flex-col gap-2">
        {!tasks.length && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Aucun projet soumis pour l'instant.
          </Typography>
        )}
        {tasks.map(t => {
          const info = STATUS_INFO[t.status] || { label: t.status, color: '#6b7280' };
          const pct = STATUS_PROGRESS[t.status] || 0;
          return (
            <Card
              key={t._id} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
              onClick={() => setSelectedTask(t)}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box className="flex items-start gap-3">
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>{t.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(t.createdAt).toLocaleDateString('fr-FR')} ·{' '}
                      <span style={{ color: t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                        {t.priority}
                      </span>
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: info.color }}>{pct}%</Typography>
                    <LinearProgress
                      variant="determinate" value={pct}
                      sx={{ width: 80, mt: 0.5, '& .MuiLinearProgress-bar': { bgcolor: info.color } }}
                    />
                  </Box>
                </Box>
                <Box className="flex items-center justify-between mt-1">
                  <Chip label={info.label} size="small" sx={{ bgcolor: `${info.color}20`, color: info.color, fontWeight: 600 }} />
                  {['review_client', 'delivered'].includes(t.status) && (
                    <Box className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <Button size="small" color="error" variant="outlined"
                        onClick={() => updateStatus(t._id, 'rejected_client', 'Client: Révision demandée')}>
                        Révision
                      </Button>
                      <Button size="small" color="success" variant="contained"
                        onClick={() => updateStatus(t._id, t.status === 'review_client' ? 'approved_client' : 'completed', 'Client: Approuvé')}>
                        Approuver
                      </Button>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Detail Modal */}
      <Dialog open={!!selectedTask} onClose={() => setSelectedTask(null)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        {selectedTask && (() => {
          const info = STATUS_INFO[selectedTask.status] || { label: selectedTask.status, color: '#6b7280' };
          const pct = STATUS_PROGRESS[selectedTask.status] || 0;
          const curStep = STATUS_STEP[selectedTask.status] ?? 0;
          const allDone = selectedTask.status === 'completed';
          const files = [...(selectedTask.chefFiles || []), ...(selectedTask.designerFiles || [])];
          const canValidate = ['review_client', 'delivered'].includes(selectedTask.status);
          const PRIO_COLOR: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
          const PRIO_LABEL: Record<string, string> = { high: 'Urgent', medium: 'Moyen', low: 'Faible' };

          return (
            <>
              {/* ── Colored header ── */}
              <Box sx={{ bgcolor: info.color, px: 3, pt: 2.5, pb: 2 }}>
                <Box className="flex items-start justify-between gap-2">
                  <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.2, mb: 0.5 }}>
                      {selectedTask.title}
                    </Typography>
                    <Box className="flex items-center gap-2 flex-wrap">
                      <Chip
                        label={info.label} size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 700, fontSize: 11 }}
                      />
                      <Chip
                        label={PRIO_LABEL[selectedTask.priority] || selectedTask.priority} size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 11 }}
                      />
                    </Box>
                  </Box>
                  <IconButton size="small" onClick={() => setSelectedTask(null)} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Progress bar in header */}
                <Box sx={{ mt: 2 }}>
                  <Box className="flex justify-between mb-1">
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Avancement</Typography>
                    <Typography variant="caption" fontWeight={800} sx={{ color: '#fff' }}>{pct}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate" value={pct}
                    sx={{ height: 6, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.25)', '& .MuiLinearProgress-bar': { bgcolor: '#fff', borderRadius: 4 } }}
                  />
                </Box>
              </Box>

              <DialogContent sx={{ px: 3, pt: 2.5, pb: 0 }}>

                {/* Metadata row */}
                <Box className="flex flex-wrap gap-3 mb-3">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography variant="caption" color="text.secondary">📅 Soumis le</Typography>
                    <Typography variant="caption" fontWeight={600}>{new Date(selectedTask.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</Typography>
                  </Box>
                  {selectedTask.deadline && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Typography variant="caption" color="text.secondary">⏰ Échéance</Typography>
                      <Typography variant="caption" fontWeight={600}>{new Date(selectedTask.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography variant="caption" color="text.secondary">🎯 Priorité</Typography>
                    <Typography variant="caption" fontWeight={700} sx={{ color: PRIO_COLOR[selectedTask.priority] }}>{PRIO_LABEL[selectedTask.priority]}</Typography>
                  </Box>
                </Box>

                {/* Description */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.7 }}>
                  {selectedTask.description}
                </Typography>

                {/* Workflow Stepper */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
                    Étapes du workflow
                  </Typography>
                  <Stepper activeStep={allDone ? WF_STEPS.length : curStep} alternativeLabel>
                    {WF_STEPS.map((label) => (
                      <Step key={label}>
                        <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 10 } }}>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>

                {/* Validation actions (if needed) */}
                {canValidate && (
                  <Box sx={{ p: 2, bgcolor: `${info.color}10`, border: `1.5px solid ${info.color}40`, borderRadius: 2, mb: 2.5 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: info.color, mb: 1 }}>
                      ⚡ Action requise — votre validation est attendue
                    </Typography>
                    <Box className="flex gap-2">
                      <Button
                        variant="outlined" color="error" size="small"
                        startIcon={<ThumbDownIcon fontSize="small" />}
                        onClick={() => { updateStatus(selectedTask._id, 'rejected_client', 'Client: Révision demandée'); setSelectedTask(null); }}
                      >
                        Demander une révision
                      </Button>
                      <Button
                        variant="contained" color="success" size="small"
                        startIcon={<ThumbUpIcon fontSize="small" />}
                        onClick={() => { updateStatus(selectedTask._id, selectedTask.status === 'review_client' ? 'approved_client' : 'completed', 'Client: Approuvé'); setSelectedTask(null); }}
                      >
                        Approuver
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Chef note */}
                {selectedTask.chefNote && (
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 2.5, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                    <Box className="flex items-center gap-1.5 mb-1">
                      <Avatar sx={{ width: 22, height: 22, fontSize: 11, bgcolor: 'primary.main' }}>C</Avatar>
                      <Typography variant="caption" fontWeight={700}>Chef de projet</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{selectedTask.chefNote}</Typography>
                  </Box>
                )}

                {/* Files */}
                {files.length > 0 && (
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                      Fichiers joints ({files.length})
                    </Typography>
                    <Box className="flex flex-wrap gap-2">
                      {files.map((f, i) => (
                        <Tooltip key={i} title={f.name}>
                          <Button
                            size="small" variant="outlined" color="primary"
                            startIcon={<DownloadIcon fontSize="small" />}
                            href={`${API_URL}${f.url}`} target="_blank"
                            sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {f.name.length > 20 ? f.name.slice(0, 18) + '…' : f.name}
                          </Button>
                        </Tooltip>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Activity log */}
                {selectedTask.log && selectedTask.log.length > 0 && (
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                      Activité récente
                    </Typography>
                    <Box sx={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {[...selectedTask.log].reverse().slice(0, 6).map((l, i) => (
                        <Box key={i} className="flex items-start gap-2">
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.7, flexShrink: 0 }} />
                          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                            <span style={{ fontWeight: 600 }}>{l.time}</span> — {l.msg}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                <Divider sx={{ mb: 2 }} />

                {/* Message to chef */}
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>💬 Message au chef de projet</Typography>
                <TextField
                  fullWidth multiline rows={2}
                  placeholder="Posez une question ou laissez un commentaire…"
                  size="small" value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  sx={{ mb: 1.5 }}
                />
              </DialogContent>

              <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                <Button
                  color="error" size="small" variant="outlined"
                  disabled={selectedTask.status !== 'completed'}
                  onClick={() => handleDelete(selectedTask._id)}
                >
                  Supprimer le projet
                </Button>
                <Box className="flex gap-2">
                  <Button variant="outlined" size="small" onClick={() => setSelectedTask(null)}>Fermer</Button>
                  <Button
                    variant="contained" size="small" color="primary"
                    endIcon={sendingMsg ? <CircularProgress size={12} color="inherit" /> : <SendIcon fontSize="small" />}
                    disabled={sendingMsg || !msgText.trim()}
                    onClick={sendMessage}
                  >
                    Envoyer
                  </Button>
                </Box>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
}
