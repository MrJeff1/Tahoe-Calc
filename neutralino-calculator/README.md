# macOS Tahoe Calculator — Neutralino.js

A standalone desktop calculator for Windows, Linux, and macOS.
No Node.js, no build tools, no dependencies beyond the Neutralino binary.

## Setup (one time)

```bash
# Install the Neutralino CLI globally
npm install -g @neutralinojs/neu

# Inside this folder, download the binaries + neutralino.js client
cd neutralino-calculator
neu update
```

## Run

```bash
neu run
```

## Build distributable binaries

```bash
neu build
```

Outputs to `dist/`:
- `calculator-linux_x64`
- `calculator-win_x64.exe`
- `calculator-mac_x64`  (and arm64)

## Ship it

Copy the matching binary + `resources.neu` to the target machine. That's it —
no installer, no runtime, no dependencies. Total size is ~3–5 MB.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| 0–9, . | Input digit |
| + - * / | Operators |
| Enter or = | Equals |
| Backspace | Delete last digit |
| Escape | Clear (AC) |
| % | Percent |
