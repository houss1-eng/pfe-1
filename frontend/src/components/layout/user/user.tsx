import UserModeSwitch from "./user-mode-switch";
import UserThemeSwitch from "./user-theme-switch";
import { SyntheticEvent, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Avatar, Box, Card, CardContent, Chip, Divider, Fade, Typography,
} from "@mui/material";
import Button from "@mui/material/Button";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Popper from "@mui/material/Popper";

import NiArrowOutRight from "@/icons/nexture/ni-arrow-out-right";
import NiSettings from "@/icons/nexture/ni-settings";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/services/api";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  chef:      { label: 'Chef de Projet', color: '#6366f1' },
  client:    { label: 'Client',         color: '#f59e0b' },
  designer:  { label: 'Designer',       color: '#ec4899' },
  developer: { label: 'Développeur',    color: '#10b981' },
};

export default function User() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleToggle = () => setOpen((prev) => !prev);
  const handleClose = (event: Event | SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) return;
    setOpen(false);
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const avatarSrc = user?.avatar ? getAvatarUrl(user.avatar) ?? undefined : undefined;
  const roleInfo = ROLE_LABELS[user?.role ?? ''] ?? { label: user?.role ?? '', color: '#6b7280' };

  return (
    <>
      <Box ref={anchorRef}>
        {/* Desktop button */}
        <Button
          variant="text"
          color="text-primary"
          className={cn(
            "group hover:bg-grey-25 ms-2 hidden gap-2 rounded-lg py-0! pe-0! hover:py-1! hover:pe-1.5! md:flex",
            open && "active bg-grey-25 py-1! pe-1.5!",
          )}
          onClick={handleToggle}
        >
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>{user?.name ?? '—'}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{roleInfo.label}</Typography>
          </Box>
          <Avatar
            alt={user?.name}
            src={avatarSrc}
            className={cn(
              "large transition-all group-hover:ms-0.5 group-hover:h-8 group-hover:w-8",
              open && "ms-0.5 h-8! w-8!",
            )}
            sx={{ bgcolor: roleInfo.color, fontWeight: 700 }}
          >
            {!avatarSrc && initials}
          </Avatar>
        </Button>

        {/* Mobile button */}
        <Button
          variant="text"
          size="large"
          color="text-primary"
          className={cn(
            "icon-only hover:bg-grey-25 hover-icon-shrink [&.active]:text-primary group ms-1 me-1 p-0! hover:p-1.5! md:hidden",
            open && "active bg-grey-25 p-1.5!",
          )}
          onClick={handleToggle}
          startIcon={
            <Avatar
              alt={user?.name}
              src={avatarSrc}
              className={cn("large transition-all group-hover:h-7 group-hover:w-7", open && "h-7! w-7!")}
              sx={{ bgcolor: roleInfo.color, fontWeight: 700 }}
            >
              {!avatarSrc && initials}
            </Avatar>
          }
        />
      </Box>

      <Popper
        open={open}
        anchorEl={() => anchorRef.current!}
        role={undefined}
        placement="bottom-end"
        className="mt-3!"
        transition
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps}>
            <Box>
              <ClickAwayListener onClickAway={handleClose}>
                <Card className="shadow-darker-sm!" sx={{ minWidth: 260 }}>
                  <CardContent>
                    {/* User identity */}
                    <Box className="flex flex-col items-center mb-3">
                      <Avatar
                        alt={user?.name}
                        src={avatarSrc}
                        sx={{ width: 56, height: 56, mb: 1, bgcolor: roleInfo.color, fontWeight: 700, fontSize: 20 }}
                      >
                        {!avatarSrc && initials}
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight={700}>{user?.name ?? '—'}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: -0.5 }}>{user?.email ?? '—'}</Typography>
                      <Chip
                        label={roleInfo.label} size="small"
                        sx={{ mt: 1, bgcolor: `${roleInfo.color}18`, color: roleInfo.color, fontWeight: 700, fontSize: 11 }}
                      />
                    </Box>

                    <Divider sx={{ mb: 1 }} />

                    {/* Theme / Mode toggles */}
                    <UserModeSwitch />
                    <UserThemeSwitch />

                    <Divider sx={{ my: 1 }} />

                    {/* Settings */}
                    <Button
                      fullWidth variant="text" color="text-primary" size="large"
                      className="full-width-button hover:bg-grey-25 px-3"
                      startIcon={<NiSettings size={20} />}
                      onClick={(e) => { handleClose(e); navigate("/settings"); }}
                    >
                      Paramètres
                    </Button>

                    <Divider sx={{ my: 1 }} />

                    {/* Logout */}
                    <Button
                      fullWidth variant="outlined" color="error" size="small"
                      startIcon={<NiArrowOutRight size={16} />}
                      onClick={() => { logout(); navigate("/auth/sign-in"); }}
                    >
                      Déconnexion
                    </Button>
                  </CardContent>
                </Card>
              </ClickAwayListener>
            </Box>
          </Fade>
        )}
      </Popper>
    </>
  );
}
