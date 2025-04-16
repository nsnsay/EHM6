const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const os = require('os');
const WebSocket = require('ws');

let win;
let overlayWin = null;
let overlayClients = [];

function createWindow() {
  win = new BrowserWindow({
    width: 1800,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    frame: false,
  });

  win.loadURL('http://127.0.0.1:31982/config');

  // 新增：主窗口关闭时退出整个 Node 进程
  win.on('closed', () => {
    process.exit(0); // 安全退出整个进程
  });
}

// 新建 WebSocket 服务端，监听 31983 端口
function setupWebSocketServer() {
  const wss = new WebSocket.Server({ port: 31983 });
  wss.on('connection', (ws) => {
    overlayClients.push(ws);

    ws.on('close', () => {
      overlayClients = overlayClients.filter(client => client !== ws);
    });

    ws.on('message', (message) => {
      switch (message.toString()) {
        case 'window-minimize':
          if (win) win.minimize();
          break;
        case 'window-maximize':
          if (win) {
            if (win.isMaximized()) {
              win.unmaximize();
            } else {
              win.maximize();
            }
          }
          break;
        case 'window-close':
          if (win) win.close();
          break;
        case 'open-transparent-hud': {
          if (!overlayWin) {
            overlayWin = new BrowserWindow({
              alwaysOnTop: true,
              transparent: true,
              frame: false,
              fullscreen: true,
              webSecurity: false,
            });
            overlayWin.setIgnoreMouseEvents(true);
            const host = process.env.HOST || 'localhost';
            const port = process.env.PORT || 31982;
            overlayWin.loadURL(`http://${host}:${port}/hud/index.html?transparent&corners`);
            overlayWin.on('closed', () => {
              overlayWin = null;
              // 通知所有前端 overlay 已关闭
              overlayClients.forEach(client => {
                if (client.readyState === 1) client.send('overlay-closed');
              });
            });
            // 通知所有前端 overlay 已打开
            overlayClients.forEach(client => {
              if (client.readyState === 1) client.send('overlay-opened');
            });
          }
          break;
        }
        case 'close-transparent-hud': {
          if (overlayWin) {
            overlayWin.close();
            // overlayWin = null; // on('closed') 里已处理
          }
          break;
        }
        case 'open-team-logos-folder': {
          // 获取 %appdata%/EideticHM/team-logos 路径
          const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming');
          const teamLogosPath = path.join(appDataPath, 'EideticHM', 'team-logos');
          shell.openPath(teamLogosPath);
          break;
        }
        default:
          break;
      }
    });

    // 新连接时主动同步当前overlay状态
    if (overlayWin) {
      ws.send('overlay-opened');
    } else {
      ws.send('overlay-closed');
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  setupWebSocketServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});