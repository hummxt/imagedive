# <a href="https://github.com/hummxt/imagedive/releases/download/download/imagedive.exe">
  <img src="./icons/logo.png" alt="Imagedive Logo" width="320">
</a>


A simple Electron.js desktop app to search wallpapers from Pexels, download them, and set as wallpaper on Windows.

## Install

[Download Imagedive for Windows](https://github.com/hummxt/imagedive/releases/download/download/imagedive.exe)


1. Install Node.js (LTS).
2. Install dependencies:
   
   ```bash
   npm install
   ```

## Run (development)
```bash
npm start
```

## Generate App Icon (optional)
```bash
npm run generate-icons
```

## Build (Windows)
- Portable build:
  ```bash
  npm run build:portable
  ```
- Installer:
  ```bash
  npm run build
  ```

## Files
- `index.html`, `script.js`, `styles.css` – UI
- `download.js` – client-side download helper
- `main.js` / `index.js` – Electron main process
- `build/icon.ico` – app icon

## License
MIT










