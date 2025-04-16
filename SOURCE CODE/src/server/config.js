import send from 'koa-send';
import { initSettings, getSettings, updateMapData } from './settings.js';
import { readJson, writeJson } from './helpers/json-file.js';
import { builtinRootDirectory, userspaceSettingsPath } from './helpers/paths.js';
import path from 'path';
import fs from 'fs-extra';
import multer from '@koa/multer';
import os from 'os';
import bodyParser from 'koa-bodyparser';

// 配置 multer
const upload = multer({
  dest: path.join(os.homedir(), 'AppData', 'Roaming', 'EideticHM', 'player-avatars'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 限制文件大小为5MB
});


// 新增 player.json 路径
const playerJsonPath = path.join(os.homedir(), 'AppData', 'Roaming', 'EideticHM', 'player.json');
console.log('playerJsonPath:', playerJsonPath); // 加这一行

// 读取 player.json
const readPlayerJson = async () => {
  try {
    // 如果文件不存在，自动创建一个空对象
    if (!(await fs.pathExists(playerJsonPath))) {
      console.log('player.json 不存在，自动创建空对象');
      await fs.writeJson(playerJsonPath, {}, { spaces: 2 });
    }
    return await fs.readJson(playerJsonPath);
  } catch (e) {
    console.error('readPlayerJson error:', e);
    return {};
  }
};

// 写入 player.json
const writePlayerJson = async (data) => {
  await fs.writeJson(playerJsonPath, data, { spaces: 2 });
};

export const registerConfigRoutes = (router, websocket) => {
  // 使用 bodyParser 中间件解析请求体
  router.use(bodyParser());

  router.get('/', (context) => {
    context.status = 302;
    context.redirect('/config');
  });

  router.get('/config/player-avatars', async (ctx) => {
    ctx.body = await readPlayerJson();
  });

  router.get('/config/options', async (context) => {
    const { settings } = await getSettings().catch((err) => {
      console.error('Error getting settings', err);
      return { settings: { options: {} } };
    });

    context.body = [
      {
        fallback: 'fennec',
        key: 'theme',
        section: 'Theme',
        type: 'string',
        value: settings.parent,
      },

      ...Object.entries(settings.options).map(([key, data]) => ({
        ...data,
        key,
        sectionDescription: settings.optionSectionDescriptions?.[data.section],
      })),
    ];
  });

  router.put('/config/options/update-map-data', async (context) => {
    const { themeName, mapData } = context.request.body;

    if (!themeName || !mapData) {
      context.status = 400;
      return;
    }

    try {
      await updateMapData(themeName, mapData);
      context.status = 204;
    } catch (error) {
      console.error('Error updating map data', error);
      context.status = 500;
    }
  });

  router.put('/config/toggle-avatar-loading', async (ctx) => {
    const { steamID, loadAvatar } = ctx.request.body;

    if (!steamID) {
      ctx.status = 400;
      ctx.body = JSON.stringify({
        success: false,
        message: 'SteamID 不可为空',
      });
      return;
    }

    try {
      const steamIDStr = String(steamID);
      const playerData = await readPlayerJson();
      // 打印调试
      console.log('playerData keys:', Object.keys(playerData));
      console.log('steamIDStr:', steamIDStr);
      if (!playerData[steamIDStr]) {
        ctx.status = 404;
        ctx.body = JSON.stringify({
          success: false,
          message: '未找到该玩家',
        });
        return;
      }
      playerData[steamIDStr].loadAvatar = loadAvatar;
      await writePlayerJson(playerData);

      ctx.body = JSON.stringify({
        success: true,
      });
    } catch (error) {
      ctx.status = 500;
      ctx.body = JSON.stringify({
        success: false,
        message: error.message,
      });
    }
  });

  router.put('/config/options', async (context) => {
    const settings = await readJson(userspaceSettingsPath);

    if (!settings.options) settings.options = {};

    let wasThemeChanged = false;

    for (const [key, value] of Object.entries(context.request.body)) {
      if (key === 'theme') {
        wasThemeChanged = settings.parent !== (value || 'fennec');
        settings.parent = value || 'fennec';
      } else if (value != null) {
        if (!settings.options[key]) settings.options[key] = {};
        settings.options[key].value = value;
      } else if (settings.options[key]) {
        delete settings.options[key].value;
      }
    }

    await writeJson(userspaceSettingsPath, settings);
    await websocket.updateCaches();

    if (wasThemeChanged) websocket.broadcastRefresh();

    context.status = 204;
  });

  router.post('/config/force-hud-refresh', async (context) => {
    websocket.broadcastRefresh();
    context.status = 204;
  });

  router.put('/config/options/rename-player', async (context) => {
    const { steamID, newName } = context.request.body;

    if (!steamID || !newName) {
      context.status = 400;
      return;
    }

    try {
      await updatePlayerNameOverrides(steamID, newName);
      context.status = 204;
    } catch (error) {
      console.error('Error updating player name overrides', error);
      context.status = 500;
    }
  });

  // 添加头像上传路由
  router.post('/config/upload-avatar', upload.single('avatar'), async (ctx) => {
    const file = ctx.request.file;
    const steamID = ctx.request.body.steamID;
    if (!file || !steamID) {
      ctx.status = 400;
      ctx.body = JSON.stringify({
        success: false,
        message: '缺少文件或SteamID',
      });
      return;
    }

    try {
      // 确保 avatars 目录存在
      const avatarsDir = path.join(os.homedir(), 'AppData', 'Roaming', 'EideticHM', 'player-avatars');
      await fs.ensureDir(avatarsDir);

      // 保存文件
      const ext = path.extname(file.originalname);
      const filename = `${steamID}${ext}`;
      const filePath = path.join(avatarsDir, filename);
      await fs.move(file.path, filePath, { overwrite: true });

      // 只更新 player.json
      const playerData = await readPlayerJson();
      playerData[steamID] = {
        hasAvatar: true,
        avatarPath: `/custom/player-avatars/${filename}`,
        loadAvatar: true
      };
      await writePlayerJson(playerData);

      ctx.body = JSON.stringify({
        success: true,
        filePath: `/custom/player-avatars/${filename}`,
      });
    } catch (error) {
      ctx.status = 500;
      ctx.body = JSON.stringify({
        success: false,
        message: error.message,
      });
    }
  });

  // 上传玩家头像并保存到 player.json
  router.post('/config/upload-player-avatar', upload.single('avatar'), async (ctx) => {
    const file = ctx.request.file;
    const steamID = ctx.request.body.steamID;
    if (!file || !steamID) {
      ctx.status = 400;
      ctx.body = { success: false, message: '缺少文件或SteamID' };
      return;
    }

    try {
      const avatarsDir = path.join(os.homedir(), 'AppData', 'Roaming', 'EideticHM', 'player-avatars');
      await fs.ensureDir(avatarsDir);
      const ext = path.extname(file.originalname);
      const filename = `${steamID}${ext}`;
      const filePath = path.join(avatarsDir, filename);
      await fs.move(file.path, filePath, { overwrite: true });

      // 更新 player.json
      const playerData = await readPlayerJson();
      playerData[steamID] = { avatarPath: `/custom/player-avatars/${filename}` };
      await writePlayerJson(playerData);

      ctx.body = { success: true, filePath: `/custom/player-avatars/${filename}` };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { success: false, message: error.message };
    }
  });

  // 获取所有玩家头像配置

  // 新增删除玩家头像接口
  router.delete('/config/delete-player-avatar', async (ctx) => {
    // 支持 query 方式获取 steamID
    const steamID = ctx.query.steamID;
    if (!steamID) {
      ctx.status = 400;
      ctx.body = { success: false, message: '缺少SteamID' };
      return;
    }
    try {
      // 读取 player.json
      const playerData = await readPlayerJson();
      const avatarPath = playerData[steamID]?.avatarPath;
      if (avatarPath) {
        // 删除头像文件
        const absPath = path.join(os.homedir(), 'AppData', 'Roaming', 'EideticHM', avatarPath.replace('/custom/', ''));
        if (await fs.pathExists(absPath)) {
          await fs.remove(absPath);
        }
      }
      // 删除 player.json 中该玩家配置
      delete playerData[steamID];
      await writePlayerJson(playerData);
  
      // 也可以同步 theme.json 里的 players 字段（如有需要）
      // const themePath = path.join(...); // theme.json 路径
      // const theme = await fs.readJson(themePath);
      // if (theme.players && theme.players[steamID]) {
      //   delete theme.players[steamID];
      //   await fs.writeJson(themePath, theme, { spaces: 2 });
      // }
  
      ctx.body = { success: true };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { success: false, message: error.message };
    }
  });

  router.get('/config{*path}', async (context) => {
    await send(context, context.params.path?.trim() || 'index.html', {
      root: `${builtinRootDirectory}/src/config/`,
    });
  });
};