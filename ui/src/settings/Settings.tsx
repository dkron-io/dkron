import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Stack,
    Typography,
} from '@mui/material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TuneIcon from '@mui/icons-material/Tune';
import SecurityIcon from '@mui/icons-material/Security';
import { Title } from 'react-admin';
import { ReactNode } from 'react';
import { PageContainer, PageHeader } from '../layout/Page';

const SettingRow = ({
    icon,
    title,
    description,
    value,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    value: ReactNode;
}) => (
    <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ sm: 'center' }}
        sx={{ py: 2.5 }}
    >
        <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
        <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {description}
            </Typography>
        </Box>
        <Box sx={{ flex: '0 0 auto' }}>{value}</Box>
    </Stack>
);

const Settings = () => (
    <PageContainer>
        <Title title="Settings" />
        <PageHeader
            icon={SettingsOutlinedIcon}
            title="Settings"
            description="Understand where Dkron configuration is managed."
            color="#4a5568"
        />

        <Card sx={{ maxWidth: 900 }}>
            <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 650 }}>
                    Runtime configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1 }}>
                    Agent and cluster settings are intentionally managed outside the web UI so every
                    node can be configured and deployed consistently.
                </Typography>

                <SettingRow
                    icon={<TuneIcon />}
                    title="Configuration sources"
                    description="Use a YAML configuration file, DKRON_ environment variables, or command-line flags."
                    value={<Chip label="Server managed" size="small" variant="outlined" />}
                />
                <Divider />
                <SettingRow
                    icon={<SecurityIcon />}
                    title="Authentication and access"
                    description="ACL behavior and API access are controlled by the Dkron agent configuration."
                    value={<Chip label="Agent configuration" size="small" variant="outlined" />}
                />

                <Divider sx={{ mb: 2.5 }} />
                <Button
                    component="a"
                    href="https://dkron.io/docs/basics/configuration"
                    target="_blank"
                    rel="noreferrer"
                    variant="outlined"
                    endIcon={<OpenInNewIcon />}
                >
                    Open configuration documentation
                </Button>
            </CardContent>
        </Card>
    </PageContainer>
);

export default Settings;
