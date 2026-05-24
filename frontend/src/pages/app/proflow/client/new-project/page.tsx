import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  Divider, FormControl, InputLabel, MenuItem, Select, TextField, Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { createTask, uploadClientFiles } from '@/services/api';

export default function Page() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [prio, setPrio] = useState('medium');
  const [deadline, setDeadline] = useState('');
  const [projectType, setProjectType] = useState('');
  const [budget, setBudget] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [cahierFile, setCahierFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setTitle(''); setDesc(''); setPrio('medium'); setDeadline('');
    setProjectType(''); setBudget(''); setTechnologies(''); setCahierFile(null);
    setError('');
  };

  const handleSubmit = async () => {
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
      setSuccess(true);
      reset();
    } catch {
      setError('Erreur lors de la soumission. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Box className="flex flex-col items-center justify-center" sx={{ py: 10, gap: 2 }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 64, color: 'success.main' }} />
        <Typography variant="h5" fontWeight={700}>Projet soumis avec succès !</Typography>
        <Typography variant="body2" color="text.secondary">
          Votre demande a été transmise au chef de projet.
        </Typography>
        <Box className="flex gap-2" sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={() => setSuccess(false)}>
            Soumettre un autre projet
          </Button>
          <Button variant="contained" onClick={() => navigate('/proflow/client/dashboard')}>
            Voir mes projets
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col gap-4" sx={{ maxWidth: 720, mx: 'auto' }}>
      <Box>
        <Typography variant="h4" fontWeight={700}>Nouveau Projet</Typography>
        <Typography variant="body2" color="text.secondary">
          Remplissez le formulaire ci-dessous pour soumettre votre demande à l'équipe.
        </Typography>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      {/* Section 1 */}
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Informations générales
          </Typography>

          <TextField
            label="Titre du projet *" size="small" fullWidth value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Site vitrine pour mon entreprise"
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl size="small" fullWidth>
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
            <FormControl size="small" fullWidth>
              <InputLabel>Priorité</InputLabel>
              <Select value={prio} onChange={e => setPrio(e.target.value)} label="Priorité">
                <MenuItem value="low">🟢 Faible</MenuItem>
                <MenuItem value="medium">🟡 Moyen</MenuItem>
                <MenuItem value="high">🔴 Urgent</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="Date limite (optionnel)" size="small" type="date" fullWidth value={deadline}
            onChange={e => setDeadline(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ maxWidth: { sm: 240 } }}
          />

          <TextField
            fullWidth multiline rows={4} label="Description détaillée *" size="small"
            value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Décrivez votre projet, vos objectifs, votre cible, les fonctionnalités souhaitées…"
          />
        </CardContent>
      </Card>

      {/* Section 2 */}
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Budget & Technologies
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl size="small" fullWidth>
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
              label="Technologies souhaitées (optionnel)" size="small" fullWidth
              value={technologies} onChange={e => setTechnologies(e.target.value)}
              placeholder="Ex: React, Node.js, WordPress…"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Section 3 */}
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Cahier de charge (optionnel)
          </Typography>

          <Box sx={{
            border: '2px dashed', borderColor: cahierFile ? 'success.main' : 'divider',
            borderRadius: 2, p: 3, textAlign: 'center',
            bgcolor: cahierFile ? 'success.light' : 'action.hover',
            transition: 'all .2s',
          }}>
            {cahierFile ? (
              <Box className="flex items-center justify-center gap-2 flex-wrap">
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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Glissez votre fichier ici ou cliquez pour sélectionner
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                  PDF, Word, Excel — max 10 Mo
                </Typography>
              </Box>
            )}
            <Button variant="outlined" size="small" component="label" sx={{ mt: cahierFile ? 1 : 0 }}>
              {cahierFile ? '🔄 Changer le fichier' : '📎 Joindre un cahier de charge'}
              <input type="file" hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                onChange={e => setCahierFile(e.target.files?.[0] || null)} />
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Divider />

      {/* Actions */}
      <Box className="flex justify-end gap-2" sx={{ pb: 4 }}>
        <Button variant="outlined" onClick={reset} disabled={submitting}>
          Réinitialiser
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? <><CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />Envoi en cours…</>
            : '🚀 Soumettre le projet'}
        </Button>
      </Box>
    </Box>
  );
}
