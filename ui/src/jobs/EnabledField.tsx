import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { Tooltip, Chip } from '@mui/material';
import { useRecordContext } from 'react-admin';

interface EnabledFieldProps {
    label?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EnabledField = (_props: EnabledFieldProps) => {
    const record = useRecordContext();

    if (!record) return null;

    if (record.disabled) {
        return (
            <Tooltip title="Disabled">
                <Chip
                    icon={<CancelIcon sx={{ fontSize: 16 }} />}
                    label="Disabled"
                    size="small"
                    sx={{
                        backgroundColor: 'rgba(229, 62, 62, 0.1)',
                        color: '#e53e3e',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        height: 24,
                        '& .MuiChip-icon': {
                            color: '#e53e3e',
                        },
                    }}
                />
            </Tooltip>
        );
    } else {
        return (
            <Tooltip title="Enabled">
                <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                    label="Enabled"
                    size="small"
                    sx={{
                        backgroundColor: 'rgba(56, 161, 105, 0.1)',
                        color: '#38a169',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        height: 24,
                        '& .MuiChip-icon': {
                            color: '#38a169',
                        },
                    }}
                />
            </Tooltip>
        );
    }
};

export default EnabledField;
