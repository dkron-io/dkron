import { useEffect, useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    FormHelperText,
    IconButton,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { InputHelperText, useInput } from 'react-admin';
import { useFormContext } from 'react-hook-form';
import { AdvancedJsonEditor } from './AdvancedJsonEditor';
import { KeyValueEditor, StringMap, validateStringMap } from './StringMapInput';

type ProcessorsMap = Record<string, StringMap>;

interface ProcessorEntry {
    id: number;
    name: string;
    config: StringMap;
}

let nextProcessorId = 0;

const processorChoices = ['files', 'fluent', 'log', 'syslog'];

const processorDefaults: Record<string, StringMap> = {
    files: { forward: 'true', log_dir: '/var/log/dkron' },
    fluent: { forward: 'true' },
    log: { forward: 'true' },
    syslog: { forward: 'true' },
};

const entriesFromMap = (value?: ProcessorsMap): ProcessorEntry[] =>
    Object.entries(value ?? {}).map(([name, config]) => ({
        id: nextProcessorId++,
        name,
        config,
    }));

const mapFromEntries = (entries: ProcessorEntry[]): ProcessorsMap =>
    entries.reduce<ProcessorsMap>((result, entry) => {
        if (entry.name.trim()) result[entry.name.trim()] = entry.config;
        return result;
    }, {});

const validateProcessors = (value: unknown): string | undefined => {
    if (value === null || Array.isArray(value) || typeof value !== 'object') {
        return 'Expected an object keyed by processor name.';
    }

    for (const [name, config] of Object.entries(value)) {
        const error = validateStringMap(config);
        if (error) return `${name}: ${error}`;
    }
    return undefined;
};

export const ProcessorsInput = () => {
    const source = 'processors';
    const {
        field,
        fieldState: { error },
    } = useInput({ source, defaultValue: {} });
    const { clearErrors, setError } = useFormContext();
    const [entries, setEntries] = useState<ProcessorEntry[]>(() =>
        entriesFromMap((field.value ?? {}) as ProcessorsMap),
    );
    const lastCommitted = useRef(JSON.stringify(field.value ?? {}));
    const invalidConfigs = useRef<Set<number>>(new Set());
    const valueSignature = JSON.stringify(field.value ?? {});

    useEffect(() => {
        if (valueSignature !== lastCommitted.current) {
            setEntries(entriesFromMap((field.value ?? {}) as ProcessorsMap));
            lastCommitted.current = valueSignature;
        }
    }, [field.value, valueSignature]);

    const setFormError = (message?: string) => {
        if (message) setError(source, { type: 'validate', message });
        else clearErrors(source);
    };

    const commit = (nextEntries: ProcessorEntry[]) => {
        setEntries(nextEntries);
        const names = nextEntries.map(entry => entry.name.trim());
        if (names.some(name => !name)) {
            setFormError('Every processor must have a name.');
            return;
        }
        if (new Set(names).size !== names.length) {
            setFormError('Processor names must be unique.');
            return;
        }
        if (invalidConfigs.current.size > 0) {
            setFormError('Fix the invalid processor configuration.');
            return;
        }

        const nextValue = mapFromEntries(nextEntries);
        lastCommitted.current = JSON.stringify(nextValue);
        setFormError();
        field.onChange(nextValue);
    };

    const updateEntry = (id: number, patch: Partial<ProcessorEntry>) => {
        commit(entries.map(entry => (entry.id === id ? { ...entry, ...patch } : entry)));
    };

    const applyJson = (value: ProcessorsMap) => {
        const nextEntries = entriesFromMap(value);
        setEntries(nextEntries);
        lastCommitted.current = JSON.stringify(value);
        invalidConfigs.current.clear();
        setFormError();
        field.onChange(value);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Output processors
            </Typography>
            <Stack spacing={1.5}>
                {entries.length === 0 && (
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
                            No output processors. Execution output remains in Dkron.
                        </Typography>
                    </Box>
                )}
                {entries.map(entry => (
                    <Card key={entry.id} variant="outlined" sx={{ boxShadow: 'none' }}>
                        <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                            <Stack
                                direction="row"
                                alignItems="flex-start"
                                spacing={1}
                                sx={{ mb: 2 }}
                            >
                                <Autocomplete
                                    freeSolo
                                    options={processorChoices}
                                    inputValue={entry.name}
                                    onInputChange={(_, name) => updateEntry(entry.id, { name })}
                                    sx={{ flex: 1 }}
                                    renderInput={params => (
                                        <TextField
                                            {...params}
                                            label="Processor"
                                            size="small"
                                            helperText="Select an installed processor or enter a custom plugin name."
                                        />
                                    )}
                                />
                                <IconButton
                                    color="error"
                                    aria-label={`Remove ${entry.name || 'processor'}`}
                                    onClick={() => {
                                        invalidConfigs.current.delete(entry.id);
                                        commit(entries.filter(candidate => candidate.id !== entry.id));
                                    }}
                                >
                                    <DeleteOutlineIcon />
                                </IconButton>
                            </Stack>
                            <KeyValueEditor
                                value={entry.config}
                                onChange={config => updateEntry(entry.id, { config })}
                                onValidityChange={(valid) => {
                                    if (valid) {
                                        invalidConfigs.current.delete(entry.id);
                                    } else {
                                        invalidConfigs.current.add(entry.id);
                                        setFormError('Fix the invalid processor configuration.');
                                    }
                                }}
                                keyOptions={['forward', 'log_dir']}
                                suggestedValues={processorDefaults[entry.name]}
                                emptyText="This processor has no configuration."
                                advancedLabel="Edit processor config as JSON"
                            />
                        </CardContent>
                    </Card>
                ))}
            </Stack>
            <Button
                size="small"
                startIcon={<AddIcon />}
                sx={{ mt: 1.5 }}
                onClick={() => commit([
                    ...entries,
                    { id: nextProcessorId++, name: '', config: {} },
                ])}
            >
                Add processor
            </Button>
            <AdvancedJsonEditor<ProcessorsMap>
                label="Edit all processors as JSON"
                value={mapFromEntries(entries)}
                validateValue={validateProcessors}
                onChange={applyJson}
                onValidityChange={(valid, message) => setFormError(valid ? undefined : message)}
            />
            <FormHelperText error={Boolean(error)}>
                <InputHelperText
                    error={error?.message}
                    helperText="Processors run after an execution and can forward or persist its output."
                />
            </FormHelperText>
        </Box>
    );
};
