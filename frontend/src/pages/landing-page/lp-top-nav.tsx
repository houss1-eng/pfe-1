import { Link } from "react-router-dom";

import { Box, Button } from "@mui/material";

import Logo from "@/components/logo/logo";

export default function LPTopNav() {
  return (
    <Box className="flex h-16 w-full flex-none items-center justify-between">
      <Logo classNameFull="hidden sm:block" classNameMobile="sm:hidden" />

      <Box className="flex flex-row gap-2">
        <Button
          variant="text"
          size="large"
          color="text-primary"
          to="/auth/sign-in"
          component={Link}
        >
          Se connecter
        </Button>
        <Button
          variant="contained"
          size="large"
          color="primary"
          to="/app"
          component={Link}
        >
          Accéder à l'app
        </Button>
      </Box>
    </Box>
  );
}
