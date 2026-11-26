# JSON Owl

A simple JSON editor that runs entirely in your browser.

Live: https://json-editor.heytai.dev

- **Tree and table editing:** click any value to edit it; arrays of objects open as tables.
- **Code editor:** Monaco with validation, plus format / minify with 2, 4 or tab indentation.
- **Diff and merge:** compare two documents side by side, or deep-merge them.
- **Export:** JSON, plain text, JavaScript object or PHP array.
- **Private by design:** nothing is uploaded. Your last session is kept only in this browser's local storage, and **Clear** removes it.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Built with Next.js, next-intl (English / 繁體中文), Tailwind CSS and Monaco Editor.
