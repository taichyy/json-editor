'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Download, FileText, Code, Database, Plus, Trash2, ChevronDown, ChevronRight, Table, X, Minimize2, Maximize2, Copy, GitCompare, Trash } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import ReactDiffViewer from 'react-diff-viewer-continued';

const JsonEditor: React.FC = () => {
  const [jsonData, setJsonData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [arrayTableModal, setArrayTableModal] = useState<{ isOpen: boolean; data: any[]; path: string; onChange: (newData: any[]) => void } | null>(null);
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // localStorage keys
  const STORAGE_KEYS = {
    jsonData: 'json-editor-data',
    jsonText: 'json-editor-text',
    originalJsonText: 'json-editor-original',
    activeTab: 'json-editor-tab',
    leftJson: 'json-editor-left',
    rightJson: 'json-editor-right',
  };

  // Save to localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.jsonData, JSON.stringify(jsonData));
      localStorage.setItem(STORAGE_KEYS.jsonText, jsonText);
      localStorage.setItem(STORAGE_KEYS.originalJsonText, originalJsonText);
      localStorage.setItem(STORAGE_KEYS.activeTab, activeTab);
      localStorage.setItem(STORAGE_KEYS.leftJson, leftJson);
      localStorage.setItem(STORAGE_KEYS.rightJson, rightJson);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  };

  // Load from localStorage
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
        setIsImportExpanded(false); // Collapse import section if data exists
      }
      if (savedOriginalJsonText) {
        setOriginalJsonText(savedOriginalJsonText);
      }
      if (savedActiveTab) {
        setActiveTab(savedActiveTab as 'editor' | 'compare');
      }
      if (savedLeftJson) {
        setLeftJson(savedLeftJson);
      }
      if (savedRightJson) {
        setRightJson(savedRightJson);
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  };

  // Clear all data
  const clearAllData = () => {
    // Clear state
    setJsonData(null);
    setJsonText('');
    setOriginalJsonText('');
    setActiveTab('editor');
    setLeftJson('');
    setRightJson('');
    setLeftJsonError('');
    setRightJsonError('');
    setError('');
    setEditorError('');
    setIsImportExpanded(true);

    // Clear localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  };

  // Load data on component mount
  useEffect(() => {
    loadFromStorage();
  }, []);

  // Save data whenever relevant state changes
  useEffect(() => {
    if (jsonData || jsonText || originalJsonText || leftJson || rightJson) {
      saveToStorage();
    }
  }, [jsonData, jsonText, originalJsonText, activeTab, leftJson, rightJson]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        const formattedJson = JSON.stringify(parsed, null, 2);
        setJsonData(parsed);
        setJsonText(formattedJson);
        setOriginalJsonText(formattedJson); // Store original
        setError('');
        setIsImportExpanded(false); // Collapse after import
      } catch (err) {
        setError('Invalid JSON file. Please check your file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleTextInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    if (!text.trim()) {
      setJsonData(null);
      setJsonText('');
      setOriginalJsonText('');
      setError('');
      return;
    }

    try {
      const parsed = JSON.parse(text);
      const formattedJson = JSON.stringify(parsed, null, 2);
      setJsonData(parsed);
      setJsonText(formattedJson);
      setOriginalJsonText(formattedJson); // Store original
      setError('');
      setIsImportExpanded(false); // Collapse after import
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  // Update JSON text when data changes
  const updateJsonData = (newData: any) => {
    setJsonData(newData);
    setJsonText(isJsonMinified ? JSON.stringify(newData) : JSON.stringify(newData, null, 2));
  };

  // Format/Minify JSON
  const toggleJsonFormat = () => {
    if (jsonData) {
      const newMinified = !isJsonMinified;
      setIsJsonMinified(newMinified);
      setJsonText(newMinified ? JSON.stringify(jsonData) : JSON.stringify(jsonData, null, 2));
    }
  };

  // Copy JSON to clipboard
  const copyJsonToClipboard = () => {
    navigator.clipboard.writeText(jsonText);
    // You could add a toast notification here
  };

  // Format JSON for comparison
  const formatJsonForComparison = (jsonString: string): string => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  // Validate JSON for comparison
  const validateComparisonJson = (value: string, setError: (error: string) => void): boolean => {
    if (!value.trim()) {
      setError('');
      return true;
    }
    try {
      JSON.parse(value);
      setError('');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
      return false;
    }
  };

  // Export original and edited JSON to compare tab
  const exportToCompare = () => {
    if (originalJsonText && jsonText) {
      setLeftJson(originalJsonText);
      setRightJson(jsonText);
      setLeftJsonError('');
      setRightJsonError('');
      setActiveTab('compare');

      // Show a brief success message
      // const button = document.activeElement as HTMLButtonElement;
      // if (button) {
      //   const originalText = button.textContent;
      //   button.textContent = '✓ Exported!';
      //   button.style.backgroundColor = '#10b981';
      //   button.style.color = 'white';
      //   setTimeout(() => {
      //     button.textContent = originalText;
      //     button.style.backgroundColor = '';
      //     button.style.color = '';
      //   }, 1500);
      // }
    }
  };

  const exportAsJson = () => {
    if (!jsonData) return;
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJavaScript = () => {
    if (!jsonData) return;
    const jsCode = `const data = ${JSON.stringify(jsonData, null, 2)};`;
    navigator.clipboard.writeText(jsCode);
    alert('JavaScript object copied to clipboard!');
  };

  const exportAsPhp = () => {
    if (!jsonData) return;
    const phpCode = `<?php\n$data = ${jsonToPhp(jsonData)};\n?>`;
    navigator.clipboard.writeText(phpCode);
    alert('PHP array copied to clipboard!');
  };

  const exportAsText = () => {
    if (!jsonData) return;
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const jsonToPhp = (obj: any, indent = 0): string => {
    const spaces = '  '.repeat(indent);

    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'array()';
      const items = obj.map(item => `${spaces}  ${jsonToPhp(item, indent + 1)}`).join(',\n');
      return `array(\n${items}\n${spaces})`;
    }

    if (obj && typeof obj === 'object') {
      const entries = Object.entries(obj);
      if (entries.length === 0) return 'array()';
      const items = entries.map(([key, value]) =>
        `${spaces}  '${key}' => ${jsonToPhp(value, indent + 1)}`
      ).join(',\n');
      return `array(\n${items}\n${spaces})`;
    }

    if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`;
    if (typeof obj === 'boolean') return obj ? 'true' : 'false';
    if (obj === null) return 'null';
    return String(obj);
  };

  return (
    <div className="h-screen bg-gray-100">
      {/* Header with Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-3 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">JSON Editor</h1>
            {(jsonData || leftJson || rightJson) && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                    clearAllData();
                  }
                }}
                className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                title="Clear all data and start fresh"
              >
                <Trash className="h-3 w-3" />
                Clear All
              </button>
            )}
          </div>
        </div>
        <div className="px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('editor')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'editor'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                JSON Editor
              </div>
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'compare'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-2">
                <GitCompare className="h-4 w-4" />
                JSON Compare
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-120px)]">
        {activeTab === 'editor' ? (
          <PanelGroup direction="horizontal">
            {/* Left Panel - Import & Export */}
            <Panel defaultSize={25} minSize={20} maxSize={40}>
              <div className="h-full bg-white shadow-lg flex flex-col">
                {/* Import Section */}
                <div className="border-b">
                  <button
                    onClick={() => setIsImportExpanded(!isImportExpanded)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <h2 className="text-lg font-semibold text-gray-900">Import JSON</h2>
                    {isImportExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    )}
                  </button>

                  {isImportExpanded && (
                    <div className="p-4 pt-0 space-y-4">
                      {/* File Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload File
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 transition-colors cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <Upload className="mx-auto h-5 w-5 text-gray-400 mb-1" />
                          <p className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                            Click to upload JSON file
                          </p>
                        </div>
                      </div>

                      {/* Text Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paste JSON
                        </label>
                        <textarea
                          onChange={handleTextInput}
                          placeholder="Paste your JSON data here..."
                          className="w-full h-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs font-mono"
                        />
                      </div>

                      {error && (
                        <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
                          {error}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Export Section */}
                {jsonData && (
                  <div className="flex-1 p-4">
                    <h2 className="text-lg font-semibold mb-3 text-gray-900">Export Data</h2>
                    <div className="space-y-2">
                      <button
                        onClick={exportAsJson}
                        className="w-full flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <FileText className="h-3 w-3 text-gray-600" />
                        <span className="text-xs font-medium">JSON File</span>
                      </button>

                      <button
                        onClick={exportAsJavaScript}
                        className="w-full flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <Code className="h-3 w-3 text-gray-600" />
                        <span className="text-xs font-medium">JavaScript Object</span>
                      </button>

                      <button
                        onClick={exportAsPhp}
                        className="w-full flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <Database className="h-3 w-3 text-gray-600" />
                        <span className="text-xs font-medium">PHP Array</span>
                      </button>

                      <button
                        onClick={exportAsText}
                        className="w-full flex items-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <Download className="h-3 w-3 text-gray-600" />
                        <span className="text-xs font-medium">Text File</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Panel>

            <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />

            {/* Middle Panel - JSON Editor */}
            <Panel defaultSize={jsonData ? 50 : 75} minSize={30}>
              <div className="h-full bg-white flex flex-col">
                <div className="border-b px-4 py-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Tree Editor</h2>
                    <p className="text-xs text-gray-600">Interactive tree view with contextual table views for arrays</p>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  {jsonData ? (
                    <div className="h-full p-4">
                      <div className="h-full overflow-auto">
                        <EnhancedTreeView
                          data={jsonData}
                          onChange={updateJsonData}
                          onArrayTableRequest={(data, path, onChange) => {
                            setArrayTableModal({ isOpen: true, data, path, onChange });
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto h-16 w-16 text-gray-300 mb-3">
                          <FileText className="h-full w-full" />
                        </div>
                        <h3 className="text-base font-medium text-gray-900 mb-1">No JSON Data</h3>
                        <p className="text-sm text-gray-500">Upload a file or paste JSON data to get started</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Panel>

            {jsonData && (
              <>
                <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />

                {/* Right Panel - JSON Preview */}
                <Panel defaultSize={25} minSize={20} maxSize={40}>
                  <div className="h-full bg-white flex flex-col">
                    <div className="border-b px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold text-gray-900">JSON Editor</h2>
                          {editorError && (
                            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded" title={editorError}>
                              Invalid JSON
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {originalJsonText && jsonText && originalJsonText !== jsonText && (
                            <button
                              onClick={exportToCompare}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                              title="Compare original vs edited JSON"
                            >
                              <GitCompare className="h-3 w-3" />
                              Compare
                            </button>
                          )}
                          <button
                            onClick={toggleJsonFormat}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            title={`${isJsonMinified ? "Format" : "Minify"} JSON (Ctrl+${isJsonMinified ? "F" : "Shift+M"})`}
                          >
                            {isJsonMinified ? (
                              <Maximize2 className="h-3 w-3" />
                            ) : (
                              <Minimize2 className="h-3 w-3" />
                            )}
                            {isJsonMinified ? "Format" : "Minify"}
                          </button>
                          <button
                            onClick={copyJsonToClipboard}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            title="Copy to clipboard (Ctrl+Shift+C)"
                          >
                            <Copy className="h-3 w-3" />
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Ctrl+F: Format • Ctrl+Shift+M: Minify • Ctrl+Shift+C: Copy • Tab: Indent
                      </div>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <Editor
                        height="100%"
                        defaultLanguage="json"
                        value={jsonText}
                        onChange={(value) => {
                          const newValue = value || '';
                          setJsonText(newValue);
                          try {
                            const parsed = JSON.parse(newValue);
                            setJsonData(parsed);
                            setError('');
                            setEditorError('');
                          } catch (err) {
                            setEditorError(err instanceof Error ? err.message : 'Invalid JSON');
                            // Don't update jsonData if invalid JSON
                          }
                        }}
                        onMount={(editor, monaco) => {
                          // Add custom keyboard shortcuts
                          editor.addAction({
                            id: 'format-json',
                            label: 'Format JSON',
                            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF],
                            run: () => {
                              try {
                                const value = editor.getValue();
                                const parsed = JSON.parse(value);
                                const formatted = JSON.stringify(parsed, null, 2);
                                editor.setValue(formatted);
                                setIsJsonMinified(false);
                              } catch (err) {
                                // Invalid JSON, can't format
                              }
                            }
                          });

                          editor.addAction({
                            id: 'minify-json',
                            label: 'Minify JSON',
                            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyM],
                            run: () => {
                              try {
                                const value = editor.getValue();
                                const parsed = JSON.parse(value);
                                const minified = JSON.stringify(parsed);
                                editor.setValue(minified);
                                setIsJsonMinified(true);
                              } catch (err) {
                                // Invalid JSON, can't minify
                              }
                            }
                          });

                          editor.addAction({
                            id: 'copy-json',
                            label: 'Copy JSON',
                            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC],
                            run: () => {
                              const value = editor.getValue();
                              navigator.clipboard.writeText(value);
                            }
                          });

                          // Enable JSON validation
                          monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                            validate: true,
                            allowComments: false,
                            schemas: [],
                            enableSchemaRequest: false
                          });
                        }}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 12,
                          lineNumbers: 'on',
                          roundedSelection: false,
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          insertSpaces: true,
                          wordWrap: 'on',
                          formatOnPaste: true,
                          formatOnType: true,
                          folding: true,
                          bracketPairColorization: { enabled: true },
                          suggest: {
                            showKeywords: true,
                            showSnippets: true,
                            showFunctions: false,
                          },
                          quickSuggestions: {
                            other: true,
                            comments: false,
                            strings: true
                          },
                          parameterHints: { enabled: false },
                          hover: { enabled: true },
                          contextmenu: true,
                          selectOnLineNumbers: true,
                          glyphMargin: true,
                          lineDecorationsWidth: 10,
                          lineNumbersMinChars: 3,
                          renderLineHighlight: 'line',
                          scrollbar: {
                            vertical: 'auto',
                            horizontal: 'auto',
                            verticalScrollbarSize: 8,
                            horizontalScrollbarSize: 8,
                          },
                          find: {
                            addExtraSpaceOnTop: false,
                            autoFindInSelection: 'never',
                            seedSearchStringFromSelection: 'always'
                          },
                          matchBrackets: 'always',
                          renderWhitespace: 'selection',
                          showFoldingControls: 'always',
                          smoothScrolling: true,
                          cursorBlinking: 'blink',
                          cursorSmoothCaretAnimation: 'on',
                          multiCursorModifier: 'ctrlCmd',
                          accessibilitySupport: 'auto',
                        }}
                        theme="vs"
                      />
                    </div>
                  </div>
                </Panel>
              </>
            )}
          </PanelGroup>
        ) : (
          /* JSON Comparison View */
          <div className="h-full flex flex-col">
            {/* Comparison Header */}
            <div className="bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">JSON Comparison</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setLeftJson(formatJsonForComparison(leftJson));
                      setRightJson(formatJsonForComparison(rightJson));
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    <Maximize2 className="h-3 w-3" />
                    Format Both
                  </button>
                  <button
                    onClick={() => {
                      setLeftJson('');
                      setRightJson('');
                      setLeftJsonError('');
                      setRightJsonError('');
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Clear All
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Paste JSON in both editors to see differences highlighted
              </p>
            </div>

            {/* Comparison Content */}
            <div className="flex-1 overflow-hidden">
              <PanelGroup direction="horizontal">
                {/* Left JSON Editor */}
                <Panel defaultSize={50} minSize={30}>
                  <div className="h-full bg-white flex flex-col border-r">
                    <div className="border-b px-4 py-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Original JSON</h3>
                        {leftJsonError && (
                          <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded" title={leftJsonError}>
                            Invalid JSON
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <Editor
                        height="100%"
                        defaultLanguage="json"
                        value={leftJson}
                        onChange={(value) => {
                          const newValue = value || '';
                          setLeftJson(newValue);
                          validateComparisonJson(newValue, setLeftJsonError);
                        }}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 12,
                          lineNumbers: 'on',
                          automaticLayout: true,
                          tabSize: 2,
                          insertSpaces: true,
                          wordWrap: 'on',
                          formatOnPaste: true,
                          formatOnType: true,
                          folding: true,
                          bracketPairColorization: { enabled: true },
                          scrollbar: {
                            vertical: 'auto',
                            horizontal: 'auto',
                            verticalScrollbarSize: 8,
                            horizontalScrollbarSize: 8,
                          },
                        }}
                        theme="vs"
                      />
                    </div>
                  </div>
                </Panel>

                <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />

                {/* Right JSON Editor */}
                <Panel defaultSize={50} minSize={30}>
                  <div className="h-full bg-white flex flex-col">
                    <div className="border-b px-4 py-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Modified JSON</h3>
                        {rightJsonError && (
                          <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded" title={rightJsonError}>
                            Invalid JSON
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <Editor
                        height="100%"
                        defaultLanguage="json"
                        value={rightJson}
                        onChange={(value) => {
                          const newValue = value || '';
                          setRightJson(newValue);
                          validateComparisonJson(newValue, setRightJsonError);
                        }}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 12,
                          lineNumbers: 'on',
                          automaticLayout: true,
                          tabSize: 2,
                          insertSpaces: true,
                          wordWrap: 'on',
                          formatOnPaste: true,
                          formatOnType: true,
                          folding: true,
                          bracketPairColorization: { enabled: true },
                          scrollbar: {
                            vertical: 'auto',
                            horizontal: 'auto',
                            verticalScrollbarSize: 8,
                            horizontalScrollbarSize: 8,
                          },
                        }}
                        theme="vs"
                      />
                    </div>
                  </div>
                </Panel>
              </PanelGroup>

              {/* Floating Diff Button */}
              {leftJson && rightJson && !leftJsonError && !rightJsonError && (
                <div className="absolute bottom-6 right-6 z-10">
                  <button
                    onClick={() => {
                      // Show diff in a modal or overlay
                      const diffModal = document.getElementById('diff-modal');
                      if (diffModal) {
                        diffModal.classList.remove('hidden');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
                  >
                    <GitCompare className="h-4 w-4" />
                    Show Differences
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Diff Modal */}
      <div id="diff-modal" className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">JSON Differences</h3>
            <button
              onClick={() => {
                const diffModal = document.getElementById('diff-modal');
                if (diffModal) {
                  diffModal.classList.add('hidden');
                }
              }}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="h-[calc(90vh-80px)] overflow-auto">
            {leftJson && rightJson && !leftJsonError && !rightJsonError && (
              <ReactDiffViewer
                oldValue={formatJsonForComparison(leftJson)}
                newValue={formatJsonForComparison(rightJson)}
                splitView={true}
                showDiffOnly={false}
                hideLineNumbers={false}
                useDarkTheme={false}
                leftTitle="Original JSON"
                rightTitle="Modified JSON"
                styles={{
                  variables: {
                    light: {
                      codeFoldGutterBackground: '#f7f7f7',
                      codeFoldBackground: '#f1f8ff',
                    }
                  },
                  line: {
                    fontSize: '13px',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                  },
                  contentText: {
                    fontSize: '13px',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                  },
                  diffContainer: {
                    height: 'calc(90vh - 120px)',
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Array Table Modal */}
      {arrayTableModal?.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Table View: {arrayTableModal.path || 'Array'}
              </h3>
              <button
                onClick={() => setArrayTableModal(null)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
              <TableView
                data={arrayTableModal.data}
                onChange={(newData) => {
                  // Update the original data structure immediately
                  arrayTableModal.onChange(newData);
                  // Update the modal data to reflect changes for continued editing
                  setArrayTableModal({
                    ...arrayTableModal,
                    data: newData
                  });
                }}
              />
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => setArrayTableModal(null)}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Changes have already been applied through onChange calls
                    // Just close the modal and update JSON text
                    setArrayTableModal(null);
                  }}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// En
// hanced tree view with array table icons
const EnhancedTreeView: React.FC<{
  data: any;
  onChange: (data: any) => void;
  onArrayTableRequest: (data: any[], path: string, onChange: (newData: any[]) => void) => void;
  path?: string;
}> = ({ data, onChange, onArrayTableRequest, path = '' }) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
  };

  const updateValue = (key: string | number, newValue: any) => {
    if (Array.isArray(data)) {
      const newArray = [...data];
      newArray[key as number] = newValue;
      onChange(newArray);
    } else {
      const newObject = { ...data, [key]: newValue };
      onChange(newObject);
    }
  };

  const renderValue = (value: any, key: string | number, currentPath: string): JSX.Element => {
    const fullPath = currentPath ? `${currentPath}.${key}` : String(key);

    if (Array.isArray(value)) {
      const isExpanded = expandedKeys.has(fullPath);
      return (
        <div className="ml-4">
          <div className="flex items-center gap-2 py-1">
            <button
              onClick={() => toggleExpanded(fullPath)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span className="font-mono text-sm">[{value.length} items]</span>
            </button>
            <button
              onClick={() => onArrayTableRequest(
                value,
                fullPath,
                (newData) => updateValue(key, newData)
              )}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              title="Open in table view"
            >
              <Table className="h-3 w-3" />
              Table
            </button>
          </div>
          {isExpanded && (
            <div className="ml-4 border-l border-gray-200 pl-4">
              {value.map((item, index) => (
                <div key={index} className="py-1">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 font-mono text-sm min-w-[30px]">[{index}]:</span>
                    <div className="flex-1">
                      {renderValue(item, index, `${fullPath}[${index}]`)}
                    </div>
                  </div>
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
        <div className="ml-4">
          <button
            onClick={() => toggleExpanded(fullPath)}
            className="flex items-center gap-1 py-1 text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span className="font-mono text-sm">{`{${keys.length} keys}`}</span>
          </button>
          {isExpanded && (
            <div className="ml-4 border-l border-gray-200 pl-4">
              {keys.map((objKey) => (
                <div key={objKey} className="py-1">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-700 font-medium text-sm min-w-[80px]">{objKey}:</span>
                    <div className="flex-1">
                      {renderValue(value[objKey], objKey, fullPath)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Simple values (string, number, boolean, null)
    return (
      <EditableSimpleValue
        value={value}
        onChange={(newValue) => updateValue(key, newValue)}
      />
    );
  };

  if (Array.isArray(data)) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-gray-600">Root Array [{data.length} items]</span>
          <button
            onClick={() => onArrayTableRequest(data, 'root', onChange)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            <Table className="h-3 w-3" />
            Table View
          </button>
        </div>
        <div className="space-y-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-gray-500 font-mono text-sm min-w-[30px]">[{index}]:</span>
              <div className="flex-1">
                {renderValue(item, index, '')}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data && typeof data === 'object') {
    const keys = Object.keys(data);
    return (
      <div className="space-y-1">
        {keys.map((key) => (
          <div key={key} className="flex items-start gap-2">
            <span className="text-gray-700 font-medium text-sm min-w-[80px]">{key}:</span>
            <div className="flex-1">
              {renderValue(data[key], key, '')}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <div className="text-gray-500">Invalid data</div>;
};

// Simple value editor for primitives
const EditableSimpleValue: React.FC<{ value: any; onChange: (value: any) => void }> = ({ value, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <input
        type="text"
        defaultValue={String(value ?? '')}
        autoFocus
        onBlur={(e) => {
          let newValue: any = e.target.value;

          // Parse value
          if (newValue === 'null') newValue = null;
          else if (newValue === 'true') newValue = true;
          else if (newValue === 'false') newValue = false;
          else if (!isNaN(Number(newValue)) && newValue.trim() !== '' && typeof value === 'number') {
            newValue = Number(newValue);
          }

          onChange(newValue);
          setIsEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') setIsEditing(false);
        }}
        className="px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer px-2 py-1 rounded hover:bg-gray-100 text-sm ${typeof value === 'string' ? 'text-green-700' :
        typeof value === 'number' ? 'text-blue-700' :
          typeof value === 'boolean' ? 'text-purple-700' :
            value === null ? 'text-gray-500 italic' :
              'text-gray-700'
        }`}
    >
      {value === null ? 'null' :
        typeof value === 'string' ? `"${value}"` :
          String(value)}
    </span>
  );
};

// Smart table view that adapts to different data structures
const TableView: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (path: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedSections(newExpanded);
  };

  // Check if data is an array of similar objects (good for table view)
  const isTableFriendlyArray = (arr: any[]): boolean => {
    if (!Array.isArray(arr) || arr.length === 0) return false;

    const firstItem = arr[0];
    if (typeof firstItem !== 'object' || firstItem === null) return false;

    const firstKeys = Object.keys(firstItem).sort();
    return arr.every(item => {
      if (typeof item !== 'object' || item === null) return false;
      const itemKeys = Object.keys(item).sort();
      return JSON.stringify(firstKeys) === JSON.stringify(itemKeys);
    });
  };

  // Render array as proper table
  const renderArrayTable = (arr: any[], path = '') => {
    if (!isTableFriendlyArray(arr)) {
      return renderGenericTable(arr, path);
    }

    const columns = Object.keys(arr[0]);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">
            Array Table ({arr.length} items)
          </h3>
          <button
            onClick={() => {
              const newItem = columns.reduce((obj, col) => ({ ...obj, [col]: '' }), {});
              onChange([...arr, newItem]);
            }}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="h-3 w-3" />
            Add Row
          </button>
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  #
                </th>
                {columns.map((col) => (
                  <th key={col} className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
                <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {arr.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 text-sm text-gray-500 font-mono">
                    {index}
                  </td>
                  {columns.map((col) => (
                    <td key={col} className="border border-gray-200 px-3 py-2">
                      <EditableCell
                        value={row[col]}
                        onChange={(newValue) => {
                          const newArr = [...arr];
                          newArr[index] = { ...newArr[index], [col]: newValue };
                          onChange(newArr);
                        }}
                      />
                    </td>
                  ))}
                  <td className="border border-gray-200 px-3 py-2">
                    <button
                      onClick={() => {
                        const newArr = arr.filter((_, i) => i !== index);
                        onChange(newArr);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
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

  // Render object as key-value table
  const renderObjectTable = (obj: any, path = '') => {
    const entries = Object.entries(obj);

    return (
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">
          Object Properties ({entries.length} keys)
        </h3>

        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                  Key
                </th>
                <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Type
                </th>
                <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {entries.map(([key, value]) => {
                const valueType = Array.isArray(value) ? 'array' : typeof value;
                const isComplex = typeof value === 'object' && value !== null;
                const sectionPath = `${path}.${key}`;

                return (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2 font-medium text-gray-900">
                      {key}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${valueType === 'string' ? 'bg-green-100 text-green-800' :
                        valueType === 'number' ? 'bg-blue-100 text-blue-800' :
                          valueType === 'boolean' ? 'bg-purple-100 text-purple-800' :
                            valueType === 'array' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                        }`}>
                        {valueType}
                      </span>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {isComplex ? (
                        <div>
                          <button
                            onClick={() => toggleSection(sectionPath)}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                          >
                            {expandedSections.has(sectionPath) ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                            {Array.isArray(value) ? `Array (${value.length} items)` : 'Object'}
                          </button>
                          {expandedSections.has(sectionPath) && (
                            <div className="mt-2 pl-4 border-l-2 border-gray-200">
                              <TableView
                                data={value}
                                onChange={(newValue) => {
                                  const newObj = { ...obj, [key]: newValue };
                                  onChange(newObj);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <EditableCell
                          value={value}
                          onChange={(newValue) => {
                            const newObj = { ...obj, [key]: newValue };
                            onChange(newObj);
                          }}
                        />
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

  // Render generic array (mixed types)
  const renderGenericTable = (arr: any[], path = '') => {
    return (
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">
          Array Items ({arr.length} items)
        </h3>

        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Index
                </th>
                <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Type
                </th>
                <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {arr.map((item, index) => {
                const itemType = Array.isArray(item) ? 'array' : typeof item;
                const isComplex = typeof item === 'object' && item !== null;
                const sectionPath = `${path}[${index}]`;

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2 font-mono text-sm text-gray-500">
                      [{index}]
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${itemType === 'string' ? 'bg-green-100 text-green-800' :
                        itemType === 'number' ? 'bg-blue-100 text-blue-800' :
                          itemType === 'boolean' ? 'bg-purple-100 text-purple-800' :
                            itemType === 'array' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                        }`}>
                        {itemType}
                      </span>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {isComplex ? (
                        <div>
                          <button
                            onClick={() => toggleSection(sectionPath)}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                          >
                            {expandedSections.has(sectionPath) ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                            {Array.isArray(item) ? `Array (${item.length} items)` : 'Object'}
                          </button>
                          {expandedSections.has(sectionPath) && (
                            <div className="mt-2 pl-4 border-l-2 border-gray-200">
                              <TableView
                                data={item}
                                onChange={(newValue) => {
                                  const newArr = [...arr];
                                  newArr[index] = newValue;
                                  onChange(newArr);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <EditableCell
                          value={item}
                          onChange={(newValue) => {
                            const newArr = [...arr];
                            newArr[index] = newValue;
                            onChange(newArr);
                          }}
                        />
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

  // Main render logic
  if (Array.isArray(data)) {
    return renderArrayTable(data);
  } else if (data && typeof data === 'object') {
    return renderObjectTable(data);
  } else {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Simple value: {String(data)}</p>
        <p className="text-sm">Use tree view for editing simple values</p>
      </div>
    );
  }
};

// Editable cell component with consistent object handling
const EditableCell: React.FC<{ value: any; onChange: (value: any) => void }> = ({ value, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Create a readable summary for objects
  const createObjectSummary = (obj: any): string => {
    if (Array.isArray(obj)) {
      return `[${obj.length} items]`;
    }

    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    if (keys.length <= 2) {
      // Show key-value pairs for small objects
      return `{${keys.map(k => `${k}: ${formatSimpleValue(obj[k])}`).join(', ')}}`;
    }
    return `{${keys.length} keys: ${keys.slice(0, 2).join(', ')}...}`;
  };

  // Format simple values (non-objects) for display
  const formatSimpleValue = (val: any): string => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return `"${val.length > 20 ? val.substring(0, 20) + '...' : val}"`;
    if (typeof val === 'object') return Array.isArray(val) ? `[${val.length}]` : '{...}';
    return String(val);
  };

  // Format value for editing
  const formatForEdit = (val: any): string => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'object') {
      return JSON.stringify(val, null, 2);
    }
    return String(val);
  };

  const handleSave = (newValue: string) => {
    let parsedValue: any = newValue;

    // Try to parse as appropriate type
    if (newValue === 'null') parsedValue = null;
    else if (newValue === 'undefined') parsedValue = undefined;
    else if (newValue === 'true') parsedValue = true;
    else if (newValue === 'false') parsedValue = false;
    else if (newValue === '') parsedValue = '';
    else if (!isNaN(Number(newValue)) && newValue.trim() !== '' && typeof value === 'number') {
      parsedValue = Number(newValue);
    } else if (newValue.trim().startsWith('{') || newValue.trim().startsWith('[')) {
      // Try to parse as JSON
      try {
        parsedValue = JSON.parse(newValue);
      } catch {
        parsedValue = newValue; // Keep as string if parsing fails
      }
    }

    onChange(parsedValue);
    setIsEditing(false);
  };

  // Handle simple values (strings, numbers, booleans, null)
  if (typeof value !== 'object' || value === null) {
    if (isEditing) {
      return (
        <input
          type="text"
          defaultValue={String(value ?? '')}
          autoFocus
          onBlur={(e) => handleSave(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave(e.currentTarget.value);
            if (e.key === 'Escape') setIsEditing(false);
          }}
          className="w-full px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      );
    }

    return (
      <div
        onClick={() => setIsEditing(true)}
        className="cursor-pointer px-2 py-1 rounded hover:bg-gray-100 min-h-[24px] flex items-center"
      >
        <span className={`${typeof value === 'string' ? 'text-green-700' :
          typeof value === 'number' ? 'text-blue-700' :
            typeof value === 'boolean' ? 'text-purple-700' :
              value === null ? 'text-gray-500 italic' :
                'text-gray-700'
          }`}>
          {value === null ? 'null' : String(value)}
        </span>
      </div>
    );
  }

  // Handle objects and arrays
  const objectKeys = Object.keys(value);
  const isSmallObject = !Array.isArray(value) && objectKeys.length <= 3;

  return (
    <div className="px-2 py-1">
      {/* Object summary with expand/collapse */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <span className="font-mono text-xs">
            {createObjectSummary(value)}
          </span>
        </button>

        {isSmallObject && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Edit JSON
          </button>
        )}
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div className="mt-2 pl-4 border-l-2 border-gray-200 space-y-1">
          {Array.isArray(value) ? (
            // Array items
            value.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 font-mono w-6">[{index}]</span>
                <span className="flex-1 font-mono">
                  {typeof item === 'object' && item !== null
                    ? createObjectSummary(item)
                    : formatSimpleValue(item)
                  }
                </span>
              </div>
            ))
          ) : (
            // Object properties
            objectKeys.map((key) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="text-gray-700 font-medium w-16 truncate">{key}:</span>
                <span className="flex-1 font-mono">
                  {typeof value[key] === 'object' && value[key] !== null
                    ? createObjectSummary(value[key])
                    : formatSimpleValue(value[key])
                  }
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* JSON editor for small objects */}
      {isEditing && isSmallObject && (
        <div className="mt-2">
          <textarea
            defaultValue={formatForEdit(value)}
            autoFocus
            onBlur={(e) => handleSave(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) handleSave(e.currentTarget.value);
              if (e.key === 'Escape') setIsEditing(false);
            }}
            className="w-full px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs resize-none"
            rows={4}
            placeholder="Edit as JSON..."
          />
          <div className="text-xs text-gray-500 mt-1">
            Ctrl+Enter to save, Escape to cancel
          </div>
        </div>
      )}
    </div>
  );
};

export default JsonEditor;