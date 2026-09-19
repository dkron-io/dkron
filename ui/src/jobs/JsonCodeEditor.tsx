import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter } from '@codemirror/lint';

interface JsonCodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    dark: boolean;
    label: string;
}

const JsonCodeEditor = ({ value, onChange, dark, label }: JsonCodeEditorProps) => {
    const extensions = useMemo(() => [json(), linter(jsonParseLinter())], []);
    return (
        <CodeMirror
            value={value}
            height="240px"
            extensions={extensions}
            onChange={onChange}
            theme={dark ? 'dark' : 'light'}
            basicSetup={{
                foldGutter: false,
                highlightActiveLine: true,
                highlightActiveLineGutter: true,
            }}
            aria-label={label}
        />
    );
};

export default JsonCodeEditor;
