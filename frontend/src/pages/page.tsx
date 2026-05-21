import LPCategoriesChart from "./landing-page/lp-categories-chart";
import LPCurrencies from "./landing-page/lp-currencies";
import LPFooter from "./landing-page/lp-footer";
import LPHelp from "./landing-page/lp-help";
import LPHero from "./landing-page/lp-hero";
import LPInventory from "./landing-page/lp-inventory";
import LPProgresses from "./landing-page/lp-progresses";
import LPReviews from "./landing-page/lp-reviews";
import LPSettings from "./landing-page/lp-settings";
import LPShortcuts from "./landing-page/lp-shortcuts";
import LPSources from "./landing-page/lp-sources";
import LPStat from "./landing-page/lp-stat";
import LPStats from "./landing-page/lp-stats";
import LPStatsWider from "./landing-page/lp-stats-wider";
import LpStocks from "./landing-page/lp-stocks";
import LPSummary from "./landing-page/lp-summary";
import LpTasks from "./landing-page/lp-tasks";
import LPTopNav from "./landing-page/lp-top-nav";
import LPUser from "./landing-page/lp-user";

import { Box, Grid } from "@mui/material";

export default function Home() {
  return (
    <>
      <Box className="bg-background mx-auto flex min-h-[100dvh] w-[100rem] max-w-full flex-col items-center px-4 py-0 md:px-8">
        <LPTopNav />
        <LPHero />

        <Grid container spacing={5} className="flex w-[75rem] max-w-full">
          <Grid size={{ lg: 4, md: 6, xs: 12 }}>
            <LPSettings />
          </Grid>
          <Grid size={{ lg: 4, md: 6, xs: 12 }}>
            <LPStat />
          </Grid>
          <Grid size={{ lg: 4, md: 6, xs: 12 }} className="block md:hidden lg:block">
            <LPUser />
          </Grid>
          <Grid size={{ lg: 4, md: 6, xs: 12 }}>
            <LPStats />
          </Grid>
          <Grid size={{ lg: 4, md: 6, xs: 12 }}>
            <LPCategoriesChart />
          </Grid>
          <Grid size={{ lg: 4, md: 6, xs: 12 }} className="block md:hidden lg:block">
            <LPSources />
          </Grid>
          <Grid size={{ lg: 6, xs: 12 }}>
            <LPHelp />
          </Grid>
          <Grid size={{ lg: 6, xs: 12 }}>
            <LPReviews />
          </Grid>
          <Grid size={{ lg: 6, xs: 12 }}>
            <LPCurrencies />
          </Grid>
          <Grid size={{ lg: 6, xs: 12 }}>
            <LPProgresses />
          </Grid>
          <Grid size={{ lg: 4, md: 6, xs: 12 }}>
            <LpTasks />
          </Grid>
          <Grid size={{ lg: 4, md: 6, xs: 12 }}>
            <LpStocks />
          </Grid>
          <Grid size={{ lg: 4, md: 6, xs: 12 }} className="block md:hidden lg:block">
            <LPSummary />
          </Grid>
          <Grid size={{ lg: 4, md: 6, xs: 12 }}>
            <LPInventory />
          </Grid>
          <Grid size={{ lg: 4, md: 6, xs: 12 }}>
            <LPStatsWider />
          </Grid>
          <Grid size={{ lg: 4, md: 6, xs: 12 }} className="block md:hidden lg:block">
            <LPShortcuts />
          </Grid>
        </Grid>
      </Box>

      <LPFooter />
    </>
  );
}
