'use client';

import {
    Upload, Download, FileText, Code, Database, Plus, Trash2,
    ChevronDown, ChevronRight, Table, X, Minimize2, Maximize2,
    Copy, GitCompare, Trash, ArrowLeft, Check
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useTranslations } from 'next-intl';
import { useState, useRef, useEffect } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { useTheme } from './ThemeProvider';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

// ─── CSS variable shortcuts ───────────────────────────────────────────────────
const cv = {
    bgPrimary: 'var(--bg-primary)',
    bgSecondary: 'var(--bg-secondary)',
    bgTertiary: 'var(--bg-tertiary)',
    bgSurface: 'var(--bg-surface)',
    bgOverlay: 'var(--bg-overlay)',
    borderDefault: 'var(--border-default)',
    borderSubtle: 'var(--border-subtle)',
    textPrimary: 'var(--text-primary)',
    textSecondary: 'var(--text-secondary)',
    textTertiary: 'var(--text-tertiary)',
    textMuted: 'var(--text-muted)',
    accent: 'var(--accent)',
    accentHover: 'var(--accent-hover)',
    accentSubtle: 'var(--accent-subtle)',
    accentText: 'var(--accent-text)',
    success: 'var(--success)',
    successSubtle: 'var(--success-subtle)',
    error: 'var(--error)',
    errorSubtle: 'var(--error-subtle)',
    warning: 'var(--warning)',
    warningSubtle: 'var(--warning-subtle)',
};

// ─── Main JsonEditor ──────────────────────────────────────────────────────────
interface JsonEditorProps {
    onBackToHome?: () => void;
}

