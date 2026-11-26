// ─── Shared JSON helpers (editor, merge tab, landing drop zone) ────────────────

export type TIndent = "2" | "4" | "tab";

export type TArrayStrategy = "replace" | "concat";

export const INDENT_OPTIONS: TIndent[] = ["2", "4", "tab"];

export const EDITOR_STORAGE_KEYS = {
    jsonData: "json-editor-data",
    jsonText: "json-editor-text",
    originalJsonText: "json-editor-original",
    activeTab: "json-editor-tab",
    leftJson: "json-editor-left",
    rightJson: "json-editor-right",
    indent: "json-editor-indent",
    mergeBase: "json-editor-merge-base",
    mergeOverride: "json-editor-merge-override",
};

export const SAMPLE_JSON = {
    project: "json.tools",
    version: "2.0",
    local: true,
    owner: { name: "Tai", role: "Frontend engineer" },
    tags: ["editor", "diff", "merge"],
    users: [
        { id: 1, name: "Alice", email: "alice@example.com", active: true },
        { id: 2, name: "Bob", email: "bob@example.com", active: false },
        { id: 3, name: "Carol", email: "carol@example.com", active: true },
    ],
};

export const indentValue = (indent: TIndent): string | number => {
    return indent === "tab" ? "\t" : Number(indent);
};

export const stringify = (data: unknown, indent: TIndent): string => {
    return JSON.stringify(data, null, indentValue(indent));
};

// Size in bytes of a string once encoded as UTF-8.
export const byteSize = (text: string): number => {
    return new TextEncoder().encode(text).length;
};

export const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export type TParseError = {
    message: string;
    line: number | null;
    column: number | null;
};

// Minimal JSON scanner that returns the index of the first syntax error.
// Used when the browser's error message carries no position (recent V8).
const findErrorIndex = (text: string): number | null => {
    let i = 0;
    const ws = () => { while (i < text.length && " \t\n\r".includes(text[i])) i++; };
    const fail = (): never => { throw i; };
    const literal = (word: string) => { if (text.startsWith(word, i)) i += word.length; else fail(); };
    const string = () => {
        i++;
        while (i < text.length && text[i] !== '"') {
            if (text[i] === "\\") i++;
            else if (text[i] < " ") fail();
            i++;
        }
        if (i >= text.length) fail();
        i++;
    };
    const number = () => {
        const m = text.slice(i).match(/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/);
        if (!m) fail(); else i += m[0].length;
    };
    const value = (): void => {
        ws();
        const c = text[i];
        if (c === "{") {
            i++; ws();
            if (text[i] === "}") { i++; return; }
            for (;;) {
                ws(); if (text[i] !== '"') fail(); string();
                ws(); if (text[i] !== ":") fail(); i++;
                value(); ws();
                if (text[i] === ",") { i++; continue; }
                if (text[i] === "}") { i++; return; }
                fail();
            }
        }
        if (c === "[") {
            i++; ws();
            if (text[i] === "]") { i++; return; }
            for (;;) {
                value(); ws();
                if (text[i] === ",") { i++; continue; }
                if (text[i] === "]") { i++; return; }
                fail();
            }
        }
        if (c === '"') return string();
        if (c === "t") return literal("true");
        if (c === "f") return literal("false");
        if (c === "n") return literal("null");
        if (c === "-" || (c >= "0" && c <= "9")) return number();
        fail();
    };
    try {
        value(); ws();
        return i < text.length ? i : null;
    } catch (pos) {
        return typeof pos === "number" ? Math.min(pos, text.length) : null;
    }
};

// Turn a JSON.parse error into a message with a 1-based line / column.
// Browsers report either "... at position N" or "... (line L column C)".
export const describeParseError = (text: string, err: unknown): TParseError => {
    const message = err instanceof Error ? err.message : String(err);

    const lineCol = message.match(/line (\d+) column (\d+)/i);
    if (lineCol) {
        return { message, line: Number(lineCol[1]), column: Number(lineCol[2]) };
    }

    const pos = message.match(/position (\d+)/i);
    if (pos) {
        const before = text.slice(0, Number(pos[1]));
        const lines = before.split("\n");
        return { message, line: lines.length, column: lines[lines.length - 1].length + 1 };
    }

    const index = findErrorIndex(text);
    if (index !== null) {
        const lines = text.slice(0, index).split("\n");
        return { message, line: lines.length, column: lines[lines.length - 1].length + 1 };
    }

    return { message, line: null, column: null };
};

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
    return typeof v === "object" && v !== null && !Array.isArray(v);
};

// Deep merge: keys in `override` win; nested objects are merged recursively.
export const deepMerge = (base: unknown, override: unknown, arrays: TArrayStrategy): unknown => {
    if (Array.isArray(base) && Array.isArray(override)) {
        return arrays === "concat" ? [...base, ...override] : override;
    }
    if (isPlainObject(base) && isPlainObject(override)) {
        const out: Record<string, unknown> = { ...base };
        for (const [k, v] of Object.entries(override)) {
            out[k] = k in base ? deepMerge(base[k], v, arrays) : v;
        }
        return out;
    }
    return override;
};

// Hand JSON to the editor page: it reads these keys on mount.
export const saveForEditor = (data: unknown, indent: TIndent = "2") => {
    const text = stringify(data, indent);
    localStorage.setItem(EDITOR_STORAGE_KEYS.jsonData, JSON.stringify(data));
    localStorage.setItem(EDITOR_STORAGE_KEYS.jsonText, text);
    localStorage.setItem(EDITOR_STORAGE_KEYS.originalJsonText, text);
    localStorage.setItem(EDITOR_STORAGE_KEYS.activeTab, "editor");
};
