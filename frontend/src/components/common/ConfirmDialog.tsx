import { useCallback, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent,
  DialogTitle, Typography,
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title = 'Confirmation', message,
  confirmLabel = 'Confirmer', cancelLabel = 'Annuler',
  danger = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box className="flex items-center gap-2">
          <WarningAmberRoundedIcon
            sx={{ color: danger ? 'error.main' : 'warning.main', fontSize: 22 }}
          />
          <Typography variant="h6" fontWeight={700} component="span">
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button variant="outlined" size="small" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          size="small"
          color={danger ? 'error' : 'primary'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  resolve: (value: boolean) => void;
}

const defaultState: ConfirmState = {
  open: false, title: 'Confirmation', message: '',
  confirmLabel: 'Confirmer', danger: false, resolve: () => {},
};

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(defaultState);

  const confirm = useCallback((
    message: string,
    options?: { title?: string; confirmLabel?: string; danger?: boolean }
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        message,
        title: options?.title ?? 'Confirmation',
        confirmLabel: options?.confirmLabel ?? 'Confirmer',
        danger: options?.danger ?? false,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState(s => { s.resolve(true); return { ...s, open: false }; });
  }, []);

  const handleCancel = useCallback(() => {
    setState(s => { s.resolve(false); return { ...s, open: false }; });
  }, []);

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      danger={state.danger}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, dialog };
}
