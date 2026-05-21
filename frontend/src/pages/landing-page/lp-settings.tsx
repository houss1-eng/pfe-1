import { useTranslation } from "react-i18next";

import { Card, CardContent, ListItemIcon, MenuItem, MenuList } from "@mui/material";

import UserLanguageSwitch from "@/components/layout/user/user-language-switch";
import UserModeSwitch from "@/components/layout/user/user-mode-switch";
import UserThemeSwitch from "@/components/layout/user/user-theme-switch";
import NiDocumentFull from "@/icons/nexture/ni-document-full";

export default function LPSettings() {
  const { t } = useTranslation();

  return (
    <Card className="h-44">
      <CardContent className="p-0!">
        <MenuList className="p-0">
          <UserModeSwitch />
          <UserThemeSwitch />
          <UserLanguageSwitch />
          <MenuItem>
            <ListItemIcon>
              <NiDocumentFull size={20} />
            </ListItemIcon>
            {t("user-documentation")}
          </MenuItem>
        </MenuList>
      </CardContent>
    </Card>
  );
}
