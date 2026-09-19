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
    Pagination,
    useRecordContext,
} from 'react-admin';
import { Fragment } from 'react';
import { Typography } from '@mui/material';
import BulkRunButton from "./BulkRunButton";
import BulkToggleButton from "./BulkToggleButton";
import StatusField from "./StatusField";
import EnabledField from "./EnabledField";
import { styled } from '@mui/material/styles';
import UpdateIcon from '@mui/icons-material/Update';
import { PageContainer, PageHeader } from '../layout/Page';

const JobFilter = (props: any) => (
    <Filter {...props}>
        <TextInput
            label="Search"
            source="q"
            alwaysOn
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

const NextRunField = () => {
    const record = useRecordContext();

    if (!record?.next || record.next === '0001-01-01T00:00:00Z') {
        return (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                {record?.schedule === '@manually' ? 'Manual trigger' : 'Not scheduled'}
            </Typography>
        );
    }

    return <DateField source="next" showTime />;
};

const PREFIX = 'JobList';

const classes = {
    hiddenOnSmallScreens: `${PREFIX}-hiddenOnSmallScreens`,
    cell: `${PREFIX}-cell`,
    idCell: `${PREFIX}-idCell`,
    displayNameCell: `${PREFIX}-displayNameCell`,
    scheduleCell: `${PREFIX}-scheduleCell`,
};

const StyledDatagrid = styled(Datagrid)(({ theme }) => ({
    [`& .${classes.hiddenOnSmallScreens}`]: {
        display: 'table-cell',
        [theme.breakpoints.down('md')]: {
            display: 'none',
        },
    },
    [`& .${classes.cell}`]: {
        padding: '12px 16px',
    },
    [`& .${classes.idCell}`]: {
        minWidth: 150,
        whiteSpace: 'nowrap',
    },
    [`& .${classes.displayNameCell}`]: {
        minWidth: 170,
    },
    [`& .${classes.scheduleCell}`]: {
        minWidth: 130,
        whiteSpace: 'nowrap',
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
    minWidth: 1280,
}));

const JobList = (props: any) => {
    return (
        <PageContainer>
            <PageHeader
                icon={UpdateIcon}
                title="Scheduled Jobs"
                description="Manage schedules, execution status and job configuration."
            />
            <List
                {...props}
                filters={<JobFilter />}
                pagination={<JobPagination />}
                sx={{
                    '& .RaList-main': {
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                        borderRadius: 3,
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        width: '100%',
                        maxWidth: '100%',
                        minWidth: 0,
                    },
                    '& .RaList-actions': {
                        minHeight: 64,
                        px: { xs: 2, sm: 3 },
                        py: 1.5,
                        m: 0,
                        gap: 1,
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' },
                        flexWrap: { xs: 'nowrap', sm: 'wrap' },
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    },
                    '& .RaList-actions > form': {
                        width: { xs: '100%', sm: 'auto' },
                    },
                    '& .RaList-actions > form .MuiFormControl-root': {
                        width: { xs: '100%', sm: 210 },
                    },
                    '& .RaList-actions > .MuiToolbar-root': {
                        width: { xs: '100%', sm: 'auto' },
                        minHeight: { xs: 40, sm: 56 },
                        height: { xs: 40, sm: 'auto' },
                        p: 0,
                        justifyContent: { xs: 'flex-end', sm: 'initial' },
                    },
                    '& .RaList-content': {
                        boxShadow: 'none',
                        borderRadius: 0,
                        overflowX: 'auto',
                    },
                }}
            >
                <StyledDatagrid rowClick="show" bulkActionButtons={<JobBulkActionButtons />}>
                    <TextField source="id" cellClassName={classes.idCell} headerClassName={classes.idCell} />
                    <TextField source="displayname" label="Display name" cellClassName={classes.displayNameCell} headerClassName={classes.displayNameCell} />
                    <TextField source="timezone" sortable={false}
                        cellClassName={classes.hiddenOnSmallScreens}
                        headerClassName={classes.hiddenOnSmallScreens} />
                    <TextField source="schedule" cellClassName={classes.scheduleCell} headerClassName={classes.scheduleCell} />
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
                    <NextRunField />
                    <EditButton/>
                </StyledDatagrid>
            </List>
        </PageContainer>
    );
};

export default JobList;
