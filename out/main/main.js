"use strict";
const electron = require("electron");
const node_path = require("node:path");
const utils = require("@electron-toolkit/utils");
const Database = require("better-sqlite3");
const uuid = require("uuid");
const node_fs = require("node:fs");
const node_crypto = require("node:crypto");
const tesseract_js = require("tesseract.js");
let db = null;
function initializeDatabase() {
  try {
    const dbPath = node_path.join(electron.app.getPath("userData"), "clipboard.db");
    db = new Database(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS clipboard_history (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT,
        timestamp TEXT NOT NULL,
        size INTEGER NOT NULL,
        formats TEXT,
        full_content TEXT,
        is_favorite BOOLEAN DEFAULT 0,
        tags TEXT,
        is_encrypted BOOLEAN DEFAULT 0,
        iv TEXT,
        auth_tag TEXT,
        salt TEXT,
        group_id TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT,
        icon TEXT,
        color TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES groups(id)
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL DEFAULT 'cyan',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS item_tags (
        item_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (item_id, tag_id),
        FOREIGN KEY (item_id) REFERENCES clipboard_history(id),
        FOREIGN KEY (tag_id) REFERENCES tags(id)
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS versions (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL,
        content TEXT NOT NULL,
        hash TEXT NOT NULL,
        changes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES clipboard_history(id)
      )
    `);
    try {
      db.exec("ALTER TABLE clipboard_history ADD COLUMN is_encrypted BOOLEAN DEFAULT 0");
    } catch (e) {
    }
    try {
      db.exec("ALTER TABLE clipboard_history ADD COLUMN iv TEXT");
    } catch (e) {
    }
    try {
      db.exec("ALTER TABLE clipboard_history ADD COLUMN auth_tag TEXT");
    } catch (e) {
    }
    try {
      db.exec("ALTER TABLE clipboard_history ADD COLUMN salt TEXT");
    } catch (e) {
    }
    try {
      db.exec("ALTER TABLE clipboard_history ADD COLUMN title TEXT");
    } catch (e) {
    }
    try {
      db.exec("ALTER TABLE clipboard_history ADD COLUMN group_id TEXT");
    } catch (e) {
    }
    try {
      db.exec("ALTER TABLE clipboard_history ADD COLUMN metadata TEXT");
    } catch (e) {
    }
    try {
      db.exec("ALTER TABLE clipboard_history ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
    } catch (e) {
    }
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_timestamp ON clipboard_history(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_type ON clipboard_history(type);
      CREATE INDEX IF NOT EXISTS idx_content ON clipboard_history(content);
      CREATE INDEX IF NOT EXISTS idx_group ON clipboard_history(group_id);
      CREATE INDEX IF NOT EXISTS idx_parent ON groups(parent_id);
      CREATE INDEX IF NOT EXISTS idx_item_versions ON versions(item_id);
    `);
    console.log("数据库初始化成功");
  } catch (error) {
    console.error("数据库初始化失败:", error);
    throw error;
  }
}
function getDatabase() {
  if (!db) {
    throw new Error("数据库未初始化");
  }
  return db;
}
function addClipboardItem(item) {
  const db2 = getDatabase();
  const id = uuid.v4();
  try {
    const stmt = db2.prepare(`
      INSERT INTO clipboard_history (
        id, content, type, title, timestamp, size, formats, full_content,
        is_encrypted, iv, auth_tag, salt, tags, group_id, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      item.content,
      item.type,
      item.title || null,
      item.timestamp,
      item.size,
      item.formats ? JSON.stringify(item.formats) : null,
      item.fullContent ? JSON.stringify(item.fullContent) : null,
      item.isEncrypted ? 1 : 0,
      item.encryptionData?.iv || null,
      item.encryptionData?.authTag || null,
      item.encryptionData?.salt || null,
      item.tags ? JSON.stringify(item.tags) : null,
      item.groupId || null,
      item.metadata ? JSON.stringify(item.metadata) : null
    );
    return { ...item, id };
  } catch (error) {
    console.error("添加剪贴板项目失败:", error);
    throw error;
  }
}
function getClipboardHistory(limit = 100) {
  const db2 = getDatabase();
  try {
    const stmt = db2.prepare(`
      SELECT * FROM clipboard_history
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    const rows = stmt.all(limit);
    return rows.map((row) => mapRowToItem(row));
  } catch (error) {
    console.error("获取剪贴板历史失败:", error);
    throw error;
  }
}
function deleteClipboardItem(id) {
  const db2 = getDatabase();
  try {
    db2.prepare("DELETE FROM versions WHERE item_id = ?").run(id);
    db2.prepare("DELETE FROM item_tags WHERE item_id = ?").run(id);
    const stmt = db2.prepare("DELETE FROM clipboard_history WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  } catch (error) {
    console.error("删除剪贴板项目失败:", error);
    throw error;
  }
}
function clearClipboardHistory() {
  const db2 = getDatabase();
  try {
    db2.exec("DELETE FROM versions");
    db2.exec("DELETE FROM item_tags");
    db2.exec("DELETE FROM clipboard_history");
    console.log("剪贴板历史已清空");
  } catch (error) {
    console.error("清空剪贴板历史失败:", error);
    throw error;
  }
}
function updateClipboardItem(id, updates) {
  const db2 = getDatabase();
  try {
    const fields = [];
    const values = [];
    if (updates.content !== void 0) {
      fields.push("content = ?");
      values.push(updates.content);
    }
    if (updates.type !== void 0) {
      fields.push("type = ?");
      values.push(updates.type);
    }
    if (updates.title !== void 0) {
      fields.push("title = ?");
      values.push(updates.title);
    }
    if (updates.formats !== void 0) {
      fields.push("formats = ?");
      values.push(JSON.stringify(updates.formats));
    }
    if (updates.fullContent !== void 0) {
      fields.push("full_content = ?");
      values.push(JSON.stringify(updates.fullContent));
    }
    if (updates.tags !== void 0) {
      fields.push("tags = ?");
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.isFavorite !== void 0) {
      fields.push("is_favorite = ?");
      values.push(updates.isFavorite ? 1 : 0);
    }
    if (updates.groupId !== void 0) {
      fields.push("group_id = ?");
      values.push(updates.groupId);
    }
    if (updates.metadata !== void 0) {
      fields.push("metadata = ?");
      values.push(JSON.stringify(updates.metadata));
    }
    if (fields.length === 0) {
      return false;
    }
    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    const stmt = db2.prepare(`UPDATE clipboard_history SET ${fields.join(", ")} WHERE id = ?`);
    const result = stmt.run(...values);
    return result.changes > 0;
  } catch (error) {
    console.error("更新剪贴板项目失败:", error);
    throw error;
  }
}
function mapRowToItem(row) {
  return {
    id: row.id,
    content: row.content,
    type: row.type,
    title: row.title || void 0,
    timestamp: row.timestamp,
    size: row.size,
    formats: row.formats ? JSON.parse(row.formats) : void 0,
    fullContent: row.full_content ? JSON.parse(row.full_content) : void 0,
    isEncrypted: !!row.is_encrypted,
    encryptionData: row.is_encrypted ? {
      iv: row.iv,
      authTag: row.auth_tag,
      salt: row.salt
    } : void 0,
    isFavorite: !!row.is_favorite,
    tags: row.tags ? JSON.parse(row.tags) : void 0,
    groupId: row.group_id || void 0,
    metadata: row.metadata ? JSON.parse(row.metadata) : void 0
  };
}
const defaultSettings = {
  enableEncryption: false,
  maxHistoryItems: 100,
  theme: "auto"
};
const settingsPath = node_path.join(electron.app.getPath("userData"), "settings.json");
function loadSettings() {
  try {
    if (node_fs.existsSync(settingsPath)) {
      const data = node_fs.readFileSync(settingsPath, "utf-8");
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error("加载设置失败:", error);
  }
  return defaultSettings;
}
function saveSettings(settings2) {
  try {
    const current = loadSettings();
    const newSettings = { ...current, ...settings2 };
    node_fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2), "utf-8");
  } catch (error) {
    console.error("保存设置失败:", error);
  }
}
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
function deriveKey(password, salt) {
  return node_crypto.scryptSync(password, salt, KEY_LENGTH);
}
function encrypt(text, password) {
  const salt = node_crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);
  const iv = node_crypto.randomBytes(IV_LENGTH);
  const cipher = node_crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return {
    content: encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    salt: salt.toString("hex")
  };
}
function decrypt(encryptedData, password) {
  const salt = Buffer.from(encryptedData.salt, "hex");
  const iv = Buffer.from(encryptedData.iv, "hex");
  const authTag = Buffer.from(encryptedData.authTag, "hex");
  const encryptedText = encryptedData.content;
  const key = deriveKey(password, salt);
  const decipher = node_crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
async function recognizeText(imageSource, lang = "chi_sim+eng") {
  try {
    const worker = await tesseract_js.createWorker(lang);
    const ret = await worker.recognize(imageSource);
    await worker.terminate();
    return ret.data.text;
  } catch (error) {
    console.error("OCR failed:", error);
    throw error;
  }
}
const windowState = {
  main: {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600
  },
  floating: {
    width: 400,
    height: 600,
    minWidth: 300,
    minHeight: 400
  }
};
let mainWindow = null;
let floatingWindow = null;
let tray = null;
let clipboardHistory = [];
let lastClipboardContent = "";
let clipboardMonitorInterval = null;
let settings = loadSettings();
let sessionPassword = null;
function createMainWindow() {
  mainWindow = new electron.BrowserWindow({
    width: windowState.main.width,
    height: windowState.main.height,
    minWidth: windowState.main.minWidth,
    minHeight: windowState.main.minHeight,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: node_path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(node_path.join(__dirname, "../renderer/index.html"));
  }
}
function createFloatingWindow() {
  floatingWindow = new electron.BrowserWindow({
    width: windowState.floating.width,
    height: windowState.floating.height,
    minWidth: windowState.floating.minWidth,
    minHeight: windowState.floating.minHeight,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    show: false,
    webPreferences: {
      preload: node_path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  floatingWindow.on("blur", () => {
    floatingWindow?.hide();
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    floatingWindow.loadURL(process.env["ELECTRON_RENDERER_URL"] + "#/floating");
  } else {
    floatingWindow.loadFile(node_path.join(__dirname, "../renderer/index.html"), { hash: "#/floating" });
  }
}
function createTray() {
  const iconPath = node_path.join(__dirname, "../../resources/icon.png");
  const trayIcon = electron.nativeImage.createFromPath(iconPath);
  tray = new electron.Tray(trayIcon.resize({ width: 16, height: 16 }));
  const contextMenu = electron.Menu.buildFromTemplate([
    {
      label: "显示主窗口",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: "显示浮动窗口",
      click: () => {
        showFloatingWindow();
      }
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        electron.app.quit();
      }
    }
  ]);
  tray.setToolTip("剪贴板管理器");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}
function showFloatingWindow() {
  if (!floatingWindow) {
    createFloatingWindow();
  }
  if (floatingWindow) {
    const cursorPoint = require("electron").screen.getCursorScreenPoint();
    const primaryDisplay = require("electron").screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    let x = cursorPoint.x - windowState.floating.width / 2;
    let y = cursorPoint.y - windowState.floating.height / 2;
    if (x < 0) x = 10;
    if (y < 0) y = 10;
    if (x + windowState.floating.width > width) x = width - windowState.floating.width - 10;
    if (y + windowState.floating.height > height) y = height - windowState.floating.height - 10;
    floatingWindow.setPosition(Math.round(x), Math.round(y));
    floatingWindow.show();
    floatingWindow.focus();
  }
}
function hideFloatingWindow() {
  floatingWindow?.hide();
}
function registerGlobalShortcuts() {
  electron.globalShortcut.register("CommandOrControl+Shift+V", () => {
    showFloatingWindow();
  });
  electron.globalShortcut.register("CommandOrControl+Alt+C", () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}
function startClipboardMonitoring() {
  clipboardMonitorInterval = setInterval(() => {
    try {
      const { formats, content } = getCurrentClipboardFormats();
      const contentString = JSON.stringify(content);
      if (formats.length > 0 && contentString !== lastClipboardContent) {
        lastClipboardContent = contentString;
        if (settings.enableEncryption && !sessionPassword) {
          return;
        }
        const newItem = {
          id: Date.now().toString(),
          content: content.text || contentString,
          type: formats.includes("image") ? "image" : formats.includes("html") ? "html" : formats.includes("rtf") ? "rtf" : "text",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          size: contentString.length,
          formats,
          fullContent: content
        };
        try {
          if (settings.enableEncryption && sessionPassword) {
            const encrypted = encrypt(newItem.content, sessionPassword);
            newItem.content = encrypted.content;
            newItem.isEncrypted = true;
            newItem.encryptionData = {
              iv: encrypted.iv,
              authTag: encrypted.authTag,
              salt: encrypted.salt
            };
            if (newItem.fullContent) {
              delete newItem.fullContent;
            }
          }
          addClipboardItem({
            content: newItem.content,
            type: newItem.type,
            timestamp: newItem.timestamp,
            size: newItem.size,
            formats: newItem.formats,
            fullContent: newItem.fullContent,
            isEncrypted: newItem.isEncrypted,
            encryptionData: newItem.encryptionData
          });
        } catch (error) {
          console.error("保存到数据库失败:", error);
        }
        clipboardHistory.unshift(newItem);
        if (clipboardHistory.length > 100) {
          clipboardHistory = clipboardHistory.slice(0, 100);
        }
        mainWindow?.webContents.send("clipboard-changed", newItem);
        floatingWindow?.webContents.send("clipboard-changed", newItem);
      }
    } catch (error) {
      console.error("剪贴板监控错误:", error);
    }
  }, 1e3);
}
function stopClipboardMonitoring() {
  if (clipboardMonitorInterval) {
    clearInterval(clipboardMonitorInterval);
    clipboardMonitorInterval = null;
  }
}
function getCurrentClipboardFormats() {
  const formats = electron.clipboard.availableFormats();
  const content = {};
  try {
    if (formats.includes("text")) {
      content.text = electron.clipboard.readText();
    }
    if (formats.includes("html")) {
      content.html = electron.clipboard.readHTML();
    }
    if (formats.includes("rtf")) {
      content.rtf = electron.clipboard.readRTF();
    }
    if (formats.includes("image")) {
      const image = electron.clipboard.readImage();
      content.image = `data:image/png;base64,${image.toPNG().toString("base64")}`;
      content.imageSize = { width: image.getSize().width, height: image.getSize().height };
    }
  } catch (error) {
    console.error("读取剪贴板格式失败:", error);
  }
  return { formats, content };
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  try {
    initializeDatabase();
    console.log("数据库初始化完成");
  } catch (error) {
    console.error("数据库初始化失败:", error);
  }
  createMainWindow();
  createFloatingWindow();
  createTray();
  registerGlobalShortcuts();
  startClipboardMonitoring();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    stopClipboardMonitoring();
    electron.app.quit();
  }
});
electron.app.on("will-quit", () => {
  electron.globalShortcut.unregisterAll();
  stopClipboardMonitoring();
  try {
    const { closeDatabase } = require("./database");
    closeDatabase();
  } catch (error) {
    console.error("关闭数据库失败:", error);
  }
});
electron.ipcMain.handle("get-clipboard-content", async () => {
  try {
    const formats = electron.clipboard.availableFormats();
    const content = {};
    if (formats.includes("text")) {
      content.text = electron.clipboard.readText();
    }
    if (formats.includes("html")) {
      content.html = electron.clipboard.readHTML();
    }
    if (formats.includes("image")) {
      const image = electron.clipboard.readImage();
      content.image = image.toDataURL();
      content.imageSize = { width: image.getSize().width, height: image.getSize().height };
    }
    if (formats.includes("rtf")) {
      content.rtf = electron.clipboard.readRTF();
    }
    return {
      formats,
      content,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch (error) {
    console.error("读取剪贴板失败:", error);
    return { error: "读取剪贴板失败" };
  }
});
electron.ipcMain.handle("set-clipboard-content", async (_, content) => {
  try {
    if (content.startsWith("data:image/")) {
      const image = electron.nativeImage.createFromDataURL(content);
      electron.clipboard.writeImage(image);
    } else {
      electron.clipboard.writeText(content);
    }
    return { success: true };
  } catch (error) {
    console.error("写入剪贴板失败:", error);
    return { error: "写入剪贴板失败" };
  }
});
electron.ipcMain.handle("show-floating-window", async () => {
  showFloatingWindow();
  return { success: true };
});
electron.ipcMain.handle("hide-floating-window", async () => {
  hideFloatingWindow();
  return { success: true };
});
electron.ipcMain.handle("get-app-version", async () => {
  return electron.app.getVersion();
});
electron.ipcMain.handle("get-clipboard-history", async () => {
  try {
    const dbHistory = getClipboardHistory(100);
    if (sessionPassword) {
      dbHistory.forEach((item) => {
        if (item.isEncrypted && item.encryptionData) {
          try {
            item.content = decrypt({
              content: item.content,
              iv: item.encryptionData.iv,
              authTag: item.encryptionData.authTag,
              salt: item.encryptionData.salt
            }, sessionPassword);
          } catch (e) {
            console.error("解密失败:", e);
            item.content = "[解密失败]";
          }
        }
      });
    } else {
      dbHistory.forEach((item) => {
        if (item.isEncrypted) {
          item.content = "[已加密内容 - 请解锁查看]";
          delete item.fullContent;
        }
      });
    }
    clipboardHistory = dbHistory;
    return dbHistory;
  } catch (error) {
    console.error("获取剪贴板历史失败:", error);
    return clipboardHistory;
  }
});
electron.ipcMain.handle("clear-clipboard-history", async () => {
  try {
    clearClipboardHistory();
    clipboardHistory = [];
    return { success: true };
  } catch (error) {
    console.error("清空剪贴板历史失败:", error);
    return { error: "清空失败" };
  }
});
electron.ipcMain.handle("delete-clipboard-item", async (_, id) => {
  try {
    const success = deleteClipboardItem(id);
    return { success };
  } catch (error) {
    console.error("删除剪贴板项目失败:", error);
    return { success: false, error: "删除失败" };
  }
});
electron.ipcMain.handle("update-clipboard-item", async (_, id, updates) => {
  try {
    const success = updateClipboardItem(id, updates);
    return { success };
  } catch (error) {
    console.error("更新剪贴板项目失败:", error);
    return { success: false, error: "更新失败" };
  }
});
electron.ipcMain.handle("paste-from-history", async (_, index) => {
  if (index >= 0 && index < clipboardHistory.length) {
    const item = clipboardHistory[index];
    try {
      if (item.type === "image" || item.content.startsWith("data:image/")) {
        const image = electron.nativeImage.createFromDataURL(item.content);
        electron.clipboard.writeImage(image);
      } else {
        electron.clipboard.writeText(item.content);
      }
      return { success: true };
    } catch (error) {
      console.error("从历史记录粘贴失败:", error);
      return { error: "粘贴失败" };
    }
  }
  return { error: "无效的索引" };
});
electron.ipcMain.handle("enable-encryption", async (_, password) => {
  try {
    const salt = node_crypto.randomBytes(16).toString("hex");
    const hash = node_crypto.scryptSync(password, salt, 64).toString("hex");
    settings.enableEncryption = true;
    settings.passwordHash = hash;
    settings.passwordSalt = salt;
    saveSettings(settings);
    sessionPassword = password;
    return { success: true };
  } catch (error) {
    console.error("启用加密失败:", error);
    return { success: false, error: "启用加密失败" };
  }
});
electron.ipcMain.handle("unlock-encryption", async (_, password) => {
  if (!settings.passwordHash || !settings.passwordSalt) {
    return { success: false, error: "未设置密码" };
  }
  try {
    const hash = node_crypto.scryptSync(password, settings.passwordSalt, 64).toString("hex");
    if (hash === settings.passwordHash) {
      sessionPassword = password;
      return { success: true };
    } else {
      return { success: false, error: "密码错误" };
    }
  } catch (error) {
    console.error("解锁失败:", error);
    return { success: false, error: "解锁失败" };
  }
});
electron.ipcMain.handle("disable-encryption", async (_, password) => {
  if (!settings.passwordHash || !settings.passwordSalt) {
    return { success: false, error: "未设置密码" };
  }
  try {
    const hash = node_crypto.scryptSync(password, settings.passwordSalt, 64).toString("hex");
    if (hash !== settings.passwordHash) {
      return { success: false, error: "密码错误" };
    }
    settings.enableEncryption = false;
    delete settings.passwordHash;
    delete settings.passwordSalt;
    saveSettings(settings);
    sessionPassword = null;
    return { success: true };
  } catch (error) {
    console.error("禁用加密失败:", error);
    return { success: false, error: "禁用加密失败" };
  }
});
electron.ipcMain.handle("get-encryption-status", () => {
  return {
    enabled: settings.enableEncryption,
    unlocked: !!sessionPassword
  };
});
electron.ipcMain.handle("ocr-image", async (_, imageBase64) => {
  try {
    const text = await recognizeText(imageBase64);
    return { success: true, text };
  } catch (error) {
    console.error("OCR failed:", error);
    return { success: false, error: "OCR failed" };
  }
});
