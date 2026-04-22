# BddGeneration
Upload an HTML page → parse to structured JSON → generate Gherkin BDD scenarios with AI.

---

## Option 1 – Desktop App (`.exe` / no browser needed)

The Electron desktop app lets you run everything locally without a browser or a server.

### Run in development
```bash
npm install
npm run electron:start
```

### Build installer (`.exe` on Windows, `.dmg` on macOS, `.AppImage` on Linux)
```bash
npm install
npm run electron:build
```
The output appears in the `dist/` folder.  On Windows you get an NSIS `.exe` installer.

### What the UI provides
| UI element | Purpose |
|---|---|
| **Browse…** (HTML File) | Opens a native file picker – select any `.html` / `.htm` file |
| **Browse…** (Output Folder) | Optional – pick a folder; results are saved there automatically |
| **OpenAI API Key** | Required only for BDD generation |
| **Model** | OpenAI model name (default `gpt-4o-mini`) |
| **Generate Structured JSON** | Parses the HTML and shows (and optionally saves) a structured JSON file |
| **Generate BDD with AI** | Parses the HTML **and** calls OpenAI to produce Gherkin scenarios |

Output files written to the chosen folder:
- `<filename>_structured.json` – machine-readable page schema
- `<filename>.feature` – Gherkin BDD scenarios

---

## Option 2 – Web Server

```bash
npm install
npm start          # starts Express on http://localhost:3000
```

Open `http://localhost:3000` in any browser.

---

## Option 3 – Tests

```bash
npm test
```
