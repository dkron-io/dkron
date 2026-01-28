import { Chip, Box } from '@mui/material';
import { useRecordContext } from 'react-admin';

export const TagsField = () => {
    const record = useRecordContext();
    if (record === undefined || !record.Tags) {
        return null;
    } else {
        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {Object.keys(record.Tags).map(key => (
                    <Chip 
                        key={key}
                        label={`${key}: ${record.Tags[key]}`}
                        size="small"
                        sx={{
                            backgroundColor: 'rgba(49, 130, 206, 0.1)',
                            color: '#2c5282',
                            fontWeight: 500,
                            fontSize: '0.7rem',
                            height: 22,
                        }}
                    />
                ))}
            </Box>
        );
    }
};
