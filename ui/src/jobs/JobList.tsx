import {
    Datagrid,
    TextField,
    NumberField,
    DateField,
    EditButton,
    Filter,
    TextInput,
    List,
    SelectInput,
    BulkDeleteButton,
    BooleanInput,
    Pagination
} from 'react-admin';
import { Fragment } from 'react';
import { Box, Typography } from '@mui/material';
import BulkRunButton from "./BulkRunButton";
import BulkToggleButton from "./BulkToggleButton";
import StatusField from "./StatusField";
import EnabledField from "./EnabledField";
import { styled } from '@mui/material/styles';
import UpdateIcon from '@mui/icons-material/Update';

const JobFilter = (props: any) => (
    <Filter {...props}>
        <TextInput 
            label="Search" 
            source="q" 
            alwaysOn 
            sx={{ ml: 2 }}
        />
        <SelectInput 
            source="status" 
            choices={[
                { id: 'success', name: 'Success' },
                { id: 'failed', name: 'Failed' },
                { id: 'untriggered', name: 'Waiting to Run' },
            ]} 
        />
        <BooleanInput source="disabled"/>
    </Filter>
);

const JobBulkActionButtons = () => (
    <Fragment>
        <BulkRunButton />
        <BulkToggleButton />
        <BulkDeleteButton />
    </Fragment>
);

const JobPagination = (props: any) => <Pagination rowsPerPageOptions={[5, 10, 25, 50, 100]} {...props} />;

const PREFIX = 'JobList';

const classes = {
    hiddenOnSmallScreens: `${PREFIX}-hiddenOnSmallScreens`,
    cell: `${PREFIX}-cell`,
};

const StyledDatagrid = styled(Datagrid)(({ theme }) => ({
    [`& .${classes.hiddenOnSmallScreens}`]: {
        display: 'table-cell',
        [theme.breakpoints.down('md')]: {
            display: 'none',
        },
    },
    [`& .${classes.cell}`]: {
        padding: "6px 8px 6px 8px",
    },
    '& .RaDatagrid-headerCell': {
        backgroundColor: '#f7fafc',
        fontWeight: 600,
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#4a5568',
    },
    '& .RaDatagrid-row': {
        '&:hover': {
            backgroundColor: '#f7fafc',
        },
    },
    '& .RaDatagrid-rowCell': {
        borderBottom: '1px solid #e2e8f0',
    },
}));

const ListHeader = () => (
    <Box 
        sx={{ 
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
        }}
    >
        <Box 
            sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: 2,
                background: 'linear-gradient(135deg, #3182ce 0%, #2c5282 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 6px -1px rgba(49, 130, 206, 0.2)',
            }}
        >
            <UpdateIcon />
        </Box>
        <Box>
            <Typography 
                variant="h5" 
                sx={{ fontWeight: 600, color: 'text.primary' }}
            >
                Scheduled Jobs
            </Typography>
            <Typography 
                variant="body2" 
                sx={{ color: 'text.secondary' }}
            >
                Manage your distributed cron jobs
            </Typography>
        </Box>
    </Box>
);

const JobList = (props: any) => {
    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <ListHeader />
            <List 
                {...props} 
                filters={<JobFilter />} 
                pagination={<JobPagination />}
                sx={{
                    '& .RaList-main': {
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                        borderRadius: 3,
                        border: '1px solid #e2e8f0',
                    },
                    '& .RaList-content': {
                        boxShadow: 'none',
                    },
                }}
            >
                <StyledDatagrid rowClick="show" bulkActionButtons={<JobBulkActionButtons />}>
                    <TextField source="id" />
                    <TextField source="displayname" label="Display name" />
                    <TextField source="timezone" sortable={false}
                        cellClassName={classes.hiddenOnSmallScreens}
                        headerClassName={classes.hiddenOnSmallScreens} />
                    <TextField source="schedule" />
                    <NumberField source="success_count" 
                        cellClassName={classes.hiddenOnSmallScreens}
                        headerClassName={classes.hiddenOnSmallScreens} />
                    <NumberField source="error_count" 
                        cellClassName={classes.hiddenOnSmallScreens}
                        headerClassName={classes.hiddenOnSmallScreens} />
                    <DateField source="last_success" showTime />
                    <DateField source="last_error" showTime />
                    <EnabledField label="Enabled" />
                    <NumberField source="retries" sortable={false} />
                    <StatusField />
                    <DateField source="next" showTime />
                    <EditButton/>
                </StyledDatagrid>
            </List>
        </Box>
    );
};

export default JobList;
