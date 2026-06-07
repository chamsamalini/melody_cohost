const { app, BrowserWindow, dialog, session } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const defaultPort = Number(process.env.PORT || 8787);
let mainWindow = null;
let serverLoaded = false;

function loadDesktopEnv() {
  const candidates = [
    path.join(process.cwd(), ".env"),
    path.join(path.dirname(process.execPath), ".env")
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) continue;

      const key = trimmed.slice(0, equalsIndex).trim();
      let value = trimmed.slice(equalsIndex + 1).trim();
      if (!key || process.env[key] !== undefined) continue;

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
    break;
  }
}

async function startServer() {
  if (serverLoaded) return;
  process.env.PORT = String(defaultPort);
  loadDesktopEnv();

  const serverPath = path.join(__dirname, "..", "server.mjs");
  try {
    await import(pathToFileURL(serverPath).href);
  } catch (error) {
    // If another local process is already serving Melody on this port,
    // reuse it instead of failing desktop startup.
    const message = error?.message || "";
    if (!message.includes("EADDRINUSE")) {
      throw error;
    }
  }
  serverLoaded = true;
}

async function waitForServer(url, attempts = 40, delayMs = 250) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // server still starting
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(`Desktop app failed to reach ${url}`);
}

function configureMediaPermissions() {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    if (permission === "media" && details.requestingUrl.startsWith(`http://localhost:${defaultPort}`)) {
      callback(true);
      return;
    }
    callback(false);
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 980,
    minHeight: 700,
    backgroundColor: "#0f1624",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

async function launchDesktopApp() {
  await startServer();
  await waitForServer(`http://localhost:${defaultPort}/health`);

  const window = createMainWindow();
  await window.loadURL(`http://localhost:${defaultPort}`);
}

app.whenReady().then(async () => {
  configureMediaPermissions();

  try {
    await launchDesktopApp();
  } catch (error) {
    dialog.showErrorBox("Melody Desktop Startup Error", error.message || "Unknown startup error.");
    app.quit();
  }

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      try {
        await launchDesktopApp();
      } catch (error) {
        dialog.showErrorBox("Melody Desktop Startup Error", error.message || "Unknown startup error.");
        app.quit();
      }
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
