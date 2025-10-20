const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const fs = require("fs");
const path = require("path");
const https = require("https");
const os = require("os");

let mainWindow;

function createWindow() {
  Menu.setApplicationMenu(null);

  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "build", "icon.ico")
    : path.join(__dirname, "build", "icon.ico");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    titleBarStyle: "hidden",
  });

  ipcMain.handle("window-minimize", () => {
    mainWindow.minimize();
  });

  ipcMain.handle("window-maximize", () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle("window-close", () => {
    mainWindow.close();
  });

  if (process.platform === 'win32') {
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, "build", "icon.ico")
      : path.join(__dirname, "build", "icon.ico");
    mainWindow.setIcon(iconPath);
  }

  ipcMain.handle("download-image", async (event, { buffer, filename }) => {
    try {
      const userHome = require("os").homedir();
      const downloadsDir = path.join(userHome, "Downloads");
      const filePath = path.join(downloadsDir, filename);
      fs.writeFileSync(filePath, Buffer.from(buffer));
      return { success: true, path: filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    "download-image-with-dialog",
    async (event, { buffer, filename }) => {
      try {
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
          defaultPath: filename,
          filters: [
            { name: "Images", extensions: ["jpg", "jpeg", "png", "webp"] },
          ],
        });

        if (canceled || !filePath) {
          return { success: false, error: "Download cancelled" };
        }

        fs.writeFileSync(filePath, Buffer.from(buffer));
        return { success: true, path: filePath };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle("save-image", async (event, { url }) => {
    try {
      const ext = path.extname(url) || ".jpg";
      const defaultPath = path.join(
        app.getPath("downloads"),
        `wallpaper-${Date.now()}${ext}`
      );

      const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: defaultPath,
        filters: [
          { name: "Images", extensions: ["jpg", "jpeg", "png", "webp"] },
        ],
      });

      if (canceled || !filePath) {
        return { success: false, error: "Download cancelled" };
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch image");

      const arrayBuffer = await response.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("show-save-dialog", async (event, { url, defaultPath }) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: defaultPath,
        filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png"] }],
      });

      if (!canceled && filePath) {
        const file = fs.createWriteStream(filePath);

        await new Promise((resolve, reject) => {
          https
            .get(url, (response) => {
              response.pipe(file);
              file.on("finish", () => {
                file.close();
                resolve();
              });
            })
            .on("error", (err) => {
              fs.unlink(filePath, () => {});
              reject(err);
            });
        });

        return { success: true };
      }
      return { success: false, error: "User cancelled" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  mainWindow.webContents.on("context-menu", (e) => {
    e.preventDefault();
  });

  mainWindow.loadFile("index.html");

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (
      input.key === "F12" ||
      (input.control && input.shift && (input.key === "I" || input.key === "C"))
    ) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.on("devtools-opened", () => {
    mainWindow.webContents.closeDevTools();
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  try {
    app.setAppUserModelId("com.imgdive.background-image-finder");
  } catch {}
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle("set-wallpaper", async (event, { url }) => {
  try {
    const ext = path.extname(new URL(url).pathname) || ".jpg";
    const tempFile = path.join(os.tmpdir(), `bgf-${Date.now()}${ext}`);

    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tempFile);
      https
        .get(url, (res) => {
          if (res.statusCode !== 200) {
            file.close(() => fs.unlink(tempFile, () => {}));
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          res.pipe(file);
          file.on("finish", () => file.close(resolve));
        })
        .on("error", (err) => {
          file.close(() => fs.unlink(tempFile, () => {}));
          reject(err);
        });
    });

    if (process.platform === "win32") {
      const { spawn } = require("child_process");
      const escapedPath = tempFile.replace(/'/g, "''");
      const codeCs =
        'using System.Runtime.InteropServices;\npublic class WinAPI {\n  [DllImport("user32.dll", SetLastError=true)]\n  public static extern bool SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);\n}';
      const psCommand = `
$path = '${escapedPath}';
Set-ItemProperty -Path 'HKCU:\\Control Panel\\Desktop' -Name WallpaperStyle -Value 10 -ErrorAction SilentlyContinue;
Set-ItemProperty -Path 'HKCU:\\Control Panel\\Desktop' -Name TileWallpaper -Value 0 -ErrorAction SilentlyContinue;
$code = @'
${codeCs}
'@;
Add-Type -TypeDefinition $code;
[WinAPI]::SystemParametersInfo(20, 0, $path, 3) | Out-Null
`;

      const ps = spawn(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", psCommand],
        { windowsHide: true }
      );

      await new Promise((resolve, reject) => {
        let stderr = "";
        ps.stderr.on("data", (d) => {
          stderr += d.toString();
        });
        ps.on("exit", (code) => {
          if (code === 0) resolve();
          else reject(new Error(stderr || `PowerShell exited ${code}`));
        });
      });

      return { success: true };
    }

    return {
      success: false,
      error: "Setting wallpaper is only implemented on Windows for now.",
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