const JsonEditor: React.FC<JsonEditorProps> = ({ onBackToHome }) => {
    const { theme } = useTheme();
    const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs';
    const t = useTranslations('editor');

    const [jsonData, setJsonData] = useState<any>(null);
    const [arrayTableModal, setArrayTableModal] = useState<{
        isOpen: boolean; data: any[]; path: string; onChange: (newData: any[]) => void;
    } | null>(null);
    const [error, setError] = useState<string>('');
    const [isImportExpanded, setIsImportExpanded] = useState<boolean>(true);
    const [jsonText, setJsonText] = useState<string>('');
    const [isJsonMinified, setIsJsonMinified] = useState<boolean>(false);
    const [editorError, setEditorError] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'editor' | 'compare'>('editor');
    const [leftJson, setLeftJson] = useState<string>('');
    const [rightJson, setRightJson] = useState<string>('');
    const [leftJsonError, setLeftJsonError] = useState<string>('');
    const [rightJsonError, setRightJsonError] = useState<string>('');
    const [originalJsonText, setOriginalJsonText] = useState<string>('');
    const [copySuccess, setCopySuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const STORAGE_KEYS = {
        jsonData: 'json-editor-data',
        jsonText: 'json-editor-text',
        originalJsonText: 'json-editor-original',
        activeTab: 'json-editor-tab',
        leftJson: 'json-editor-left',
        rightJson: 'json-editor-right',
    };

    const saveToStorage = () => {
        try {
            localStorage.setItem(STORAGE_KEYS.jsonData, JSON.stringify(jsonData));
            localStorage.setItem(STORAGE_KEYS.jsonText, jsonText);
            localStorage.setItem(STORAGE_KEYS.originalJsonText, originalJsonText);
            localStorage.setItem(STORAGE_KEYS.activeTab, activeTab);
            localStorage.setItem(STORAGE_KEYS.leftJson, leftJson);
            localStorage.setItem(STORAGE_KEYS.rightJson, rightJson);
        } catch { /* ignore */ }
    };

    const loadFromStorage = () => {
        try {
            const savedJsonData = localStorage.getItem(STORAGE_KEYS.jsonData);
            const savedJsonText = localStorage.getItem(STORAGE_KEYS.jsonText);
            const savedOriginalJsonText = localStorage.getItem(STORAGE_KEYS.originalJsonText);
            const savedActiveTab = localStorage.getItem(STORAGE_KEYS.activeTab);
            const savedLeftJson = localStorage.getItem(STORAGE_KEYS.leftJson);
            const savedRightJson = localStorage.getItem(STORAGE_KEYS.rightJson);
            if (savedJsonData && savedJsonText) {
                setJsonData(JSON.parse(savedJsonData));
                setJsonText(savedJsonText);
                setIsImportExpanded(false);
            }
            if (savedOriginalJsonText) setOriginalJsonText(savedOriginalJsonText);
            if (savedActiveTab) setActiveTab(savedActiveTab as 'editor' | 'compare');
            if (savedLeftJson) setLeftJson(savedLeftJson);
            if (savedRightJson) setRightJson(savedRightJson);
        } catch { /* ignore */ }
    };

    const clearAllData = () => {
        setJsonData(null); setJsonText(''); setOriginalJsonText('');
        setActiveTab('editor'); setLeftJson(''); setRightJson('');
        setLeftJsonError(''); setRightJsonError('');
        setError(''); setEditorError(''); setIsImportExpanded(true);
        Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    };

    useEffect(() => { loadFromStorage(); }, []);
    useEffect(() => {
        if (jsonData || jsonText || originalJsonText || leftJson || rightJson) saveToStorage();
    }, [jsonData, jsonText, originalJsonText, activeTab, leftJson, rightJson]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);
                const formatted = JSON.stringify(parsed, null, 2);
                setJsonData(parsed); setJsonText(formatted);
                setOriginalJsonText(formatted); setError(''); setIsImportExpanded(false);
            } catch { setError(t('invalidJsonFile')); }
        };
        reader.readAsText(file);
    };

    const handleTextInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = event.target.value;
        if (!text.trim()) { setJsonData(null); setJsonText(''); setOriginalJsonText(''); setError(''); return; }
        try {
            const parsed = JSON.parse(text);
            const formatted = JSON.stringify(parsed, null, 2);
            setJsonData(parsed); setJsonText(formatted);
            setOriginalJsonText(formatted); setError(''); setIsImportExpanded(false);
        } catch { setError(t('invalidJsonFormat')); }
    };

    const updateJsonData = (newData: any) => {
        setJsonData(newData);
        setJsonText(isJsonMinified ? JSON.stringify(newData) : JSON.stringify(newData, null, 2));
    };

    const toggleJsonFormat = () => {
        if (jsonData) {
            const next = !isJsonMinified;
            setIsJsonMinified(next);
            setJsonText(next ? JSON.stringify(jsonData) : JSON.stringify(jsonData, null, 2));
        }
    };

    const copyJsonToClipboard = () => {
        navigator.clipboard.writeText(jsonText).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 1500);
        });
    };

    const formatJsonForComparison = (s: string): string => {
        try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; }
    };

    const validateComparisonJson = (value: string, setErr: (e: string) => void) => {
        if (!value.trim()) { setErr(''); return; }
        try { JSON.parse(value); setErr(''); }
        catch (e) { setErr(e instanceof Error ? e.message : 'Invalid JSON'); }
    };

    const exportToCompare = () => {
        if (originalJsonText && jsonText) {
            setLeftJson(originalJsonText); setRightJson(jsonText);
            setLeftJsonError(''); setRightJsonError(''); setActiveTab('compare');
        }
    };

    const exportAsJson = () => {
        if (!jsonData) return;
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'data.json'; a.click(); URL.revokeObjectURL(url);
    };

    const exportAsJavaScript = () => {
        if (!jsonData) return;
        navigator.clipboard.writeText(`const data = ${JSON.stringify(jsonData, null, 2)};`);
        alert(t('jsObjectCopied'));
    };

    const exportAsPhp = () => {
        if (!jsonData) return;
        const phpCode = `<?php\n$data = ${jsonToPhp(jsonData)};\n?>`;
        navigator.clipboard.writeText(phpCode);
        alert(t('phpArrayCopied'));
    };

    const exportAsText = () => {
        if (!jsonData) return;
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'data.txt'; a.click(); URL.revokeObjectURL(url);
    };

    const jsonToPhp = (obj: any, indent = 0): string => {
        const sp = '  '.repeat(indent);
        if (Array.isArray(obj)) {
            if (obj.length === 0) return 'array()';
            return `array(\n${obj.map(i => `${sp}  ${jsonToPhp(i, indent + 1)}`).join(',\n')}\n${sp})`;
        }
        if (obj && typeof obj === 'object') {
            const entries = Object.entries(obj);
            if (entries.length === 0) return 'array()';
            return `array(\n${entries.map(([k, v]) => `${sp}  '${k}' => ${jsonToPhp(v, indent + 1)}`).join(',\n')}\n${sp})`;
        }
        if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`;
        if (typeof obj === 'boolean') return obj ? 'true' : 'false';
        if (obj === null) return 'null';
        return String(obj);
    };

    // ── Shared button styles ──
    const btnGhost = `inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium
    transition-colors active:scale-[0.97]
    hover:bg-[var(--bg-overlay)]`;

    const btnOutline = `inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium
    border transition-colors active:scale-[0.97]`;

    return (
        <div className="h-screen flex flex-col" style={{ backgroundColor: cv.bgPrimary, color: cv.textPrimary }}>

            {/* ── Header ── */}
            <header
                className="flex items-center justify-between px-5 h-12 shrink-0"
                style={{ borderBottom: `1px solid ${cv.borderDefault}`, backgroundColor: cv.bgSurface }}
            >
                {/* Left: back + logo + tabs */}
                <div className="flex items-center gap-4">
                    {onBackToHome && (
                        <button
                            onClick={onBackToHome}
                            className={`${btnGhost} text-[var(--text-secondary)] hover:text-[var(--text-primary)]`}
                            title={t('backToHome')}
                        >
                            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                    )}

                    <span
                        className="font-mono text-sm font-semibold tracking-tight hidden sm:block"
                        style={{ color: cv.textPrimary }}
                    >
                        json<span style={{ color: cv.accent }}>.</span>tools
                    </span>

                    {/* Tabs */}
                    <nav className="flex items-center gap-1">
                        {(['editor', 'compare'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors"
                                style={{
                                    backgroundColor: activeTab === tab ? cv.accentSubtle : 'transparent',
                                    color: activeTab === tab ? cv.accentText : cv.textSecondary,
                                }}
                            >
                                {tab === 'editor' ? <Code className="w-3 h-3" strokeWidth={2} /> : <GitCompare className="w-3 h-3" strokeWidth={2} />}
                                {tab === 'editor' ? t('tabEditor') : t('tabCompare')}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Right: clear + language + theme */}
                <div className="flex items-center gap-2">
                    {(jsonData || leftJson || rightJson) && (
                        <button
                            onClick={() => {
                                if (confirm(t('confirmClear'))) clearAllData();
                            }}
                            className={`${btnGhost}`}
                            style={{ color: cv.error }}
                            title={t('clearData')}
                        >
                            <Trash className="w-3.5 h-3.5" strokeWidth={2} />
                            <span className="hidden sm:inline">{t('clearData')}</span>
                        </button>
                    )}
                    <LanguageSwitcher />
                    <ThemeToggle />
                </div>
            </header>
            {/* ── Main content ── */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'editor' ? (
                    <PanelGroup direction="horizontal">

                        {/* ── Left panel: Import + Export ── */}
                        <Panel defaultSize={22} minSize={18} maxSize={36}>
                            <div
                                className="h-full flex flex-col overflow-hidden"
                                style={{ borderRight: `1px solid ${cv.borderDefault}`, backgroundColor: cv.bgSurface }}
                            >
                                {/* Import */}
                                <div style={{ borderBottom: `1px solid ${cv.borderDefault}` }}>
                                    <button
                                        onClick={() => setIsImportExpanded(!isImportExpanded)}
                                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors"
                                        style={{ color: cv.textPrimary }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = cv.bgOverlay)}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        <span>{t('import')}</span>
                                        {isImportExpanded
                                            ? <ChevronDown className="w-3.5 h-3.5" style={{ color: cv.textTertiary }} strokeWidth={2} />
                                            : <ChevronRight className="w-3.5 h-3.5" style={{ color: cv.textTertiary }} strokeWidth={2} />
                                        }
                                    </button>

                                    {isImportExpanded && (
                                        <div className="px-4 pb-4 space-y-3">
                                            {/* File drop */}
                                            <div>
                                                <p className="text-xs font-medium mb-1.5" style={{ color: cv.textSecondary }}>{t('uploadFile')}</p>
                                                <div
                                                    className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors"
                                                    style={{ borderColor: cv.borderDefault }}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    onMouseEnter={e => (e.currentTarget.style.borderColor = cv.accent)}
                                                    onMouseLeave={e => (e.currentTarget.style.borderColor = cv.borderDefault)}
                                                >
                                                    <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                                                    <Upload className="mx-auto w-4 h-4 mb-1" style={{ color: cv.textMuted }} strokeWidth={1.75} />
                                                    <p className="text-xs" style={{ color: cv.accent }}>{t('clickToUpload')}</p>
                                                </div>
                                            </div>
                                            {/* Paste */}
                                            <div>
                                                <p className="text-xs font-medium mb-1.5" style={{ color: cv.textSecondary }}>{t('pasteJson')}</p>
                                                <textarea
                                                    onChange={handleTextInput}
                                                    placeholder='{"key": "value"}'
                                                    className="w-full h-28 p-2 rounded-lg text-xs font-mono resize-none outline-none transition-shadow"
                                                    style={{
                                                        backgroundColor: cv.bgSecondary,
                                                        border: `1px solid ${cv.borderDefault}`,
                                                        color: cv.textPrimary,
                                                    }}
                                                    onFocus={e => (e.currentTarget.style.boxShadow = `0 0 0 2px ${cv.accent}40`)}
                                                    onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
                                                />
                                            </div>
                                            {error && (
                                                <div className="px-2.5 py-2 rounded text-xs" style={{ backgroundColor: cv.errorSubtle, color: cv.error }}>
                                                    {error}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Export */}
                                {jsonData && (
                                    <div className="flex-1 overflow-y-auto px-4 py-3">
                                        <p className="text-xs font-medium mb-2.5" style={{ color: cv.textSecondary }}>{t('export')}</p>
                                        <div className="space-y-1.5">
                                            {[
                                                { label: t('exportJson'), icon: FileText, action: exportAsJson },
                                                { label: t('exportJs'), icon: Code, action: exportAsJavaScript },
                                                { label: t('exportPhp'), icon: Database, action: exportAsPhp },
                                                { label: t('exportText'), icon: Download, action: exportAsText },
                                            ].map(({ label, icon: Icon, action }) => (
                                                <button
                                                    key={label}
                                                    onClick={action}
                                                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded text-xs text-left transition-colors"
                                                    style={{ color: cv.textSecondary, border: `1px solid ${cv.borderDefault}` }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = cv.bgOverlay; e.currentTarget.style.color = cv.textPrimary; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = cv.textSecondary; }}
                                                >
                                                    <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Panel>

                        <PanelResizeHandle
                            className="w-[3px] transition-colors"
                            style={{ backgroundColor: cv.borderDefault }}
                        />

                        {/* ── Middle panel: Tree editor ── */}
                        <Panel defaultSize={jsonData ? 45 : 78} minSize={30}>
                            <div className="h-full flex flex-col" style={{ backgroundColor: cv.bgSurface }}>
                                <div
                                    className="flex items-center justify-between px-4 py-2.5 shrink-0"
                                    style={{ borderBottom: `1px solid ${cv.borderDefault}` }}
                                >
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: cv.textPrimary }}>{t('treeEditor')}</p>
                                        <p className="text-[11px] mt-0.5" style={{ color: cv.textTertiary }}>
                                            {t('treeEditorHint')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-hidden">
                                    {jsonData ? (
                                        <div className="h-full p-4 overflow-auto">
                                            <EnhancedTreeView
                                                data={jsonData}
                                                onChange={updateJsonData}
                                                onArrayTableRequest={(data, path, onChange) =>
                                                    setArrayTableModal({ isOpen: true, data, path, onChange })
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="text-center max-w-[200px]">
                                                <FileText className="mx-auto w-10 h-10 mb-3" style={{ color: cv.textMuted }} strokeWidth={1.25} />
                                                <p className="text-sm font-medium mb-1" style={{ color: cv.textPrimary }}>{t('noData')}</p>
                                                <p className="text-xs leading-relaxed" style={{ color: cv.textTertiary }}>
                                                    {t('noDataHint')}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Panel>

                        {jsonData && (
                            <>
                                <PanelResizeHandle
                                    className="w-[3px] transition-colors"
                                    style={{ backgroundColor: cv.borderDefault }}
                                />

                                {/* ── Right panel: Monaco editor ── */}
                                <Panel defaultSize={33} minSize={20} maxSize={50}>
                                    <div className="h-full flex flex-col" style={{ backgroundColor: cv.bgSurface }}>
                                        <div
                                            className="flex items-center justify-between px-4 py-2.5 shrink-0"
                                            style={{ borderBottom: `1px solid ${cv.borderDefault}` }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold" style={{ color: cv.textPrimary }}>{t('jsonSource')}</p>
                                                {editorError && (
                                                    <span
                                                        className="text-[10px] px-2 py-0.5 rounded font-medium"
                                                        style={{ backgroundColor: cv.errorSubtle, color: cv.error }}
                                                        title={editorError}
                                                    >
                                                        {t('invalid')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {originalJsonText && jsonText && originalJsonText !== jsonText && (
                                                    <button
                                                        onClick={exportToCompare}
                                                        className={`${btnOutline}`}
                                                        style={{ borderColor: cv.borderDefault, color: cv.warning }}
                                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = cv.warningSubtle)}
                                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                                        title="Compare original vs edited"
                                                    >
                                                        <GitCompare className="w-3 h-3" strokeWidth={2} />
                                                        {t('diff')}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={toggleJsonFormat}
                                                    className={`${btnOutline}`}
                                                    style={{ borderColor: cv.borderDefault, color: cv.textSecondary }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = cv.bgOverlay; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    title={`${isJsonMinified ? t('format') : t('minify')} JSON`}
                                                >
                                                    {isJsonMinified
                                                        ? <Maximize2 className="w-3 h-3" strokeWidth={2} />
                                                        : <Minimize2 className="w-3 h-3" strokeWidth={2} />
                                                    }
                                                    {isJsonMinified ? t('format') : t('minify')}
                                                </button>
                                                <button
                                                    onClick={copyJsonToClipboard}
                                                    className={`${btnOutline}`}
                                                    style={{
                                                        borderColor: copySuccess ? cv.success : cv.borderDefault,
                                                        color: copySuccess ? cv.success : cv.textSecondary,
                                                    }}
                                                    onMouseEnter={e => { if (!copySuccess) e.currentTarget.style.backgroundColor = cv.bgOverlay; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    title="Copy to clipboard"
                                                >
                                                    {copySuccess
                                                        ? <Check className="w-3 h-3" strokeWidth={2.5} />
                                                        : <Copy className="w-3 h-3" strokeWidth={2} />
                                                    }
                                                    {copySuccess ? t('copied') : t('copy')}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-hidden">
                                            <Editor
                                                height="100%"
                                                defaultLanguage="json"
                                                value={jsonText}
                                                theme={monacoTheme}
                                                onChange={(value) => {
                                                    const v = value || '';
                                                    setJsonText(v);
                                                    try {
                                                        setJsonData(JSON.parse(v));
                                                        setError(''); setEditorError('');
                                                    } catch (e) {
                                                        setEditorError(e instanceof Error ? e.message : 'Invalid JSON');
                                                    }
                                                }}
                                                onMount={(editor, monaco) => {
                                                    editor.addAction({
                                                        id: 'format-json', label: 'Format JSON',
                                                        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF],
                                                        run: () => {
                                                            try {
                                                                editor.setValue(JSON.stringify(JSON.parse(editor.getValue()), null, 2));
                                                                setIsJsonMinified(false);
                                                            } catch { }
                                                        }
                                                    });
                                                    editor.addAction({
                                                        id: 'minify-json', label: 'Minify JSON',
                                                        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyM],
                                                        run: () => {
                                                            try {
                                                                editor.setValue(JSON.stringify(JSON.parse(editor.getValue())));
                                                                setIsJsonMinified(true);
                                                            } catch { }
                                                        }
                                                    });
                                                    editor.addAction({
                                                        id: 'copy-json', label: 'Copy JSON',
                                                        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC],
                                                        run: () => navigator.clipboard.writeText(editor.getValue())
                                                    });
                                                    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                                                        validate: true, allowComments: false, schemas: [], enableSchemaRequest: false
                                                    });
                                                }}
                                                options={{
                                                    minimap: { enabled: false }, fontSize: 12, lineNumbers: 'on',
                                                    scrollBeyondLastLine: false, automaticLayout: true,
                                                    tabSize: 2, insertSpaces: true, wordWrap: 'on',
                                                    formatOnPaste: true, formatOnType: true, folding: true,
                                                    bracketPairColorization: { enabled: true },
                                                    renderLineHighlight: 'line',
                                                    scrollbar: { vertical: 'auto', horizontal: 'auto', verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                                                    smoothScrolling: true, cursorBlinking: 'blink',
                                                    cursorSmoothCaretAnimation: 'on',
                                                    showFoldingControls: 'always',
                                                    accessibilitySupport: 'auto',
                                                }}
                                            />
                                        </div>
                                        <div className="px-4 py-1.5 text-[10px]" style={{ color: cv.textMuted, borderTop: `1px solid ${cv.borderSubtle}` }}>
                                            {t('shortcutHint')}
                                        </div>
                                    </div>
                                </Panel>
                            </>
                        )}
                    </PanelGroup>
                ) : (
                    /* ── Compare tab ── */
                    <div className="h-full flex flex-col">
                        <div
                            className="flex items-center justify-between px-5 py-3 shrink-0"
                            style={{ borderBottom: `1px solid ${cv.borderDefault}`, backgroundColor: cv.bgSurface }}
                        >
                            <div>
                                <p className="text-sm font-semibold" style={{ color: cv.textPrimary }}>{t('jsonDiff')}</p>
                                <p className="text-xs mt-0.5" style={{ color: cv.textSecondary }}>
                                    {t('jsonDiffHint')}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { setLeftJson(formatJsonForComparison(leftJson)); setRightJson(formatJsonForComparison(rightJson)); }}
                                    className={`${btnOutline}`}
                                    style={{ borderColor: cv.borderDefault, color: cv.textSecondary }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = cv.bgOverlay)}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <Maximize2 className="w-3 h-3" strokeWidth={2} />
                                    {t('formatBoth')}
                                </button>
                                <button
                                    onClick={() => { setLeftJson(''); setRightJson(''); setLeftJsonError(''); setRightJsonError(''); }}
                                    className={`${btnOutline}`}
                                    style={{ borderColor: cv.borderDefault, color: cv.textSecondary }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = cv.bgOverlay)}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <X className="w-3 h-3" strokeWidth={2} />
                                    {t('clear')}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <PanelGroup direction="horizontal">
                                {/* Left */}
                                <Panel defaultSize={50} minSize={30}>
                                    <div className="h-full flex flex-col" style={{ borderRight: `1px solid ${cv.borderDefault}`, backgroundColor: cv.bgSurface }}>
                                        <div className="flex items-center justify-between px-4 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${cv.borderDefault}`, backgroundColor: cv.bgSecondary }}>
                                            <p className="text-xs font-medium" style={{ color: cv.textSecondary }}>{t('original')}</p>
                                            {leftJsonError && (
                                                <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: cv.errorSubtle, color: cv.error }}>
                                                    {t('invalidJson')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <Editor height="100%" defaultLanguage="json" value={leftJson} theme={monacoTheme}
                                                onChange={v => { const val = v || ''; setLeftJson(val); validateComparisonJson(val, setLeftJsonError); }}
                                                options={{ minimap: { enabled: false }, fontSize: 12, lineNumbers: 'on', automaticLayout: true, tabSize: 2, wordWrap: 'on', formatOnPaste: true, scrollbar: { verticalScrollbarSize: 6 } }}
                                            />
                                        </div>
                                    </div>
                                </Panel>

                                <PanelResizeHandle className="w-[3px]" style={{ backgroundColor: cv.borderDefault }} />

                                {/* Right */}
                                <Panel defaultSize={50} minSize={30}>
                                    <div className="h-full flex flex-col" style={{ backgroundColor: cv.bgSurface }}>
                                        <div className="flex items-center justify-between px-4 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${cv.borderDefault}`, backgroundColor: cv.bgSecondary }}>
                                            <p className="text-xs font-medium" style={{ color: cv.textSecondary }}>{t('modified')}</p>
                                            {rightJsonError && (
                                                <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: cv.errorSubtle, color: cv.error }}>
                                                    {t('invalidJson')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <Editor height="100%" defaultLanguage="json" value={rightJson} theme={monacoTheme}
                                                onChange={v => { const val = v || ''; setRightJson(val); validateComparisonJson(val, setRightJsonError); }}
                                                options={{ minimap: { enabled: false }, fontSize: 12, lineNumbers: 'on', automaticLayout: true, tabSize: 2, wordWrap: 'on', formatOnPaste: true, scrollbar: { verticalScrollbarSize: 6 } }}
                                            />
                                        </div>
                                    </div>
                                </Panel>
                            </PanelGroup>

                            {/* Show diff button */}
                            {leftJson && rightJson && !leftJsonError && !rightJsonError && (
                                <div className="absolute bottom-6 right-6 z-10">
                                    <button
                                        onClick={() => document.getElementById('diff-modal')?.classList.remove('hidden')}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-md transition-colors"
                                        style={{ backgroundColor: cv.accent }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = cv.accentHover)}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = cv.accent)}
                                    >
                                        <GitCompare className="w-4 h-4" strokeWidth={2} />
                                        {t('showDifferences')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Diff modal ── */}
            <div
                id="diff-modal"
                className="hidden fixed inset-0 flex items-center justify-center z-50 p-4"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            >
                <div
                    className="rounded-xl shadow-2xl w-full max-w-7xl overflow-hidden"
                    style={{ height: '90vh', backgroundColor: cv.bgSurface, border: `1px solid ${cv.borderDefault}` }}
                >
                    <div
                        className="flex items-center justify-between px-5 py-3"
                        style={{ borderBottom: `1px solid ${cv.borderDefault}`, backgroundColor: cv.bgSecondary }}
                    >
                        <p className="text-sm font-semibold" style={{ color: cv.textPrimary }}>{t('diffView')}</p>
                        <button
                            onClick={() => document.getElementById('diff-modal')?.classList.add('hidden')}
                            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                            style={{ color: cv.textSecondary }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = cv.bgOverlay)}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                            <X className="w-4 h-4" strokeWidth={2} />
                        </button>
                    </div>
                    <div style={{ height: 'calc(90vh - 52px)', overflowY: 'auto' }}>
                        {leftJson && rightJson && !leftJsonError && !rightJsonError && (
                            <ReactDiffViewer
                                oldValue={formatJsonForComparison(leftJson)}
                                newValue={formatJsonForComparison(rightJson)}
                                splitView={true}
                                showDiffOnly={false}
                                hideLineNumbers={false}
                                useDarkTheme={theme === 'dark'}
                                leftTitle={t('original')}
                                rightTitle={t('modified')}
                                styles={{
                                    line: { fontSize: '13px', fontFamily: 'var(--font-geist-mono), Monaco, monospace' },
                                    contentText: { fontSize: '13px', fontFamily: 'var(--font-geist-mono), Monaco, monospace' },
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* ── Array table modal ── */}
            {arrayTableModal?.isOpen && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                >
                    <div
                        className="rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden"
                        style={{ maxHeight: '90vh', backgroundColor: cv.bgSurface, border: `1px solid ${cv.borderDefault}` }}
                    >
                        <div
                            className="flex items-center justify-between px-5 py-3"
                            style={{ borderBottom: `1px solid ${cv.borderDefault}`, backgroundColor: cv.bgSecondary }}
                        >
                            <p className="text-sm font-semibold" style={{ color: cv.textPrimary }}>
                                {t('tableViewPath', { path: arrayTableModal.path || 'array' })}
                            </p>
                            <button
                                onClick={() => setArrayTableModal(null)}
                                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                                style={{ color: cv.textSecondary }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = cv.bgOverlay)}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <X className="w-4 h-4" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="p-5 overflow-auto" style={{ maxHeight: 'calc(90vh - 108px)' }}>
                            <TableView
                                data={arrayTableModal.data}
                                onChange={(newData) => {
                                    arrayTableModal.onChange(newData);
                                    setArrayTableModal({ ...arrayTableModal, data: newData });
                                }}
                            />
                        </div>
                        <div
                            className="flex justify-end gap-2 px-5 py-3"
                            style={{ borderTop: `1px solid ${cv.borderDefault}` }}
                        >
                            <button
                                onClick={() => setArrayTableModal(null)}
                                className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                style={{ backgroundColor: cv.bgSecondary, color: cv.textSecondary, border: `1px solid ${cv.borderDefault}` }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = cv.bgTertiary)}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = cv.bgSecondary)}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={() => setArrayTableModal(null)}
                                className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
                                style={{ backgroundColor: cv.accent }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = cv.accentHover)}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = cv.accent)}
                            >
                                {t('done')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── EnhancedTreeView ─────────────────────────────────────────────────────────
const EnhancedTreeView: React.FC<{
    data: any;
    onChange: (data: any) => void;
    onArrayTableRequest: (data: any[], path: string, onChange: (newData: any[]) => void) => void;
    path?: string;
}> = ({ data, onChange, onArrayTableRequest }) => {
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
    const t = useTranslations('editor');

    const toggleExpanded = (key: string) => {
        const next = new Set(expandedKeys);
        if (next.has(key)) { next.delete(key); } else { next.add(key); }
        setExpandedKeys(next);
    };

    const updateValue = (key: string | number, newValue: any) => {
        if (Array.isArray(data)) {
            const arr = [...data]; arr[key as number] = newValue; onChange(arr);
        } else {
            onChange({ ...data, [key]: newValue });
        }
    };

    const renderValue = (value: any, key: string | number, currentPath: string): JSX.Element => {
        const fullPath = currentPath ? `${currentPath}.${key}` : String(key);

        if (Array.isArray(value)) {
            const isExpanded = expandedKeys.has(fullPath);
            return (
                <div>
                    <div className="flex items-center gap-2 py-0.5">
                        <button
                            onClick={() => toggleExpanded(fullPath)}
                            className="flex items-center gap-1 transition-colors"
                            style={{ color: cv.accent }}
                        >
                            {isExpanded ? <ChevronDown className="w-3 h-3" strokeWidth={2} /> : <ChevronRight className="w-3 h-3" strokeWidth={2} />}
                            <span className="font-mono text-xs">[{value.length}]</span>
                        </button>
                        <button
                            onClick={() => onArrayTableRequest(value, fullPath, (newData) => updateValue(key, newData))}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors"
                            style={{ backgroundColor: cv.accentSubtle, color: cv.accentText }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                            title={t('tableView')}
                        >
                            <Table className="w-2.5 h-2.5" strokeWidth={2} />
                            {t('table')}
                        </button>
                    </div>
                    {isExpanded && (
                        <div className="ml-4 pl-3" style={{ borderLeft: `1px solid ${cv.borderDefault}` }}>
                            {value.map((item, index) => (
                                <div key={index} className="py-0.5 flex items-start gap-2">
                                    <span className="font-mono text-xs mt-0.5 select-none" style={{ color: cv.textMuted, minWidth: '28px' }}>[{index}]</span>
                                    <div className="flex-1">{renderValue(item, index, `${fullPath}[${index}]`)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        if (value && typeof value === 'object') {
            const isExpanded = expandedKeys.has(fullPath);
            const keys = Object.keys(value);
            return (
                <div>
                    <button
                        onClick={() => toggleExpanded(fullPath)}
                        className="flex items-center gap-1 py-0.5 transition-colors"
                        style={{ color: cv.accent }}
                    >
                        {isExpanded ? <ChevronDown className="w-3 h-3" strokeWidth={2} /> : <ChevronRight className="w-3 h-3" strokeWidth={2} />}
                        <span className="font-mono text-xs">{`{${keys.length}}`}</span>
                    </button>
                    {isExpanded && (
                        <div className="ml-4 pl-3" style={{ borderLeft: `1px solid ${cv.borderDefault}` }}>
                            {keys.map((objKey) => (
                                <div key={objKey} className="py-0.5 flex items-start gap-2">
                                    <span className="font-mono text-xs font-medium mt-0.5" style={{ color: cv.textSecondary, minWidth: '80px', flexShrink: 0 }}>
                                        {objKey}
                                    </span>
                                    <div className="flex-1">{renderValue(value[objKey], objKey, fullPath)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return <EditableSimpleValue value={value} onChange={(v) => updateValue(key, v)} />;
    };

    if (Array.isArray(data)) {
        return (
            <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs" style={{ color: cv.textSecondary }}>{t('array', { count: data.length })}</span>
                    <button
                        onClick={() => onArrayTableRequest(data, 'root', onChange)}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors"
                        style={{ backgroundColor: cv.accentSubtle, color: cv.accentText }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                        <Table className="w-2.5 h-2.5" strokeWidth={2} />
                        {t('tableViewBtn')}
                    </button>
                </div>
                {data.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 py-0.5">
                        <span className="font-mono text-xs mt-0.5" style={{ color: cv.textMuted, minWidth: '28px' }}>[{index}]</span>
                        <div className="flex-1">{renderValue(item, index, '')}</div>
                    </div>
                ))}
            </div>
        );
    }

    if (data && typeof data === 'object') {
        return (
            <div className="space-y-0.5">
                {Object.keys(data).map((key) => (
                    <div key={key} className="flex items-start gap-2 py-0.5">
                        <span className="font-mono text-xs font-medium mt-0.5" style={{ color: cv.textSecondary, minWidth: '80px', flexShrink: 0 }}>
                            {key}
                        </span>
                        <div className="flex-1">{renderValue(data[key], key, '')}</div>
                    </div>
                ))}
            </div>
        );
    }

    return <span className="text-xs" style={{ color: cv.textTertiary }}>{t('simpleValue', { value: 'invalid' })}</span>;
};

// ─── EditableSimpleValue ──────────────────────────────────────────────────────
const EditableSimpleValue: React.FC<{ value: any; onChange: (value: any) => void }> = ({ value, onChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const t = useTranslations('editor');

    if (isEditing) {
        return (
            <input
                type="text"
                defaultValue={String(value ?? '')}
                autoFocus
                onBlur={(e) => {
                    let v: any = e.target.value;
                    if (v === 'null') v = null;
                    else if (v === 'true') v = true;
                    else if (v === 'false') v = false;
                    else if (!isNaN(Number(v)) && v.trim() !== '' && typeof value === 'number') v = Number(v);
                    onChange(v);
                    setIsEditing(false);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                    if (e.key === 'Escape') setIsEditing(false);
                }}
                className="px-2 py-0.5 rounded text-xs font-mono outline-none"
                style={{ border: `1px solid ${cv.accent}`, backgroundColor: cv.bgSecondary, color: cv.textPrimary, minWidth: '80px' }}
            />
        );
    }

    const color =
        typeof value === 'string' ? 'var(--success)' :
            typeof value === 'number' ? cv.accent :
                typeof value === 'boolean' ? '#a855f7' :
                    value === null ? cv.textMuted :
                        cv.textPrimary;

    return (
        <span
            onClick={() => setIsEditing(true)}
            className="cursor-pointer px-1.5 py-0.5 rounded text-xs font-mono transition-colors"
            style={{ color }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = cv.bgOverlay)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            title={t('clickToEdit')}
        >
            {value === null ? 'null' : typeof value === 'string' ? `"${value}"` : String(value)}
        </span>
    );
};

// ─── TableView ────────────────────────────────────────────────────────────────
const TableView: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const t = useTranslations('editor');

    const toggleSection = (path: string) => {
        const next = new Set(expandedSections);
        if (next.has(path)) { next.delete(path); } else { next.add(path); }
        setExpandedSections(next);
    };

    const isTableFriendlyArray = (arr: any[]): boolean => {
        if (!Array.isArray(arr) || arr.length === 0) return false;
        const first = arr[0];
        if (typeof first !== 'object' || first === null) return false;
        const firstKeys = Object.keys(first).sort().join(',');
        return arr.every(item => typeof item === 'object' && item !== null && Object.keys(item).sort().join(',') === firstKeys);
    };

    const thStyle = {
        backgroundColor: cv.bgSecondary,
        color: cv.textTertiary,
        borderColor: cv.borderDefault,
        fontSize: '10px',
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        padding: '6px 12px',
        textAlign: 'left' as const,
        border: `1px solid ${cv.borderDefault}`,
    };

    const tdStyle = {
        borderColor: cv.borderDefault,
        padding: '4px 8px',
        border: `1px solid ${cv.borderDefault}`,
        backgroundColor: cv.bgSurface,
    };

    const typeBadge = (type: string) => {
        const map: Record<string, { bg: string; color: string }> = {
            string: { bg: 'var(--success-subtle)', color: 'var(--success)' },
            number: { bg: 'var(--accent-subtle)', color: 'var(--accent-text)' },
            boolean: { bg: '#2d1f47', color: '#a855f7' },
            array: { bg: 'var(--warning-subtle)', color: 'var(--warning)' },
            object: { bg: cv.bgTertiary, color: cv.textSecondary },
        };
        const s = map[type] ?? { bg: cv.bgTertiary, color: cv.textSecondary };
        return (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: s.bg, color: s.color }}>
                {type}
            </span>
        );
    };

    const renderArrayTable = (arr: any[], path = '') => {
        if (!isTableFriendlyArray(arr)) return renderGenericTable(arr, path);
        const columns = Object.keys(arr[0]);

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-medium" style={{ color: cv.textSecondary }}>{t('rows', { count: arr.length })}</p>
                    <button
                        onClick={() => onChange([...arr, columns.reduce((o, c) => ({ ...o, [c]: '' }), {})])}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium text-white transition-colors"
                        style={{ backgroundColor: cv.accent }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = cv.accentHover)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = cv.accent)}
                    >
                        <Plus className="w-3 h-3" strokeWidth={2} />
                        {t('addRow')}
                    </button>
                </div>
                <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${cv.borderDefault}` }}>
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr>
                                <th style={thStyle}>#</th>
                                {columns.map(col => <th key={col} style={thStyle}>{col}</th>)}
                                <th style={thStyle}>·</th>
                            </tr>
                        </thead>
                        <tbody>
                            {arr.map((row, i) => (
                                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? cv.bgSurface : cv.bgSecondary }}>
                                    <td style={{ ...tdStyle, color: cv.textMuted, fontFamily: 'monospace', fontSize: '11px' }}>{i}</td>
                                    {columns.map(col => (
                                        <td key={col} style={tdStyle}>
                                            <EditableCell value={row[col]} onChange={v => { const a = [...arr]; a[i] = { ...a[i], [col]: v }; onChange(a); }} />
                                        </td>
                                    ))}
                                    <td style={tdStyle}>
                                        <button
                                            onClick={() => onChange(arr.filter((_, idx) => idx !== i))}
                                            className="transition-opacity opacity-40 hover:opacity-100"
                                            style={{ color: cv.error }}
                                            title={t('deleteRow')}
                                        >
                                            <Trash2 className="w-3 h-3" strokeWidth={2} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderObjectTable = (obj: any, path = '') => {
        const entries = Object.entries(obj);
        return (
            <div className="space-y-3">
                <p className="text-xs font-medium" style={{ color: cv.textSecondary }}>{t('properties', { count: entries.length })}</p>
                <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${cv.borderDefault}` }}>
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, width: '30%' }}>Key</th>
                                <th style={{ ...thStyle, width: '80px' }}>Type</th>
                                <th style={thStyle}>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(([key, value], i) => {
                                const vType = Array.isArray(value) ? 'array' : typeof value;
                                const isComplex = typeof value === 'object' && value !== null;
                                const sp = `${path}.${key}`;
                                return (
                                    <tr key={key} style={{ backgroundColor: i % 2 === 0 ? cv.bgSurface : cv.bgSecondary }}>
                                        <td style={{ ...tdStyle, color: cv.textPrimary, fontWeight: 500, fontSize: '12px' }}>{key}</td>
                                        <td style={tdStyle}>{typeBadge(vType)}</td>
                                        <td style={tdStyle}>
                                            {isComplex ? (
                                                <div>
                                                    <button
                                                        onClick={() => toggleSection(sp)}
                                                        className="flex items-center gap-1 text-xs transition-colors"
                                                        style={{ color: cv.accent }}
                                                    >
                                                        {expandedSections.has(sp) ? <ChevronDown className="w-3 h-3" strokeWidth={2} /> : <ChevronRight className="w-3 h-3" strokeWidth={2} />}
                                                        {Array.isArray(value) ? `Array (${value.length})` : 'Object'}
                                                    </button>
                                                    {expandedSections.has(sp) && (
                                                        <div className="mt-2 pl-3" style={{ borderLeft: `2px solid ${cv.borderDefault}` }}>
                                                            <TableView data={value} onChange={v => onChange({ ...obj, [key]: v })} />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <EditableCell value={value} onChange={v => onChange({ ...obj, [key]: v })} />
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderGenericTable = (arr: any[], path = '') => {
        return (
            <div className="space-y-3">
                <p className="text-xs font-medium" style={{ color: cv.textSecondary }}>{t('items', { count: arr.length })}</p>
                <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${cv.borderDefault}` }}>
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, width: '60px' }}>Index</th>
                                <th style={{ ...thStyle, width: '80px' }}>Type</th>
                                <th style={thStyle}>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {arr.map((item, i) => {
                                const iType = Array.isArray(item) ? 'array' : typeof item;
                                const isComplex = typeof item === 'object' && item !== null;
                                const sp = `${path}[${i}]`;
                                return (
                                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? cv.bgSurface : cv.bgSecondary }}>
                                        <td style={{ ...tdStyle, color: cv.textMuted, fontFamily: 'monospace', fontSize: '11px' }}>[{i}]</td>
                                        <td style={tdStyle}>{typeBadge(iType)}</td>
                                        <td style={tdStyle}>
                                            {isComplex ? (
                                                <div>
                                                    <button
                                                        onClick={() => toggleSection(sp)}
                                                        className="flex items-center gap-1 text-xs"
                                                        style={{ color: cv.accent }}
                                                    >
                                                        {expandedSections.has(sp) ? <ChevronDown className="w-3 h-3" strokeWidth={2} /> : <ChevronRight className="w-3 h-3" strokeWidth={2} />}
                                                        {Array.isArray(item) ? `Array (${item.length})` : 'Object'}
                                                    </button>
                                                    {expandedSections.has(sp) && (
                                                        <div className="mt-2 pl-3" style={{ borderLeft: `2px solid ${cv.borderDefault}` }}>
                                                            <TableView data={item} onChange={v => { const a = [...arr]; a[i] = v; onChange(a); }} />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <EditableCell value={item} onChange={v => { const a = [...arr]; a[i] = v; onChange(a); }} />
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    if (Array.isArray(data)) return renderArrayTable(data);
    if (data && typeof data === 'object') return renderObjectTable(data);
    return <p className="text-xs" style={{ color: cv.textTertiary }}>{t('simpleValue', { value: String(data) })}</p>;
};

// ─── EditableCell ─────────────────────────────────────────────────────────────
const EditableCell: React.FC<{ value: any; onChange: (value: any) => void }> = ({ value, onChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const t = useTranslations('editor');

    const createSummary = (obj: any): string => {
        if (Array.isArray(obj)) return `[${obj.length} items]`;
        const keys = Object.keys(obj);
        if (keys.length === 0) return '{}';
        if (keys.length <= 2) return `{${keys.map(k => `${k}: ${formatVal(obj[k])}`).join(', ')}}`;
        return `{${keys.length} keys}`;
    };

    const formatVal = (v: any): string => {
        if (v === null) return 'null';
        if (typeof v === 'object') return Array.isArray(v) ? `[${v.length}]` : '{...}';
        if (typeof v === 'string') return `"${v.length > 15 ? v.slice(0, 15) + '…' : v}"`;
        return String(v);
    };

    const handleSave = (raw: string) => {
        let v: any = raw;
        if (raw === 'null') v = null;
        else if (raw === 'true') v = true;
        else if (raw === 'false') v = false;
        else if (!isNaN(Number(raw)) && raw.trim() !== '' && typeof value === 'number') v = Number(raw);
        else if (raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
            try { v = JSON.parse(raw); } catch { v = raw; }
        }
        onChange(v);
        setIsEditing(false);
    };

    if (typeof value !== 'object' || value === null) {
        if (isEditing) {
            return (
                <input
                    type="text"
                    defaultValue={String(value ?? '')}
                    autoFocus
                    onBlur={e => handleSave(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(e.currentTarget.value); if (e.key === 'Escape') setIsEditing(false); }}
                    className="w-full px-1.5 py-0.5 rounded text-xs font-mono outline-none"
                    style={{ border: `1px solid ${cv.accent}`, backgroundColor: cv.bgSecondary, color: cv.textPrimary }}
                />
            );
        }
        const color =
            typeof value === 'string' ? 'var(--success)' :
                typeof value === 'number' ? cv.accent :
                    typeof value === 'boolean' ? '#a855f7' :
                        value === null ? cv.textMuted : cv.textPrimary;
        return (
            <span
                onClick={() => setIsEditing(true)}
                className="cursor-pointer px-1 py-0.5 rounded text-xs font-mono transition-colors"
                style={{ color }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = cv.bgOverlay)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                title={t('clickToEdit')}
            >
                {value === null ? 'null' : String(value)}
            </span>
        );
    }

    const objKeys = Object.keys(value);
    return (
        <div>
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 text-xs"
                    style={{ color: cv.accent }}
                >
                    {isExpanded ? <ChevronDown className="w-3 h-3" strokeWidth={2} /> : <ChevronRight className="w-3 h-3" strokeWidth={2} />}
                    <span className="font-mono text-[10px]">{createSummary(value)}</span>
                </button>
                {!Array.isArray(value) && objKeys.length <= 3 && (
                    <button onClick={() => setIsEditing(true)} className="text-[10px]" style={{ color: cv.textTertiary }}>{t('editCell')}</button>
                )}
            </div>
            {isExpanded && (
                <div className="mt-1.5 pl-3 space-y-0.5" style={{ borderLeft: `1px solid ${cv.borderDefault}` }}>
                    {Array.isArray(value)
                        ? value.map((item, i) => (
                            <div key={i} className="flex gap-2 text-[11px]">
                                <span style={{ color: cv.textMuted, fontFamily: 'monospace' }}>[{i}]</span>
                                <span style={{ color: cv.textSecondary, fontFamily: 'monospace' }}>{formatVal(item)}</span>
                            </div>
                        ))
                        : objKeys.map(k => (
                            <div key={k} className="flex gap-2 text-[11px]">
                                <span style={{ color: cv.textSecondary, minWidth: '60px', flexShrink: 0 }}>{k}:</span>
                                <span style={{ color: cv.textSecondary, fontFamily: 'monospace' }}>{formatVal(value[k])}</span>
                            </div>
                        ))
                    }
                </div>
            )}
            {isEditing && !Array.isArray(value) && objKeys.length <= 3 && (
                <div className="mt-1.5">
                    <textarea
                        defaultValue={JSON.stringify(value, null, 2)}
                        autoFocus
                        rows={4}
                        onBlur={e => handleSave(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSave(e.currentTarget.value); if (e.key === 'Escape') setIsEditing(false); }}
                        className="w-full px-2 py-1 rounded text-xs font-mono resize-none outline-none"
                        style={{ border: `1px solid ${cv.accent}`, backgroundColor: cv.bgSecondary, color: cv.textPrimary }}
                        placeholder="Edit as JSON... Ctrl+Enter to save"
                    />
                </div>
            )}
        </div>
    );
};

export default JsonEditor;