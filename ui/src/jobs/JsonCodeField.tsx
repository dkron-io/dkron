import { useState } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useNotify, useRecordContext } from 'react-admin';

export const JsonCodeField = ({ source }: { source: string }) => {
    const record = useRecordContext();
    const notify = useNotify();
    const [copied, setCopied] = useState(false);
    const text = JSON.stringify(record?.[source] ?? {}, null, 2);

    const copy = async () => {
        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error('Clipboard API unavailable');
            }
            await navigator.clipboard.writeText(text);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            notify('Unable to copy JSON', { type: 'warning' });
        }
    };

    return (
        <Box
            sx={{
                position: 'relative',
                width: '100%',
                mt: 0.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'action.hover',
                overflow: 'auto',
            }}
        >
            <Tooltip title={copied ? 'Copied' : 'Copy JSON'}>
                <IconButton
                    size="small"
                    aria-label={`Copy ${source} JSON`}
                    onClick={copy}
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                >
                    {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                </IconButton>
            </Tooltip>
            <Typography
                component="pre"
                sx={{
                    m: 0,
                    p: 2,
                    pr: 6,
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                }}
            >
                {text}
            </Typography>
        </Box>
    );
};
