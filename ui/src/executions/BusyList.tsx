import {
  List,
  Datagrid,
  TextField,
  DateField,
  useRecordContext,
} from "react-admin";
import { Box, Button, Card, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { PageContainer, PageHeader } from "../layout/Page";

const selectRowDisabled = () => false;

export const OutputPanel = () => {
  const record = useRecordContext();
  return (
    <div className="execution-output">{record?.output || "Empty output"}</div>
  );
};

const BusyEmpty = () => (
  <Card
    sx={{
      minHeight: 300,
      display: "grid",
      placeItems: "center",
      textAlign: "center",
      p: { xs: 3, md: 5 },
    }}
  >
    <Stack spacing={2} alignItems="center" sx={{ maxWidth: 440 }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          color: "warning.dark",
          bgcolor: "warning.light",
          opacity: 0.8,
        }}
      >
        <HourglassEmptyIcon sx={{ fontSize: 32 }} />
      </Box>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 650, mb: 0.5 }}>
          No jobs are running
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Active executions will appear here with their assigned node, start time and live output.
        </Typography>
      </Box>
      <Button
        component={RouterLink}
        to="/jobs"
        variant="outlined"
        endIcon={<ArrowForwardIcon />}
      >
        View scheduled jobs
      </Button>
    </Stack>
  </Card>
);

export const BusyList = (props: any) => (
  <PageContainer>
    <PageHeader
      icon={PlayCircleOutlineIcon}
      title="Running Jobs"
      description="Jobs currently being executed across the cluster."
      color="#d69e2e"
    />
    <List
      {...props}
      pagination={false}
      empty={<BusyEmpty />}
      sx={{
        "& .RaList-main": {
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          minWidth: 0,
        },
        "& .RaList-content": {
          boxShadow: "none",
          borderRadius: 0,
          overflowX: "auto",
        },
      }}
    >
      <Datagrid
        rowClick="expand"
        isRowSelectable={selectRowDisabled}
        expand={<OutputPanel />}
        sx={{
          minWidth: 760,
          "& .RaDatagrid-headerCell": {
            backgroundColor: "#f7fafc",
            fontWeight: 600,
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#4a5568",
          },
          "& .RaDatagrid-row": {
            "&:hover": {
              backgroundColor: "#f7fafc",
            },
          },
          "& .RaDatagrid-rowCell": {
            borderBottom: "1px solid #e2e8f0",
          },
        }}
      >
        <TextField source="id" sortable={false} />
        <TextField source="job_name" sortable={false} />
        <TextField source="node_name" sortable={false} />
        <DateField source="started_at" sortable={false} showTime />
      </Datagrid>
    </List>
  </PageContainer>
);

export default BusyList;
