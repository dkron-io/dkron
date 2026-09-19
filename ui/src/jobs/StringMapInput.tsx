import { useEffect, useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
    Autocomplete,
    Box,
    Button,
    FormHelperText,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { InputHelperText, useInput } from 'react-admin';
import { useFormContext } from 'react-hook-form';
import { AdvancedJsonEditor } from './AdvancedJsonEditor';

export type StringMap = Record<string, string>;

interface MapRow {
    id: number;
    key: string;
    value: string;
}

interface KeyValueEditorProps {
    value?: StringMap;
    onChange: (value: StringMap) => void;
    onValidityChange?: (valid: boolean, message?: string) => void;
    keyOptions?: string[];
    suggestedValues?: StringMap;
    emptyText?: string;
    advancedLabel?: string;
}

interface StringMapInputProps extends Omit<KeyValueEditorProps, 'value' | 'onChange' | 'onValidityChange'> {
    source: string;
    label: string;
    helperText?: string;
}

let nextRowId = 0;

const rowsFromMap = (value?: StringMap): MapRow[] =>
    Object.entries(value ?? {}).map(([key, rowValue]) => ({
        id: nextRowId++,
        key,
        value: rowValue,
    }));

const validateRows = (rows: MapRow[]) => {
    const nonEmptyRows = rows.filter(row => row.key || row.value);
    const rowWithoutKey = nonEmptyRows.find(row => !row.key.trim());
    if (rowWithoutKey) return 'Every value must have a key.';

    const keys = nonEmptyRows.map(row => row.key.trim());
    if (new Set(keys).size !== keys.length) return 'Keys must be unique.';
    return undefined;
};

const mapFromRows = (rows: MapRow[]): StringMap =>
    rows.reduce<StringMap>((result, row) => {
        const key = row.key.trim();
        if (key) result[key] = row.value;
        return result;
    }, {});

export const validateStringMap = (value: unknown): string | undefined => {
    if (value === null || Array.isArray(value) || typeof value !== 'object') {
        return 'Expected a JSON object.';
    }
    const invalidEntry = Object.entries(value).find(([, entryValue]) => typeof entryValue !== 'string');
    if (invalidEntry) return `Value for “${invalidEntry[0]}” must be a string.`;
    return undefined;
};

const isSecretKey = (key: string) => /(password|secret|token|private.?key|credential)/i.test(key);
const isMultilineKey = (key: string) => /(command|body|message|payload|headers|attributes|certificate)/i.test(key);

export const KeyValueEditor = ({
    value = {},
    onChange,
    onValidityChange,
    keyOptions = [],
    suggestedValues,
    emptyText = 'No entries configured.',
    advancedLabel = 'Edit as JSON',
}: KeyValueEditorProps) => {
    const [rows, setRows] = useState<MapRow[]>(() => rowsFromMap(value));
    const [visibleSecrets, setVisibleSecrets] = useState<Set<number>>(() => new Set());
    const lastCommitted = useRef(JSON.stringify(value ?? {}));
    const valueSignature = JSON.stringify(value ?? {});

    useEffect(() => {
        if (valueSignature !== lastCommitted.current) {
            setRows(rowsFromMap(value));
            lastCommitted.current = valueSignature;
        }
    }, [value, valueSignature]);

    const commit = (nextRows: MapRow[]) => {
        setRows(nextRows);
        const validationError = validateRows(nextRows);
        onValidityChange?.(!validationError, validationError);
        if (validationError) return;

        const nextValue = mapFromRows(nextRows);
        lastCommitted.current = JSON.stringify(nextValue);
        onChange(nextValue);
    };

    const updateRow = (id: number, patch: Partial<MapRow>) => {
        commit(rows.map(row => (row.id === id ? { ...row, ...patch } : row)));
    };

    const addSuggestedValues = () => {
        const merged = { ...mapFromRows(rows), ...suggestedValues };
        const nextRows = rowsFromMap(merged);
        commit(nextRows);
    };

    const applyJson = (nextValue: StringMap) => {
        const nextRows = rowsFromMap(nextValue);
        setRows(nextRows);
        lastCommitted.current = JSON.stringify(nextValue);
        onValidityChange?.(true);
        onChange(nextValue);
    };

    return (
        <Box>
            {rows.length === 0 ? (
                <Box
                    sx={{
                        px: 2,
                        py: 2.5,
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 2,
                        textAlign: 'center',
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        {emptyText}
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={1.25}>
                    {rows.map(row => {
                        const secret = isSecretKey(row.key);
                        const visible = visibleSecrets.has(row.id);
                        return (
                            <Stack
                                key={row.id}
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={1}
                                alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                            >
                                <Autocomplete
                                    freeSolo
                                    options={keyOptions}
                                    inputValue={row.key}
                                    onInputChange={(_, key) => updateRow(row.id, { key })}
                                    sx={{ flex: '0 1 38%', minWidth: { sm: 180 } }}
                                    renderInput={params => (
                                        <TextField {...params} label="Key" size="small" />
                                    )}
                                />
                                <TextField
                                    label="Value"
                                    size="small"
                                    value={row.value}
                                    type={secret && !visible ? 'password' : 'text'}
                                    multiline={isMultilineKey(row.key) && !secret}
                                    maxRows={6}
                                    onChange={event => updateRow(row.id, { value: event.target.value })}
                                    sx={{ flex: 1 }}
                                    InputProps={secret ? {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    aria-label={visible ? 'Hide value' : 'Show value'}
                                                    onClick={() => {
                                                        const next = new Set(visibleSecrets);
                                                        visible ? next.delete(row.id) : next.add(row.id);
                                                        setVisibleSecrets(next);
                                                    }}
                                                >
                                                    {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    } : undefined}
                                />
                                <IconButton
                                    aria-label={`Remove ${row.key || 'entry'}`}
                                    color="error"
                                    onClick={() => commit(rows.filter(candidate => candidate.id !== row.id))}
                                >
                                    <DeleteOutlineIcon />
                                </IconButton>
                            </Stack>
                        );
                    })}
                </Stack>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
                <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => commit([...rows, { id: nextRowId++, key: '', value: '' }])}
                >
                    Add entry
                </Button>
                {suggestedValues && Object.keys(suggestedValues).length > 0 && (
                    <Button size="small" variant="outlined" onClick={addSuggestedValues}>
                        Add common fields
                    </Button>
                )}
            </Stack>

            <AdvancedJsonEditor<StringMap>
                label={advancedLabel}
                value={mapFromRows(rows)}
                validateValue={validateStringMap}
                onChange={applyJson}
                onValidityChange={onValidityChange}
            />
        </Box>
    );
};

export const StringMapInput = ({
    source,
    label,
    helperText,
    ...editorProps
}: StringMapInputProps) => {
    const {
        field,
        fieldState: { error },
        isRequired,
    } = useInput({ source, defaultValue: {} });
    const { clearErrors, setError } = useFormContext();

    const handleValidityChange = (valid: boolean, message?: string) => {
        if (valid) clearErrors(source);
        else setError(source, { type: 'validate', message });
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {label}{isRequired ? ' *' : ''}
            </Typography>
            <KeyValueEditor
                {...editorProps}
                value={(field.value ?? {}) as StringMap}
                onChange={field.onChange}
                onValidityChange={handleValidityChange}
            />
            <FormHelperText error={Boolean(error)}>
                <InputHelperText
                    error={error?.message}
                    helperText={helperText}
                />
            </FormHelperText>
        </Box>
    );
};
