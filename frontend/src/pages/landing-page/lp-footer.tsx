import { t } from "i18next";
import { Link } from "react-router-dom";

import { Box, Button } from "@mui/material";

export default function LPFooter() {
  return (
    <Box className="border-grey-100 mt-16 flex h-16 w-full flex-none items-center justify-center border-t">
      <Box className="flex flex-row gap-1">
        <Button
          className="min-w-0! px-2! lg:px-4!"
          variant="text"
          size="large"
          color="text-primary"
          to="/auth/sign-in"
          target="_blank"
          component={Link}
        >
          {t("landing-view")}
        </Button>
        <Button
          className="min-w-0! px-2! lg:px-4!"
          variant="text"
          size="large"
          color="text-primary"
          to="/docs/welcome/introduction"
          target="_blank"
          component={Link}
        >
          {t("footer-docs")}
        </Button>
        <Button
          className="min-w-0! px-2! lg:px-4!"
          variant="text"
          size="large"
          color="text-primary"
          target="_blank"
          to="https://www.figma.com/design/ZMvZsFJc498q1Y11FroNaW/gogo-design-7.3.0?node-id=1381-11546&t=ZgHIoeE8mt3tfiNR-1"
          component={Link}
        >
          {t("footer-figma")}
        </Button>
        <Button
          className="min-w-0! px-2! lg:px-4!"
          variant="text"
          size="large"
          color="text-primary"
          target="_blank"
          to="https://1.envato.market/k4z0"
          component={Link}
        >
          {t("footer-purchase")}
        </Button>
      </Box>
    </Box>
  );
}
