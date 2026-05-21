import { Avatar, Box, Button, Card, CardContent, ListItemAvatar, ListItemText, Typography } from "@mui/material";

import NiExclamationSquare from "@/icons/nexture/ni-exclamation-square";
import NiPower from "@/icons/nexture/ni-power";

export default function LPSummary() {
  return (
    <Card className="h-full">
      <CardContent>
        <Typography variant="h6" component="h6" className="card-title">
          Summary
        </Typography>

        <Box className="flex flex-col items-start gap-4">
          <Box className="flex flex-col gap-1">
            <Typography variant="subtitle2">Status</Typography>
            <Button
              className="pointer-events-none self-center"
              size="small"
              color="error"
              variant="pastel"
              startIcon={<NiExclamationSquare size={"small"} />}
            >
              Open
            </Button>
          </Box>

          <Box className="flex flex-col gap-1">
            <Typography variant="subtitle2">Assignee</Typography>
            <Box className="flex flex-row items-center">
              <ListItemAvatar>
                <Avatar className="medium me-3" alt={"Laura Ellis"} src={"/images/avatars/avatar-5.jpg"}></Avatar>
              </ListItemAvatar>
              <ListItemText
                className="w-32 flex-none"
                primary={
                  <Typography component="p" variant="body1" className="leading-4">
                    Laura Ellis
                  </Typography>
                }
              />
            </Box>
          </Box>

          <Box className="flex flex-col gap-1">
            <Typography variant="subtitle2">Category</Typography>
            <Box className="flex h-full flex-row items-center gap-1.5">
              <NiPower className="text-primary" />
              <Typography>Performance</Typography>
            </Box>
          </Box>

          <Box className="flex flex-col gap-1">
            <Typography variant="subtitle2">Create Date</Typography>
            <Typography variant="body1" className="text-text-secondary">
              1 day ago
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
