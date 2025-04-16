// src/server/index.js
import http from 'http';
import bodyParser from 'koa-bodyparser';
import Koa from 'koa';
import KoaRouter from 'koa-router';
import KoaCompress from 'koa-compress';
import pc from 'picocolors';
import fs from 'fs';
import path from 'path';
import os from 'os';

// 引入项目中的其他模块
import { initSettings, getSettings } from './settings.js';
import { registerConfigRoutes } from './config.js';
import { registerDependencyRoutes } from './dependencies.js';
import { registerGsiRoutes } from './gsi.js';
import { registerHudRoutes } from './hud.js';
import { registerLicensesRoutes } from './licenses.js';
import { registerRadarRoutes } from './radar.js';
import { registerVersionRoutes } from './version.js';
import { Websocket } from './websocket.js';
import { registerCustomRoutes } from './hud.js';

Error.stackTraceLimit = 64;

const run = async () => {
  // 创建项目专属文件夹
  const projectFolderPath = createProjectFolder();

  await initSettings();
  const { settings } = await getSettings();

  const host = process.env.HOST || settings.host || '0.0.0.0';
  const port = process.env.PORT || settings.port || 31982;

  const app = new Koa();
  const server = http.createServer(app.callback());

  app.use(KoaCompress());

  app.use(
    bodyParser({
      strict: true,
      enableTypes: ['json'],
    })
  );

  const websocket = new Websocket(server);

  // register routes
  const router = new KoaRouter();
  registerConfigRoutes(router, websocket);
  registerDependencyRoutes(router);
  registerGsiRoutes(router, websocket);
  registerHudRoutes(router);
  registerLicensesRoutes(router);
  registerRadarRoutes(router);
  registerVersionRoutes(router);
  registerCustomRoutes(router);

  // start server
  app.use(router.routes());
  app.use(router.allowedMethods());

  server.listen(port, host, () => {
    console.info(pc.bold(pc.white(`----------------------------------------`)));
    console.info(
      pc.bold(pc.yellow(`|  HUD Control Panel -> . http://127.0.0.1:${port}`))
    );
    console.info(
      pc.bold(
        pc.green(
          `|  OBS Capture URL -> . http://127.0.0.1:${port}/hud/index.html?transparent?corner`
        )
      )
    );
    console.info(pc.bold(pc.white(`----------------------------------------`)));
    console.info(
      pc.bold(
        pc.blue(
          `Now you can put team avatars / player avatars to -> ${projectFolderPath}`
        )
      )
    );
    console.info(
      pc.bold(
        pc.blue(`The images type must be .png, Name rule :"{Team Name}.png" `)
      )
    );
    console.info(pc.bold(pc.white(`----------------------------------------`)));
    console.info(
      pc.bold(
        pc.white(
          `Currently using the custom radars, Any bug seeks please report at Github!`
        )
      )
    );
    console.info(pc.bold(pc.white(`---------------Log Output---------------`)));
  });
};

// 处理文件读写
const readFile = (filename) => {
  const filePath = path.join(projectFolderPath, filename);
  return fs.promises.readFile(filePath, 'utf8');
};

const writeFile = (filename, data) => {
  const filePath = path.join(projectFolderPath, filename);
  return fs.promises.writeFile(filePath, data, 'utf8');
};


process.on('uncaughtException', (error) => {
  // 忽略所有未处理的异常
  console.log('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  // 忽略所有未处理的 promise rejection
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

const createProjectFolder = () => {
  // 获取用户的应用数据目录（%AppData%）
  const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming');
  // 创建项目专属文件夹
  const projectFolderPath = path.join(appDataPath, 'EideticHM');

  // 确保文件夹存在
  if (!fs.existsSync(projectFolderPath)) {
    fs.mkdirSync(projectFolderPath, { recursive: true });
  }

  // 创建 team-logos 和 player-logos 文件夹
  const teamLogosPath = path.join(projectFolderPath, 'team-logos');
  const playerLogosPath = path.join(projectFolderPath, 'player-logos');

  try {
    if (!fs.existsSync(teamLogosPath)) {
      fs.mkdirSync(teamLogosPath, { recursive: true });
      console.log(``);
    } else {
      console.log(``);
    }

    if (!fs.existsSync(playerLogosPath)) {
      fs.mkdirSync(playerLogosPath, { recursive: true });
      console.log(``);
    } else {
      console.log(``);
    }
  } catch (error) {
    console.error('创建文件夹失败:', error);
  }

  return projectFolderPath;
};

// 启动 Electron 应用
run().then(async () => {
  // 动态导入 electron-main.cjs
  await import('./electron-main.cjs');
});