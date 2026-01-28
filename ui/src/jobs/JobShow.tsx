import {
  Datagrid,
  TextField,
  NumberField,
  DateField,
  EditButton,
  BooleanField,
  TopToolbar,
  Show,
  TabbedShowLayout,
  Tab,
  ReferenceManyField,
  useNotify,
  Button,
  useRecordContext,
  Labeled,
} from "react-admin";
import ToggleButton from "./ToggleButton";
import RunButton from "./RunButton";
import { JsonField } from "react-admin-json-view";
import ZeroDateField from "./ZeroDateField";
import JobIcon from "@mui/icons-material/Update";
import FullIcon from "@mui/icons-material/BatteryFull";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SettingsIcon from "@mui/icons-material/Settings";
import PlaylistPlayIcon from "@mui/icons-material/PlaylistPlay";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { Box, Card, CardContent, Typography, Chip, Tooltip } from "@mui/material";
import { useState } from "react";
import { apiUrl, httpClient } from "../dataProvider";

const JobShowActions = ({ data }: any) => (
  <TopToolbar sx={{ gap: 1, mt: 2, mb: 1 }}>
    <RunButton />
    <ToggleButton />
    <EditButton record={data} />
  </TopToolbar>
);

const SuccessField = () => {
  const record = useRecordContext();

  if (record && record["finished_at"] === "0001-01-01T00:00:00Z") {
    return (
      <Tooltip title="Running">
        <HourglassEmptyIcon color="info" />
      </Tooltip>
    );
  } else if (record && record["success"]) {
    return (
      <Tooltip title="Success">
        <CheckCircleIcon color="success" />
      </Tooltip>
    );
  } else {
    return (
      <Tooltip title="Failed">
        <ErrorIcon color="error" />
      </Tooltip>
    );
  }
};

const FullButton = ({ record }: any) => {
  const notify = useNotify();
  const [loading, setLoading] = useState(false);
  const handleClick = () => {
    setLoading(true);
    httpClient(`${apiUrl}/jobs/${record.job_name}/executions/${record.id}`)
      .then((response) => {
        if (response.status === 200) {
          notify("Success loading full output");
          return response.json;
        }
        throw response;
      })
      .then((data) => {
        record.output_truncated = false;
        record.output = data.output;
      })
      .catch((e) => {
        notify("Error on loading full output", { type: "warning" });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (record.output_truncated === false) return record.output;

  return (
    <Button label="Load full output" onClick={handleClick} disabled={loading}>
      <FullIcon />
    </Button>
  );
};

const SpecialOutputPanel = () => {
  const record = useRecordContext();
  if (!record) return null;
  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: "#1a202c",
        borderRadius: 1,
        fontFamily: "monospace",
        fontSize: "0.875rem",
        color: "#e2e8f0",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        maxHeight: 400,
        overflow: "auto",
      }}
    >
      {record.output_truncated && (
        <Box sx={{ mb: 2 }}>
          <FullButton record={record} />
        </Box>
      )}
      {record.output || "Nothing to show"}
    </Box>
  );
};

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      mb: 2,
      pb: 1,
      borderBottom: "1px solid",
      borderColor: "divider",
    }}
  >
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 1.5,
        background: "linear-gradient(135deg, #3182ce 0%, #2c5282 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
      }}
    >
      <Icon fontSize="small" />
    </Box>
    <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
      {title}
    </Typography>
  </Box>
);

const StatusChip = () => {
  const record = useRecordContext();
  if (!record) return null;

  const status = record.status;
  const colorMap: Record<string, "success" | "error" | "warning" | "default"> = {
    success: "success",
    failed: "error",
    running: "warning",
    untriggered: "default",
  };

  return (
    <Chip
      label={status || "unknown"}
      color={colorMap[status] || "default"}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  );
};

const JobHeader = () => {
  const record = useRecordContext();
  if (!record) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            background: "linear-gradient(135deg, #1a365d 0%, #2c5282 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 4px 6px -1px rgba(26, 54, 93, 0.2)",
          }}
        >
          <JobIcon />
        </Box>
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: "text.primary" }}
          >
            {record.displayname || record.name}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {record.schedule} {record.timezone && `(${record.timezone})`}
          </Typography>
        </Box>
        <Box sx={{ ml: "auto" }}>
          <StatusChip />
        </Box>
      </Box>
    </Box>
  );
};

const FieldGroup = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
      gap: 2,
      "& .RaLabeled-label": {
        fontSize: "0.75rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "text.secondary",
      },
    }}
  >
    {children}
  </Box>
);

