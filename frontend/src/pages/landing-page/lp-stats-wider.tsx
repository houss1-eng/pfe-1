import { Box, Card, CardContent, Grid, Typography } from "@mui/material";

import NiBasket from "@/icons/nexture/ni-basket";
import NiCatalog from "@/icons/nexture/ni-catalog";
import NiCells from "@/icons/nexture/ni-cells";
import NiScreen from "@/icons/nexture/ni-screen";
import NiStars from "@/icons/nexture/ni-stars";
import NiUser from "@/icons/nexture/ni-user";

export default function LPStatsWider() {
  return (
    <Grid container size={12} spacing={2.5} className="flex-none">
      <Grid size={{ xs: 6 }}>
        <Card component="a" href="#" className="flex flex-col p-1 transition-transform hover:scale-[1.02]">
          <Box className="bg-primary-light/10 flex h-17 w-full flex-none items-center justify-center rounded-2xl">
            <NiBasket className="text-primary" size={"large"} />
          </Box>
          <CardContent className="p-2.5! text-center">
            <Typography variant="body1" className="text-text-secondary leading-5 transition-colors">
              Orders
            </Typography>
            <Typography variant="h5" className="text-leading-5">
              182
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Card component="a" href="#" className="flex flex-col p-1 transition-transform hover:scale-[1.02]">
          <Box className="bg-secondary-light/10 flex h-17 w-full flex-none items-center justify-center rounded-2xl">
            <NiCells className="text-secondary" size={"large"} />
          </Box>
          <CardContent className="p-2.5! text-center">
            <Typography variant="body1" className="text-text-secondary leading-5 transition-colors">
              Products
            </Typography>
            <Typography variant="h5" className="text-leading-5">
              264
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Card component="a" href="#" className="flex flex-col p-1 transition-transform hover:scale-[1.02]">
          <Box className="bg-primary-light/10 flex h-17 w-full flex-none items-center justify-center rounded-2xl">
            <NiCatalog className="text-primary" size={"large"} />
          </Box>
          <CardContent className="p-2.5! text-center">
            <Typography variant="body1" className="text-text-secondary leading-5 transition-colors">
              Categories
            </Typography>
            <Typography variant="h5" className="text-leading-5">
              42
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Card component="a" href="#" className="flex flex-col p-1 transition-transform hover:scale-[1.02]">
          <Box className="bg-secondary-light/10 flex h-17 w-full flex-none items-center justify-center rounded-2xl">
            <NiUser className="text-secondary" size={"large"} />
          </Box>
          <CardContent className="p-2.5! text-center">
            <Typography variant="body1" className="text-text-secondary leading-5 transition-colors">
              Users
            </Typography>
            <Typography variant="h5" className="text-leading-5">
              1,487
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Card component="a" href="#" className="flex flex-col p-1 transition-transform hover:scale-[1.02]">
          <Box className="bg-primary-light/10 flex h-17 w-full flex-none items-center justify-center rounded-2xl">
            <NiStars className="text-primary" size={"large"} />
          </Box>
          <CardContent className="p-2.5! text-center">
            <Typography variant="body1" className="text-text-secondary leading-5 transition-colors">
              Reviews
            </Typography>
            <Typography variant="h5" className="text-leading-5">
              124
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Card component="a" href="#" className="flex flex-col p-1 transition-transform hover:scale-[1.02]">
          <Box className="bg-secondary-light/10 flex h-17 w-full flex-none items-center justify-center rounded-2xl">
            <NiScreen className="text-secondary" size={"large"} />
          </Box>
          <CardContent className="p-2.5! text-center">
            <Typography variant="body1" className="text-text-secondary leading-5 transition-colors">
              Visits
            </Typography>
            <Typography variant="h5" className="text-leading-5">
              48,745
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
