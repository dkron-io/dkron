import { lazy, Suspense, useState } from 'react';
import CodeIcon from '@mui/icons-material/Code';
import DoneIcon from '@mui/icons-material/Done';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Collapse,
    Stack,
    Typography,
    useTheme,
} from '@mui/material';

type JsonRecord = Record<string, unknown>;

interface AdvancedJsonEditorProps<T extends JsonRecord> {
    label?: string;
    value: T;
    validateValue: (value: unknown) => string | undefined;
    onChange: (value: T) => void;
    onValidityChange?: (valid: boolean, message?: string) => void;
}

const serialize = (value: JsonRecord) => JSON.stringify(value ?? {}, null, 2);
const JsonCodeEditor = lazy(() => import('./JsonCodeEditor'));

export const AdvancedJsonEditor = <T extends JsonRecord>({
    label = 'Advanced JSON',
    value,
    validateValue,
    onChange,
    onValidityChange,
}: AdvancedJsonEditorProps<T>) => {
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [text, setText] = useState(() => serialize(value));
    const [error, setError] = useState<string>();

    const validateAndApply = (nextText: string) => {
        setText(nextText);
        try {
            const parsed = JSON.parse(nextText);
            const validationError = validateValue(parsed);
            if (validationError) {
                setError(validationError);
                onValidityChange?.(false, validationError);
                return;
            }

            setError(undefined);
            onValidityChange?.(true);
            onChange(parsed as T);
        } catch (reason) {
            const message = reason instanceof Error ? reason.message : 'Invalid JSON';
            setError(message);
            onValidityChange?.(false, message);
        }
    };

    const toggle = () => {
        if (!open) {
            setText(serialize(value));
            setError(undefined);
            onValidityChange?.(true);
            setOpen(true);
            return;
        }

        if (!error) {
            setOpen(false);
        }
    };

    const format = () => {
        try {
            validateAndApply(JSON.stringify(JSON.parse(text), null, 2));
        } catch {
            // validateAndApply already displays the useful parse error.
            validateAndApply(text);
        }
    };

    return (
        <Box sx={{ mt: 1.5 }}>
            <Button
                size="small"
                variant="text"
                startIcon={open ? <DoneIcon /> : <CodeIcon />}
                onClick={toggle}
                disabled={open && Boolean(error)}
            >
                {open ? 'Done editing JSON' : label}
            </Button>
            <Collapse in={open}>
                <Box
                    sx={{
                        mt: 1,
                        border: '1px solid',
                        borderColor: error ? 'error.main' : 'divider',
                        borderRadius: 2,
                        overflow: 'hidden',
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ px: 1.5, py: 1, bgcolor: 'action.hover' }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            Values must match the API shape before the form can be saved.
                        </Typography>
                        <Button
                            size="small"
                            startIcon={<FormatAlignLeftIcon />}
                            onClick={format}
                        >
                            Format
                        </Button>
                    </Stack>
                    {open && (
                        <Suspense
                            fallback={(
                                <Box sx={{ height: 240, display: 'grid', placeItems: 'center' }}>
                                    <CircularProgress size={28} />
                                </Box>
                            )}
                        >
                            <JsonCodeEditor
                                value={text}
                                onChange={validateAndApply}
                                dark={theme.palette.mode === 'dark'}
                                label={`${label} editor`}
                            />
                        </Suspense>
                    )}
                </Box>
                {error && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                        {error}
                    </Alert>
                )}
            </Collapse>
        </Box>
    );
};