const StyledJsonField = ({ source, label }: { source: string; label?: string }) => (
  <Box sx={{ mt: 2 }}>
    <Labeled label={label || source}>
      <JsonField
        source={source}
        reactJsonOptions={{
          name: null,
          collapsed: false,
          enableClipboard: true,
          displayDataTypes: false,
          style: {
            backgroundColor: "#f7fafc",
            padding: "12px",
            borderRadius: "8px",
          },
        }}
      />
    </Labeled>
  </Box>
);

const JobShow = (props: any) => (
  <Show
    actions={<JobShowActions {...props} />}
    {...props}
    sx={{
      "& .RaShow-main": {
        p: { xs: 2, md: 3 },
      },
    }}
  >
    <JobHeader />
    <TabbedShowLayout
      sx={{
        "& .RaTabbedShowLayout-content": {
          p: 0,
          pt: 3,
        },
      }}
    >
      <Tab label="Summary" icon={<JobIcon />}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <SectionHeader icon={ScheduleIcon} title="Schedule Information" />
            <FieldGroup>
              <Labeled label="Name">
                <TextField source="name" />
              </Labeled>
              <Labeled label="Display Name">
                <TextField source="displayname" emptyText="-" />
              </Labeled>
              <Labeled label="Timezone">
                <TextField source="timezone" emptyText="UTC" />
              </Labeled>
              <Labeled label="Schedule">
                <TextField source="schedule" />
              </Labeled>
              <Labeled label="Next Run">
                <DateField source="next" showTime />
              </Labeled>
              <Labeled label="Status">
                <StatusChip />
              </Labeled>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <SectionHeader icon={PlaylistPlayIcon} title="Execution History" />
            <FieldGroup>
              <Labeled label="Last Success">
                <DateField source="last_success" showTime emptyText="Never" />
              </Labeled>
              <Labeled label="Last Error">
                <DateField source="last_error" showTime emptyText="Never" />
              </Labeled>
              <Labeled label="Success Count">
                <NumberField source="success_count" />
              </Labeled>
              <Labeled label="Error Count">
                <NumberField source="error_count" />
              </Labeled>
              <Labeled label="Retries">
                <NumberField source="retries" />
              </Labeled>
              <Labeled label="Concurrency">
                <TextField source="concurrency" />
              </Labeled>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <SectionHeader icon={SettingsIcon} title="Configuration" />
            <FieldGroup>
              <Labeled label="Ephemeral">
                <BooleanField source="ephemeral" />
              </Labeled>
              <Labeled label="Disabled">
                <BooleanField source="disabled" />
              </Labeled>
              <Labeled label="Starts At">
                <DateField source="starts_at" showTime emptyText="Not set" />
              </Labeled>
              <Labeled label="Expires At">
                <DateField source="expires_at" showTime emptyText="Not set" />
              </Labeled>
              <Labeled label="Executor">
                <TextField source="executor" />
              </Labeled>
              <Labeled label="Parent Job">
                <TextField source="parent_job" emptyText="None" />
              </Labeled>
            </FieldGroup>

            <StyledJsonField source="executor_config" label="Executor Config" />
            <StyledJsonField source="tags" label="Tags" />
            <StyledJsonField source="processors" label="Processors" />
            <StyledJsonField source="metadata" label="Metadata" />
          </CardContent>
        </Card>
      </Tab>

      <Tab label="Executions" path="executions" icon={<PlaylistPlayIcon />}>
        <Card>
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            <ReferenceManyField
              reference="executions"
              target="jobs"
              label=""
            >
              <Datagrid
                rowClick="expand"
                isRowSelectable={() => false}
                expand={<SpecialOutputPanel />}
                sx={{
                  "& .RaDatagrid-headerCell": {
                    backgroundColor: "#f7fafc",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#4a5568",
                  },
                  "& .RaDatagrid-rowCell": {
                    borderBottom: "1px solid #e2e8f0",
                  },
                  "& .RaDatagrid-expandedPanel": {
                    backgroundColor: "#f7fafc",
                  },
                }}
              >
                <TextField source="id" label="ID" />
                <TextField source="group" label="Group" sortable={false} />
                <DateField source="started_at" label="Started" showTime />
                <ZeroDateField source="finished_at" label="Finished" showTime />
                <TextField source="node_name" label="Node" sortable={false} />
                <SuccessField />
                <NumberField source="attempt" label="Attempt" />
              </Datagrid>
            </ReferenceManyField>
          </CardContent>
        </Card>
      </Tab>
    </TabbedShowLayout>
  </Show>
);

export default JobShow;
