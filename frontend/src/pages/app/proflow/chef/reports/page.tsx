import { Box, Typography } from '@mui/material';

export default function Page() {
  return (
    <Box className="flex flex-col items-center justify-center" sx={{ textAlign: 'center', py: 10, bgcolor: 'background.paper', borderRadius: 3 }}>
      <Typography fontSize={48} sx={{ mb: 2 }}>📈</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Rapports &amp; Statistiques</Typography>
      <Typography variant="body2" color="text.secondary">
        Analyse des performances, temps de traitement et satisfaction client.
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 3 }}>
        Module en cours de développement…
      </Typography>
    </Box>
  );
}
