import { useContext, useEffect, useMemo, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl,
  IconButton, InputLabel, LinearProgress, MenuItem, Select, Step,
  StepLabel, Stepper, TextField, Tooltip, Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import SendIcon from '@mui/icons-material/Send';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { AuthContext } from '@/context/AuthContext';
import { createTask, getTasks, updateTask, deleteTask, uploadClientFiles } from '@/services/api';
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
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [prio, setPrio] = useState('medium');
  const [deadline, setDeadline] = useState('');
  const [projectType, setProjectType] = useState('');
  const [budget, setBudget] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [cahierFile, setCahierFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    getTasks().then(setTasks).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    active: tasks.filter(t => !['completed', 'delivered'].includes(t.status)).length,
    review: tasks.filter(t => ['review_client', 'delivered'].includes(t.status)).length,
    inDev: tasks.filter(t => ['assigned_dev', 'in_progress_dev', 'review_chef_dev'].includes(t.status)).length,
    completed: tasks.filter(t => ['completed', 'delivered'].includes(t.status)).length,
  }), [tasks]);

  const submitTask = async () => {
    if (!title.trim() || !desc.trim()) return setError('Remplissez le titre et la description');
    setSubmitting(true);
    setError('');
    try {
      const task = await createTask({
        title, description: desc, priority: prio,
        deadline: deadline || undefined,
        projectType: projectType || undefined,
        budget: budget || undefined,
        technologies: technologies || undefined,
      });
      if (cahierFile) {
        const fd = new FormData();
        fd.append('files', cahierFile);
        await uploadClientFiles(task._id, fd);
      }
      setTitle(''); setDesc(''); setPrio('medium'); setDeadline('');
      setProjectType(''); setBudget(''); setTechnologies(''); setCahierFile(null);
      setShowForm(false);
      load();
    } catch { setError('Erreur lors de la soumission'); }
    finally { setSubmitting(false); }
  };

  const updateStatus = async (id: string, status: string, logMsg: string) => {
    if (!window.confirm('Confirmer cette action ?')) return;
    try {
      await updateTask(id, { status, logMsg });
      load();
    } catch { setError('Erreur de mise à jour'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce projet définitivement ?')) return;
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
      <Box className="flex items-center justify-between flex-wrap gap-2">
        <Typography variant="h4" fontWeight={700}>
          Bonjour, {user?.name?.split(' ')[0]} 👋
        </Typography>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
        {[
          { label: 'Projets actifs', value: stats.active, color: '#6366f1' },
          { label: 'En attente validation', value: stats.review, color: '#f59e0b' },
          { label: 'En développement', value: stats.inDev, color: '#10b981' },
          { label: 'Livrés', value: stats.completed, color: '#6b7280' },
        ].map(k => (
          <Card key={k.label} sx={{ borderLeft: `3px solid ${k.color}` }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">{k.label}</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: k.color }}>{k.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* New project button */}
      <Button
        variant="contained" sx={{ alignSelf: 'flex-start' }}
        onClick={() => setShowForm(v => !v)}
      >
        {showForm ? '− Annuler' : '+ Soumettre un nouveau projet'}
      </Button>

      {showForm && (
        <Card sx={{ borderTop: '3px solid', borderColor: 'primary.main' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>📋 Nouvelle demande de projet</Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2.5 }}>
              Remplissez les informations pour soumettre votre projet à l'équipe.
            </Typography>

            {/* Section 1 — Informations de base */}
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
              Informations générales
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <TextField
                label="Titre du projet *" size="small" value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Site vitrine pour mon entreprise"
              />
              <FormControl size="small">
                <InputLabel>Type de projet</InputLabel>
                <Select value={projectType} onChange={e => setProjectType(e.target.value)} label="Type de projet">
                  <MenuItem value="">— Sélectionner —</MenuItem>
                  <MenuItem value="site-vitrine">🌐 Site vitrine</MenuItem>
                  <MenuItem value="e-commerce">🛒 E-commerce</MenuItem>
                  <MenuItem value="application-web">💻 Application web</MenuItem>
                  <MenuItem value="application-mobile">📱 Application mobile</MenuItem>
                  <MenuItem value="dashboard">📊 Dashboard / Back-office</MenuItem>
                  <MenuItem value="redesign">🎨 Refonte / Redesign</MenuItem>
                  <MenuItem value="autre">📁 Autre</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>Priorité</InputLabel>
                <Select value={prio} onChange={e => setPrio(e.target.value)} label="Priorité">
                  <MenuItem value="low">🟢 Faible</MenuItem>
                  <MenuItem value="medium">🟡 Moyen</MenuItem>
                  <MenuItem value="high">🔴 Urgent</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Date limite (optionnel)" size="small" type="date" value={deadline}
                onChange={e => setDeadline(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <TextField
              fullWidth multiline rows={3} label="Description détaillée *" size="small"
              value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Décrivez votre projet, vos objectifs, votre cible…"
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            {/* Section 2 — Budget & Technos */}
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
              Budget & Technologies
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <FormControl size="small">
                <InputLabel>Budget estimé</InputLabel>
                <Select value={budget} onChange={e => setBudget(e.target.value)} label="Budget estimé">
                  <MenuItem value="">— Non défini —</MenuItem>
                  <MenuItem value="<1000">Moins de 1 000 €</MenuItem>
                  <MenuItem value="1000-3000">1 000 – 3 000 €</MenuItem>
                  <MenuItem value="3000-5000">3 000 – 5 000 €</MenuItem>
                  <MenuItem value="5000-10000">5 000 – 10 000 €</MenuItem>
                  <MenuItem value=">10000">Plus de 10 000 €</MenuItem>
                  <MenuItem value="a-discuter">À discuter</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Technologies souhaitées (optionnel)" size="small"
                value={technologies} onChange={e => setTechnologies(e.target.value)}
                placeholder="Ex: React, Node.js, WordPress…"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Section 3 — Cahier de charge */}
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
              Cahier de charge
            </Typography>
            <Box
              sx={{
                border: '2px dashed', borderColor: cahierFile ? 'success.main' : 'divider',
                borderRadius: 2, p: 2, textAlign: 'center', bgcolor: cahierFile ? 'success.light' : 'action.hover',
                transition: 'all .2s',
              }}
            >
              {cahierFile ? (
                <Box className="flex items-center justify-center gap-2">
                  <Typography variant="body2" fontWeight={600} color="success.dark">
                    📄 {cahierFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({(cahierFile.size / 1024).toFixed(0)} Ko)
                  </Typography>
                  <Button size="small" color="error" onClick={() => setCahierFile(null)} sx={{ minWidth: 0, px: 1 }}>✕</Button>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Glissez votre fichier ici ou cliquez pour sélectionner
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                    PDF, Word, Excel — max 10 Mo
                  </Typography>
                </Box>
              )}
              <Button
                variant="outlined" size="small" component="label"
                sx={{ mt: cahierFile ? 1 : 0 }}
              >
                {cahierFile ? '🔄 Changer le fichier' : '📎 Joindre un cahier de charge'}
                <input
                  type="file" hidden
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={e => setCahierFile(e.target.files?.[0] || null)}
                />
              </Button>
            </Box>

            <Box className="flex justify-end gap-2" sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button variant="contained" disabled={submitting} onClick={submitTask}>
                {submitting ? <CircularProgress size={16} color="inherit" /> : '🚀 Soumettre le projet'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Projects list */}
      <Typography variant="h6" fontWeight={600}>Mes projets ({tasks.length})</Typography>

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
