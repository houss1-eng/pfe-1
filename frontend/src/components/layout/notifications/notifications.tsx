import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardActions,
  ClickAwayListener,
  Divider,
  Fade,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Popper,
  Tooltip,
  Typography,
} from "@mui/material";

import NiBell from "@/icons/nexture/ni-bell";
import NiCheckSquare from "@/icons/nexture/ni-check-square";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getNotifications, markNotificationsRead } from "@/services/api";

interface BackendNotification {
  _id: string;
  message: string;
  role: string;
  taskId?: string;
  taskTitle?: string;
  read: boolean;
  createdAt: string;
}

const ROLE_TASK_ROUTE: Record<string, string> = {
  chef:      '/proflow/chef/projects',
  client:    '/proflow/client/dashboard',
  designer:  '/proflow/designer/tasks',
  developer: '/proflow/developer/tasks',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Il y a ${days}j`;
}

function notifIcon(message: string): string {
  const emoji = message.match(/^\p{Emoji}/u)?.[0];
  return emoji ?? '🔔';
}

function stripEmoji(message: string): string {
  return message.replace(/^\p{Emoji}\s*/u, '');
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const anchorRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const [tooltipShow, setTooltipShow] = useState(false);
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifs = useCallback(async () => {
    if (!user?.role) return;
    setLoading(true);
    try {
      const data = await getNotifications(user.role);
      setNotifications(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  const handleToggle = async () => {
    if (!open && unreadCount > 0) {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n._id);
      markNotificationsRead(unreadIds, user?.role).catch(() => {});
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
    setOpen((prev) => !prev);
  };

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) return;
    setOpen(false);
  };

  const handleNotifClick = (_notif: BackendNotification) => {
    const route = ROLE_TASK_ROUTE[user?.role ?? ''] ?? '/dashboards/default';
    navigate(route);
    setOpen(false);
  };

  const handleMarkAllRead = async () => {
    if (!user?.role) return;
    try {
      await markNotificationsRead([], user.role);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  return (
    <>
      <Tooltip title="Notifications" placement="bottom" arrow open={!open && tooltipShow}>
        <Badge
          badgeContent={unreadCount}
          color="primary"
          slotProps={{
            badge: { className: "ltr:right-2! rtl:left-2! top-2 pointer-events-none" },
          }}
        >
          <Button
            variant="text"
            size="large"
            color="text-primary"
            className={cn(
              "icon-only hover-icon-shrink [&.active]:text-primary! hover:bg-grey-25",
              open && "active bg-grey-25",
            )}
            onClick={handleToggle}
            onMouseEnter={() => setTooltipShow(true)}
            onMouseLeave={() => setTooltipShow(false)}
            ref={anchorRef}
            startIcon={<NiBell size="large" variant={open ? "contained" : "outlined"} />}
          />
        </Badge>
      </Tooltip>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        placement="bottom-end"
        className="mt-3!"
        transition
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps}>
            <Box>
              <ClickAwayListener onClickAway={handleClose}>
                <Card className="shadow-darker-sm! w-xs md:w-sm">
                  {/* Header */}
                  <Box className="flex flex-1 flex-row items-center justify-between px-4 pt-4 pb-2">
                    <Typography variant="h6" component="h6">
                      Notifications
                      {unreadCount > 0 && (
                        <Typography component="span" variant="caption" color="primary" sx={{ ml: 1, fontWeight: 700 }}>
                          {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                        </Typography>
                      )}
                    </Typography>
                    {unreadCount > 0 && (
                      <Tooltip title="Tout marquer comme lu" arrow>
                        <Button
                          className="icon-only"
                          size="small"
                          color="grey"
                          variant="text"
                          startIcon={<NiCheckSquare size="small" />}
                          onClick={handleMarkAllRead}
                        />
                      </Tooltip>
                    )}
                  </Box>

                  <Divider />

                  {/* Notifications list */}
                  <List className="max-h-96 overflow-auto p-0">
                    {loading && notifications.length === 0 && (
                      <ListItem sx={{ justifyContent: 'center', py: 3 }}>
                        <Typography variant="body2" color="text.secondary">Chargement...</Typography>
                      </ListItem>
                    )}
                    {!loading && notifications.length === 0 && (
                      <ListItem sx={{ justifyContent: 'center', py: 3 }}>
                        <Typography variant="body2" color="text.secondary">Aucune notification</Typography>
                      </ListItem>
                    )}
                    {notifications.map((notif) => (
                      <React.Fragment key={notif._id}>
                        <ListItem
                          disablePadding
                          sx={{ bgcolor: notif.read ? 'transparent' : 'primary.main' + '08' }}
                        >
                          <ListItemButton
                            onClick={() => handleNotifClick(notif)}
                            sx={{ alignItems: 'flex-start', py: 1.5, px: 2 }}
                          >
                            <ListItemAvatar sx={{ minWidth: 44 }}>
                              <Avatar sx={{ width: 36, height: 36, fontSize: 18, bgcolor: 'background.default' }}>
                                {notifIcon(notif.message)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ fontWeight: notif.read ? 400 : 600, lineHeight: 1.4 }}>
                                  {stripEmoji(notif.message)}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {timeAgo(notif.createdAt)}
                                </Typography>
                              }
                            />
                            {!notif.read && (
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 1, ml: 1, flexShrink: 0 }} />
                            )}
                          </ListItemButton>
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>

                  <CardActions disableSpacing>
                    <Button variant="outlined" size="tiny" color="grey" className="w-full" onClick={() => { navigate(ROLE_TASK_ROUTE[user?.role ?? ''] ?? '/dashboards/default'); setOpen(false); }}>
                      Voir tous les projets
                    </Button>
                  </CardActions>
                </Card>
              </ClickAwayListener>
            </Box>
          </Fade>
        )}
      </Popper>
    </>
  );
}
