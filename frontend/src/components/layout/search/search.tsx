import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Input,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import NiSearch from "@/icons/nexture/ni-search";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getTasks } from "@/services/api";

const STATUS_LABELS: Record<string, string> = {
  pending_chef: 'En attente', assigned_designer: 'Assigné Designer',
  in_progress_designer: 'En cours (Design)', review_chef_design: 'Révision Design',
  review_client: 'Validation Client', rejected_client: 'Rejeté Client',
  approved_client: 'Approuvé', assigned_dev: 'Assigné Dev',
  in_progress_dev: 'En cours (Dev)', review_chef_dev: 'Révision Dev',
  delivered: 'Livré', completed: 'Terminé',
};

const ROLE_ROUTES: Record<string, { label: string; href: string; icon: string }[]> = {
  chef: [
    { label: 'Tableau de bord', href: '/proflow/chef/dashboard', icon: '📊' },
    { label: 'Équipe', href: '/proflow/chef/team', icon: '👥' },
    { label: 'Tous les projets', href: '/proflow/chef/all-projects', icon: '📁' },
    { label: 'Contrats & Devis', href: '/proflow/chef/contract-generator', icon: '📄' },
    { label: 'Planning', href: '/proflow/chef/planning', icon: '📅' },
    { label: 'Rapports', href: '/proflow/chef/reports', icon: '📈' },
  ],
  client: [
    { label: 'Mes Projets', href: '/proflow/client/dashboard', icon: '📁' },
    { label: 'Mes Contrats', href: '/proflow/client/contracts', icon: '📄' },
  ],
  designer: [
    { label: 'Mes Tâches', href: '/proflow/designer/tasks', icon: '🎨' },
    { label: 'Mes Wireframes', href: '/proflow/designer/wireframes', icon: '🖼️' },
    { label: 'Génération IA', href: '/proflow/designer/n8n', icon: '🤖' },
  ],
  developer: [
    { label: 'Mes Tâches', href: '/proflow/developer/tasks', icon: '💻' },
  ],
};

const ROLE_TASK_ROUTE: Record<string, string> = {
  chef: '/proflow/chef/all-projects',
  client: '/proflow/client/dashboard',
  designer: '/proflow/designer/tasks',
  developer: '/proflow/developer/tasks',
};

type Task = { _id: string; title: string; status: string; clientEmail: string; priority: string };

export default function Search() {
  const isMac = navigator.userAgent.includes("Mac");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tooltipShow, setTooltipShow] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpen = () => { setOpen(true); setQuery(''); setResults([]); };
  const handleClose = () => setOpen(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); handleOpen(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const all: Task[] = await getTasks();
        const q = query.toLowerCase();
        setResults(all.filter(t =>
          t.title.toLowerCase().includes(q) ||
          (t.clientEmail || '').toLowerCase().includes(q) ||
          (STATUS_LABELS[t.status] || '').toLowerCase().includes(q)
        ).slice(0, 8));
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  const handleNavigate = (href: string) => {
    navigate(href);
    handleClose();
  };

  const role = user?.role || 'chef';
  const quickLinks = ROLE_ROUTES[role] || [];
  const taskRoute = ROLE_TASK_ROUTE[role] || '/proflow/chef/all-projects';

  const initials = (email: string) => (email || '').split('@')[0].slice(0, 2).toUpperCase();

  return (
    <>
      <Tooltip title={`Rechercher (${isMac ? "⌘" : "Ctrl"}+K)`} placement="bottom" arrow open={!open && tooltipShow}>
        <Button
          variant="text"
          size="large"
          color="text-primary"
          className={cn(
            "icon-only hover-icon-shrink [&.active]:text-primary! hover:bg-grey-25",
            open && "active bg-grey-25 text-primary!",
          )}
          onClick={handleOpen}
          onMouseEnter={() => setTooltipShow(true)}
          onMouseLeave={() => setTooltipShow(false)}
          startIcon={<NiSearch variant={open ? "contained" : "outlined"} size={24} />}
        />
      </Tooltip>

      <Dialog
        onClose={handleClose}
        open={open}
        maxWidth="sm"
        fullWidth
        classes={{ container: "items-start", paper: "mt-16" }}
      >
        <DialogTitle sx={{ p: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Input
            autoFocus
            fullWidth
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un projet, client, statut…"
            disableUnderline
            sx={{ px: 2, py: 1.5, fontSize: 15 }}
            startAdornment={
              <InputAdornment position="start">
                {loading ? <CircularProgress size={18} /> : <NiSearch size="medium" />}
              </InputAdornment>
            }
          />
        </DialogTitle>

        <DialogContent sx={{ p: 0, maxHeight: 420, overflowY: 'auto' }}>
          {/* No query — show quick links */}
          {!query.trim() && (
            <Box>
              <Typography variant="caption" sx={{ px: 2, pt: 2, pb: 0.5, display: 'block', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: 10.5 }}>
                Accès rapides
              </Typography>
              <List dense disablePadding>
                {quickLinks.map(link => (
                  <ListItemButton key={link.href} onClick={() => handleNavigate(link.href)} sx={{ px: 2, py: 0.75 }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, mr: 1.5, flexShrink: 0 }}>
                      {link.icon}
                    </Box>
                    <ListItemText
                      primary={link.label}
                      primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }}
                    />
                  </ListItemButton>
                ))}
              </List>
              <Divider sx={{ mt: 1 }} />
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                  Tapez pour rechercher dans vos projets · <kbd style={{ background: '#f3f4f6', borderRadius: 4, padding: '1px 5px', fontSize: 11 }}>Ctrl</kbd>+<kbd style={{ background: '#f3f4f6', borderRadius: 4, padding: '1px 5px', fontSize: 11 }}>K</kbd> pour ouvrir
                </Typography>
              </Box>
            </Box>
          )}

          {/* Query — show results */}
          {query.trim() && !loading && results.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography fontSize={28} display="block" sx={{ mb: 1, opacity: 0.4 }}>🔍</Typography>
              <Typography variant="body2" color="text.secondary">Aucun résultat pour « {query} »</Typography>
            </Box>
          )}

          {query.trim() && results.length > 0 && (
            <Box>
              <Typography variant="caption" sx={{ px: 2, pt: 2, pb: 0.5, display: 'block', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: 10.5 }}>
                {results.length} résultat{results.length > 1 ? 's' : ''}
              </Typography>
              <List dense disablePadding>
                {results.map(t => (
                  <ListItemButton key={t._id} onClick={() => handleNavigate(taskRoute)} sx={{ px: 2, py: 0.75 }}>
                    <Avatar sx={{ width: 30, height: 30, fontSize: 11, fontWeight: 700, bgcolor: '#6366f122', color: '#6366f1', mr: 1.5, flexShrink: 0 }}>
                      {initials(t.clientEmail)}
                    </Avatar>
                    <ListItemText
                      primary={t.title}
                      secondary={`${(t.clientEmail || '').split('@')[0]} · ${STATUS_LABELS[t.status] || t.status}`}
                      primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600, noWrap: true }}
                      secondaryTypographyProps={{ fontSize: 11 }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
