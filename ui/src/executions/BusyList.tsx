import {
  List,
  Datagrid,
  TextField,
  DateField,
  useRecordContext,
} from "react-admin";
import { Box, Typography } from "@mui/material";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";

const selectRowDisabled = () => false;

export const OutputPanel = () => {
  const record = useRecordContext();
  return (
    <div className="execution-output">{record?.output || "Empty output"}</div>
  );
};

const ListHeader = () => (
  <Box
    sx={{
      mb: 3,
      display: "flex",
      alignItems: "center",
      gap: 2,
    }}
  >
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: 2,
        background: 'linear-gradient(135deg, #d69e2e 0%, #b7791f 100%)',
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        boxShadow: '0 4px 6px -1px rgba(214, 158, 46, 0.2)',
      }}
    >
      <PlayCircleOutlineIcon />
    </Box>
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
        Running Jobs
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Jobs currently being executed across the cluster
      </Typography>
    </Box>
  </Box>
);

export const BusyList = (props: any) => (
  <Box sx={{ p: { xs: 2, md: 3 } }}>
    <ListHeader />
    <List
      {...props}
      pagination={false}
      sx={{
        "& .RaList-main": {
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        },
        "& .RaList-content": {
          boxShadow: "none",
        },
      }}
    >
      <Datagrid
        rowClick="expand"
        isRowSelectable={selectRowDisabled}
        expand={<OutputPanel />}
        sx={{
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
  </Box>
);

export default BusyList;
