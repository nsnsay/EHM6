import { mkdir } from 'fs/promises';

import { merge } from 'lodash-es';

import {
  builtinThemesDirectory,
  customThemesDirectory,
  userspaceBombsitesPath,
  userspaceDirectory,
  userspaceRadarsPath,
  userspaceSettingsPath,
} from './helpers/paths.js';
import { fileExists } from './helpers/file-exists.js';
import { readJson, readJsonIfExists, writeJson } from './helpers/json-file.js';

export const initSettings = async () => {
  if (await fileExists(userspaceSettingsPath)) return;

  await mkdir(userspaceDirectory, { recursive: true });

  await writeJson(userspaceSettingsPath, {
    parent: 'fennec',
  });
};

export const getSettings = async () => {
  const themeTree = ['userspace'];

  const bombsiteObjects = [await readJsonIfExists(userspaceBombsitesPath)];
  const radarObjects = [await readJsonIfExists(userspaceRadarsPath)];
  const settingsObjects = [await readJson(userspaceSettingsPath)];

  while (settingsObjects[settingsObjects.length - 1].parent) {
    const parent = settingsObjects[settingsObjects.length - 1].parent;
    themeTree.push(parent);

    if (await fileExists(`${customThemesDirectory}/${parent}/theme.json`)) {
      settingsObjects.push(
        await readJson(`${customThemesDirectory}/${parent}/theme.json`)
      );
    } else if (
      await fileExists(`${builtinThemesDirectory}/${parent}/theme.json`)
    ) {
      settingsObjects.push(
        await readJson(`${builtinThemesDirectory}/${parent}/theme.json`)
      );
    } else {
      throw new Error(
        `Theme "${parent}" not found. Please change the "theme" value in cs-hud/userspace/theme.json.`
      );
    }

    if (await fileExists(`${customThemesDirectory}/${parent}/bombsites.json`)) {
      bombsiteObjects.push(
        await readJson(`${customThemesDirectory}/${parent}/bombsites.json`)
      );
    } else if (
      await fileExists(`${builtinThemesDirectory}/${parent}/bombsites.json`)
    ) {
      bombsiteObjects.push(
        await readJson(`${builtinThemesDirectory}/${parent}/bombsites.json`)
      );
    }

    if (await fileExists(`${customThemesDirectory}/${parent}/radars.json`)) {
      radarObjects.push(
        await readJson(`${customThemesDirectory}/${parent}/radars.json`)
      );
    } else if (
      await fileExists(`${builtinThemesDirectory}/${parent}/radars.json`)
    ) {
      radarObjects.push(
        await readJson(`${builtinThemesDirectory}/${parent}/radars.json`)
      );
    }
  }

  return {
    themeTree,

    bombsites: merge({}, ...bombsiteObjects.reverse()),
    radars: merge({}, ...radarObjects.reverse()),
    settings: merge({}, ...settingsObjects.reverse()),
  };
};

export const getThemeTree = async (firstTheme = 'userspace') => {
  const themeTree = [firstTheme];

  // Make sure we don't end up in this loop forever
  for (let i = 0; i < 16; i++) {
    let settingsObject;

    if (
      await fileExists(
        `${customThemesDirectory}/${themeTree[themeTree.length - 1]}/theme.json`
      )
    ) {
      settingsObject = await readJson(
        `${customThemesDirectory}/${themeTree[themeTree.length - 1]}/theme.json`
      );
    } else if (
      await fileExists(
        `${builtinThemesDirectory}/${themeTree[themeTree.length - 1]}/theme.json`
      )
    ) {
      settingsObject = await readJson(
        `${builtinThemesDirectory}/${themeTree[themeTree.length - 1]}/theme.json`
      );
    } else {
      throw new Error(`Theme "${firstTheme}" not found`);
    }

    if (!settingsObject?.parent) return themeTree;

    themeTree.push(settingsObject.parent);
  }

  return themeTree;
};

export const updatePlayerNameOverrides = async (steamID, newName) => {
  const settings = await readJson(userspaceSettingsPath);

  let playerNameOverrides =
    settings.options['teams.playerNameOverrides']?.value || '';
  const lines = playerNameOverrides
    .split('\n')
    .filter((line) => line.trim() !== '');

  // Remove old entry
  const newLines = lines.filter((line) => {
    const segments = line.split(/\s+/);
    return segments[0] !== steamID;
  });

  // Add new entry
  newLines.push(`${steamID} ${newName}`);

  // Update settings
  settings.options['teams.playerNameOverrides'] = {
    value: newLines.join('\n'),
  };

  // Save settings
  await writeJson(userspaceSettingsPath, settings);

  return settings;
};

export const updateMapData = async (themeName, mapData) => {
  // 获取主题路径
  const themePath = await getThemePath(themeName);
  const themeJsonPath = `${themePath}/theme.json`;

  if (!(await fileExists(themeJsonPath))) {
    throw new Error(`Theme file not found: ${themeJsonPath}`);
  }

  // 读取现有的主题 JSON
  const themeJson = await readJson(themeJsonPath);

  // 拆分 series.maps 为单独的键值对
  const seriesMaps = {};
  mapData.forEach((map, index) => {
    const mapIndex = index + 1; // 使用 1 作为起始索引
    seriesMaps[`series.maps.${mapIndex}.name`] = { value: map.name };
    seriesMaps[`series.maps.${mapIndex}.pickTeam`] = { value: map.pickTeam };
    seriesMaps[`series.maps.${mapIndex}.isDecider`] = { value: map.isDecider };
    seriesMaps[`series.maps.${mapIndex}.pickTeamScore`] = {
      value: map.pickTeamScore,
    };
    seriesMaps[`series.maps.${mapIndex}.enemyTeamScore`] = {
      value: map.enemyTeamScore,
    };
  });

  // 更新主题 JSON
  Object.assign(themeJson.options, seriesMaps);

  // 写回主题 JSON
  await writeJson(themeJsonPath, themeJson);

  return themeJson;
};

// 辅助方法：获取主题路径
const getThemePath = async (themeName) => {
  if (await fileExists(`${customThemesDirectory}/${themeName}`)) {
    return `${customThemesDirectory}/${themeName}`;
  } else if (await fileExists(`${builtinThemesDirectory}/${themeName}`)) {
    return `${builtinThemesDirectory}/${themeName}`;
  } else {
    throw new Error(`Theme "${themeName}" not found`);
  }
};
