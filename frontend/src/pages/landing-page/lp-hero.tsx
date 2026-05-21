import LPLogos from "./lp-logos";
import { t } from "i18next";
import { Link } from "react-router-dom";

import { Box, Button, Paper, Typography } from "@mui/material";

import NiBasket from "@/icons/nexture/ni-basket";
import NiSendUpRight from "@/icons/nexture/ni-send-up-right";

export default function LPHero() {
  return (
    <Paper elevation={0} className="3xl:py-12 flex h-full max-w-full items-center justify-center bg-transparent py-8">
      <Box className="flex h-full w-full max-w-300 flex-1 flex-col items-center gap-10">
        <Box className="flex flex-col items-center">
          <Typography
            component="h1"
            variant="h1"
            className="mb-8 text-center text-[3rem] leading-12 font-extrabold md:text-[5rem] md:leading-20"
          >
            {t("landing-hero-first")}
            <br />
            {t("landing-hero-second")}
            <br />
            {t("landing-hero-third")}
          </Typography>

          <Typography component="p" className="max-w-md text-center text-[1.125rem] leading-6">
            {t("landing-copy-first")}
          </Typography>
          <Typography
            component="p"
            className="text-primary mb-4 max-w-md text-center text-[1.125rem] leading-6 font-semibold"
          >
            {t("landing-copy-second")}
          </Typography>

          <Box className="mb-12 flex flex-row justify-center gap-2 lg:justify-start">
            <Button
              size="large"
              color="primary"
              variant="contained"
              startIcon={<NiSendUpRight size={"large"} />}
              to="/auth/sign-in"
              target="_blank"
              component={Link}
            >
              {t("landing-view-live")}
            </Button>

            <Button
              size="large"
              color="primary"
              variant="pastel"
              startIcon={<NiBasket size={"large"} />}
              href="https://1.envato.market/k4z0"
              target="_blank"
              component={"a"}
            >
              {t("landing-purchase")}
            </Button>
          </Box>

          <Box className="mb-16 flex h-9 w-full flex-none flex-row justify-center">
            <LPLogos />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
