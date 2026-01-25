import { Box, Card, CardContent, Typography } from '@mui/material';
import { List, Datagrid, TextField } from 'react-admin';
import { TagsField } from '../TagsField';
import Leader from './Leader';
import FailedJobs from './FailedJobs';
import SuccessfulJobs from './SuccessfulJobs';
import UntriggeredJobs from './UntriggeredJobs';
import TotalJobs from './TotalJobs';
import DnsIcon from '@mui/icons-material/Dns';

const selectRowDisabled = () => false;

const fakeProps = {
    basePath: "/members",
    count: 10,
    hasCreate: false,
    hasEdit: false,
    hasList: true,
    hasShow: false,
    location: { pathname: "/", search: "", hash: "", state: undefined },
    match: { path: "/", url: "/", isExact: true, params: {} },
    options: {},
    permissions: null,
    resource: "members"
};

const Dashboard = () => {
    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Typography 
                    variant="h4" 
                    component="h1" 
                    sx={{ 
                        fontWeight: 700, 
                        color: 'text.primary',
                        mb: 1,
                        fontSize: { xs: '1.75rem', md: '2.125rem' }
                    }}
                >
                    Dashboard
                </Typography>
                <Typography 
                    variant="body1" 
                    sx={{ color: 'text.secondary' }}
                >
                    Monitor your distributed job scheduler at a glance
                </Typography>
            </Box>

            {/* Stats Grid */}
            <Box 
                sx={{ 
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(5, 1fr)'
                    },
                    gap: { xs: 2, md: 3 },
                    mb: 4
                }}
            >
                <Leader value={window.DKRON_LEADER || "devel"} />
                <TotalJobs value={window.DKRON_TOTAL_JOBS || "0"} />
                <SuccessfulJobs value={window.DKRON_SUCCESSFUL_JOBS || "0"} />
                <FailedJobs value={window.DKRON_FAILED_JOBS || "0"} />
                <UntriggeredJobs value={window.DKRON_UNTRIGGERED_JOBS || "0"} />
            </Box>

            {/* Nodes Section */}
            <Card>
                <Box 
                    sx={{ 
                        p: 3, 
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                    }}
                >
                    <Box 
                        sx={{ 
                            width: 44, 
                            height: 44, 
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 4px 6px -1px rgba(26, 54, 93, 0.2)',
                        }}
                    >
                        <DnsIcon />
                    </Box>
                    <Box>
                        <Typography 
                            variant="h6" 
                            sx={{ fontWeight: 600, color: 'text.primary' }}
                        >
                            Cluster Nodes
                        </Typography>
                        <Typography 
                            variant="body2" 
                            sx={{ color: 'text.secondary' }}
                        >
                            Active members in your Dkron cluster
                        </Typography>
                    </Box>
                </Box>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    <List {...fakeProps}>
                        <Datagrid 
                            isRowSelectable={selectRowDisabled}
                            sx={{
                                '& .RaDatagrid-headerCell': {
                                    backgroundColor: '#f7fafc',
                                    fontWeight: 600,
                                    color: '#4a5568',
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                },
                                '& .RaDatagrid-rowCell': {
                                    borderBottom: '1px solid #e2e8f0',
                                }
                            }}
                        >
                            <TextField source="Name" sortable={false} />
                            <TextField source="Addr" sortable={false} />
                            <TextField source="Port" sortable={false} />
                            <TextField label="Status" source="statusText" sortable={false} />
                            <TagsField />
                        </Datagrid>
                    </List>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Dashboard;
