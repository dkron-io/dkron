import SuccessIcon from '@mui/icons-material/CheckCircle';
import FailedIcon from '@mui/icons-material/Cancel';
import UntriggeredIcon from '@mui/icons-material/Schedule';
import { Tooltip, Chip } from '@mui/material';
import { useRecordContext } from 'react-admin';

const StatusField = () => {
    const record = useRecordContext();
    
    if (!record) return null;

    const getStatusConfig = () => {
        switch (record.status) {
            case 'success':
                return {
                    icon: <SuccessIcon sx={{ fontSize: 16 }} />,
                    label: 'Success',
                    color: '#38a169',
                    bgColor: 'rgba(56, 161, 105, 0.1)',
                };
            case 'failed':
                return {
                    icon: <FailedIcon sx={{ fontSize: 16 }} />,
                    label: 'Failed',
                    color: '#e53e3e',
                    bgColor: 'rgba(229, 62, 62, 0.1)',
                };
            default:
                return {
                    icon: <UntriggeredIcon sx={{ fontSize: 16 }} />,
                    label: 'Pending',
                    color: '#d69e2e',
                    bgColor: 'rgba(214, 158, 46, 0.1)',
                };
        }
    };

    const config = getStatusConfig();

    return (
        <Tooltip title={config.label}>
            <Chip
                icon={config.icon}
                label={config.label}
                size="small"
                sx={{
                    backgroundColor: config.bgColor,
                    color: config.color,
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    height: 24,
                    '& .MuiChip-icon': {
                        color: config.color,
                    },
                }}
            />
        </Tooltip>
    );
};

export default StatusField;
