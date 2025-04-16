import { parseMap } from '/hud/gsi/parse-map.js';
import { connectToWebsocket } from '/hud/core/websocket.js';
import { gsiState, additionalState } from '/hud/core/state.js'; // 引入 gsi 相关的状态

export default {
  components: {
    parseMap,
    connectToWebsocket,
  },

  data() {
    return {
      initialTheme: null,
      optionValues: {},
      sections: [],
      currentSection: null,
      nameOverrideMap: {
        Preferences: 'Prefs',
        Teams: 'Teams',
        Players: 'Players',
        Theme: 'Theme',
        Cvars: 'Cvars',
        Displays: 'Displays',
        Title: 'Series Title',
        'Series: Map 1': 'Map1',
        'Series: Map 2': 'Map2',
        'Series: Map 3': 'Map3',
        'Series: Map 4': 'Map4',
        'Series: Map 5': 'Map5',
        // 添加更多的映射关系
      },
      gsiData: null, // 用于存储 gsi 数据
      players: [], // 用于存储玩家信息
      sortDirection: 'asc', // 排序方向：升序或降序
      showRenameDialogFlag: false,
      showHideDialogFlag: false,
      showUnhideDialogFlag: false,
      showPlayerAvatarDialog: false,
      currentEditingSteamID: null,
      currentEditingPlayerName: '',
      newPlayerName: '',
      hiddenPlayers: [], // 用于存储隐藏的玩家信息
      uploadingAvatar: false,
      uploadedAvatar: null,
      lastSection: null, // 用于存储上一个 section
      showMapEditorFlag: false,
      maps: [], // 存储地图数据
      currentEditingMapIndex: null,
      teamInfo: {}, // 用于存储队伍信息
      showTeamEditDialogFlag: false,
      currentEditingTeamName: '',
      newTeamName: '',
      newTeamTag: '',
      currentAvatarSteamID: null,
      avatarFile: null,
      playerAvatars: {}, // 存储后端返回的头像路径
      showUploadDialogFlag: false,
      showPlayerManageDialogFlag: false,
      managePlayerSteamID: null,
      managePlayerName: '',
      managePlayerAvatar: null,
      managePlayerOldName: '',
      managePlayerOldAvatarPath: '',
      managePlayerLoadAvatar: true,
    };
  },

  computed: {
    filteredSections() {
      return this.sections.map((section) => ({
        ...section,
        displayedName: this.nameOverrideMap[section.name] || section.name,
      }));
    },
    hiddenPlayers() {
      const hiddenPlayerSteam64Ids = new Set();
      const opt = this.optionValues['teams.hiddenPlayers']?.trim();
      if (opt && opt.length) {
        const lines = opt.split('\n');
        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (line && /^7656\d+$/.test(line)) {
            hiddenPlayerSteam64Ids.add(line);
          }
        }
      }

      if (!this.gsiData || !this.gsiData.allplayers) return [];

      return Object.entries(this.gsiData.allplayers)
        .filter(([steamID, player]) => hiddenPlayerSteam64Ids.has(steamID))
        .map(([steamID, player]) => ({
          steamID,
          name: player.name,
        }));
    },
  },

  mounted() {
    document.addEventListener('keydown', this.onKeydown);
    this.initOptions();
    this.initGsi(); // 初始化 gsi 数据
  },

  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown);
  },

  methods: {
    showMapEditor() {
      this.showMapEditorFlag = true;
      // 从设置中加载现有地图数据
      this.loadMapData();
    },

    showPlayerManageDialog(steamID, name, avatarPath) {
      this.managePlayerSteamID = steamID;
      this.managePlayerName = name;
      this.managePlayerOldName = name;
      this.managePlayerAvatar = null;
      this.managePlayerOldAvatarPath = avatarPath;
      // 初始化 loadAvatar 状态
      const playerConfig = this.playerAvatars[steamID] || {};
      this.managePlayerLoadAvatar = playerConfig.loadAvatar !== false; // 默认true
      this.showPlayerManageDialogFlag = true;
    },

    cancelPlayerManage() {
      this.showPlayerManageDialogFlag = false;
      this.managePlayerSteamID = null;
      this.managePlayerName = '';
      this.managePlayerAvatar = null;
      this.managePlayerOldName = '';
      this.managePlayerOldAvatarPath = '';
    },
    handleManageAvatarUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.managePlayerAvatar = file;
      }
    },
    async confirmPlayerManage() {
      // 改名
      if (
        this.managePlayerSteamID &&
        this.managePlayerName.trim() &&
        this.managePlayerName !== this.managePlayerOldName
      ) {
        // 复用原有改名逻辑
        const playerNameOverrides =
          this.optionValues['teams.playerNameOverrides'] || '';
        const lines = playerNameOverrides
          .split('\n')
          .filter((line) => line.trim() !== '');
  
        // 移除旧的条目
        const newLines = lines.filter((line) => {
          const segments = line.split(/\s+/);
          return segments[0] !== this.managePlayerSteamID;
        });
  
        // 添加新的条目
        newLines.push(
          `${this.managePlayerSteamID} ${this.managePlayerName.trim()}`
        );
  
        // 更新设置
        this.optionValues['teams.playerNameOverrides'] = newLines.join('\n');
  
        // 保存设置
        await this.save();
      }

      if (this.managePlayerSteamID != null) {
        try {
          await fetch('/config/toggle-avatar-loading', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              steamID: this.managePlayerSteamID,
              loadAvatar: this.managePlayerLoadAvatar,
            }),
          });
        } catch (e) {
          alert('切换头像加载状态失败');
        }
      }
  
      // 上传头像
      if (this.managePlayerAvatar) {
        try {
          const formData = new FormData();
          formData.append('steamID', this.managePlayerSteamID);
          formData.append('avatar', this.managePlayerAvatar);
  
          const response = await fetch('/config/upload-avatar', {
            method: 'POST',
            body: formData
          });
  
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || '上传失败');
          }
  
          const result = await response.json();
          if (!result.success) {
            alert('头像上传失败: ' + (result.message || '未知错误'));
          }
        } catch (error) {
          console.error('上传头像出错:', error);
          alert('上传头像出错: ' + error.message);
        }
      }
  
      // 刷新数据
      await this.fetchPlayerAvatars();
      this.extractPlayerInfo();
      this.cancelPlayerManage();
    },

    // 加载现有地图数据
    loadMapData() {
      // 从 optionValues 中加载地图数据
      const flatMapKeys = Object.keys(this.optionValues).filter((key) =>
        key.startsWith('series.maps.')
      );
      const mapCount =
        Math.max(
          0,
          ...flatMapKeys.map((key) => parseInt(key.split('.')[2], 10))
        ) || 0;

      this.maps = [];
      for (let i = 1; i <= mapCount; i++) {
        const mapName = this.optionValues[`series.maps.${i}.name`] || '';
        if (mapName) {
          // 只加载有名称的地图
          this.maps.push({
            name: mapName,
            pickTeam: this.optionValues[`series.maps.${i}.pickTeam`] || '',
            pickTeamScore:
              this.optionValues[`series.maps.${i}.pickTeamScore`] || '',
            enemyTeamScore:
              this.optionValues[`series.maps.${i}.enemyTeamScore`] || '',
            isDecider: this.optionValues[`series.maps.${i}.isDecider`] || false,
          });
        }
      }
    },

    // 添加新地图
    addMap() {
      this.maps.push({
        name: '',
        pickTeam: '',
        pickTeamScore: '',
        enemyTeamScore: '',
        isDecider: false,
      });
    },

    // 移除地图
    removeMap(index) {
      this.maps.splice(index, 1);
    },

    // 切换 Decider 状态
    toggleIsDecider(index) {
      this.maps[index].isDecider = !this.maps[index].isDecider;
    },

    // 保存地图数据
    async saveMapData() {
      // 将地图数据拆分为单独的键值对
      const flatMapData = {};
      this.maps.forEach((map, index) => {
        const mapIndex = index + 1;
        flatMapData[`series.maps.${mapIndex}.name`] = map.name;
        flatMapData[`series.maps.${mapIndex}.pickTeam`] = map.pickTeam;
        flatMapData[`series.maps.${mapIndex}.isDecider`] = map.isDecider;
        flatMapData[`series.maps.${mapIndex}.pickTeamScore`] =
          map.pickTeamScore;
        flatMapData[`series.maps.${mapIndex}.enemyTeamScore`] =
          map.enemyTeamScore;
      });

      // 更新 optionValues
      Object.assign(this.optionValues, flatMapData);

      // 保存设置
      await this.save();
      this.showMapEditorFlag = false;
    },

    // 取消编辑
    cancelMapEdit() {
      this.showMapEditorFlag = false;
      this.loadMapData(); // 重新加载数据，确保取消编辑时数据不丢失
    },
    async initOptions() {
      const json = await this.fetchOptions();
      this.processSections(json);
      this.initializeOptionValues(json);
      this.setDefaultSection();
      this.loadMapData(); // 加载地图数据
    },

    async fetchOptions() {
      const res = await fetch('/config/options');
      return await res.json();
    },

    processSections(json) {
      this.sections = json.reduce((acc, option) => {
        const section = option.section;
        if (!acc[section]) {
          acc[section] = {
            name: section,
            description: option.sectionDescription,
            options: [],
          };
        }

        // 过滤掉 teams.hiddenPlayers 设置项
        if (
          option.key !== 'teams.hiddenPlayers' &&
          option.key !== 'teams.playerNameOverrides'
        ) {
          acc[section].options.push({
            ...option,
            inputType: this.getInputType(option.type),
            keySegments: option.key.split('.'),
          });
        }

        return acc;
      }, {});
      this.sections = Object.values(this.sections);
    },

    initializeOptionValues(json) {
      const optionValues = {};
      json.forEach((option) => {
        optionValues[option.key] = option.value;
      });
      this.initialTheme = optionValues.theme;
      this.optionValues = optionValues;
    },

    setDefaultSection() {
      const themeSection = this.sections.find(
        (section) => section.name === 'Displays'
      );
      if (themeSection) {
        this.currentSection = themeSection;
      } else if (this.sections.length > 0) {
        this.currentSection = this.sections[0];
      }
    },

    getInputType(type) {
      switch (type) {
        case 'boolean':
          return 'checkbox';
        case 'color':
          return 'color';
        case 'number':
          return 'number';
        case 'text':
          return 'textarea';
        default:
          return 'text';
      }
    },

    onKeydown(e) {
      // on Ctrl+S, save changes
      if (
        e.key.toLowerCase() === 's' &&
        !e.altKey &&
        e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return this.save();
      }
    },

    async save() {
      await fetch('/config/options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.optionValues),
      });

      if (this.optionValues.theme !== this.initialTheme) {
        window.location.reload();
      }
    },

    async forceHudRefresh() {
      await fetch('/config/force-hud-refresh', { method: 'POST' });
    },

    async updateMapData(themeName, flatMapData) {
      try {
        await fetch('/config/options/update-map-data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ themeName, mapData: flatMapData }),
        });
      } catch (error) {
        console.error('Error updating map data:', error);
      }
    },

    openPlayerAvatarDialog(steamID) {
      this.currentAvatarSteamID = steamID;
      this.avatarFile = null;
      this.showPlayerAvatarDialog = true;
    },
  
    // 关闭弹窗
    closePlayerAvatarDialog() {
      this.showPlayerAvatarDialog = false;
      this.currentAvatarSteamID = null;
      this.avatarFile = null;
    },
  
    // 选择文件
    onAvatarFileChange(event) {
      this.avatarFile = event.target.files[0];
    },

    // 初始化 gsi 数据
    initGsi() {
      // 假设 gsi 数据是通过 WebSocket 实时更新的
      const websocket = new WebSocket('ws://localhost:31982'); // 替换为实际的 WebSocket 地址

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === 'state') {
          this.gsiData = data.body.gsiState;
          this.additionalState = data.body.additionalState;

          // 提取玩家信息
          this.extractPlayerInfo();
        }
      };

      websocket.onopen = () => {
        console.log('Connected to WebSocket server');
      };

      websocket.onclose = () => {
        console.log('Disconnected from WebSocket server');
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    },

    async uploadPlayerAvatar() {
      if (!this.avatarFile || !this.currentAvatarSteamID) {
        alert('请选择文件');
        return;
      }
      const formData = new FormData();
      formData.append('steamID', this.currentAvatarSteamID);
      formData.append('avatar', this.avatarFile);
      const res = await fetch('/config/upload-player-avatar', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      if (result.success) {
        alert('上传成功');
        await this.fetchPlayerAvatars(); // 上传后刷新头像数据
        this.closePlayerAvatarDialog();
      } else {
        alert('上传失败: ' + result.message);
      }
    },

    async fetchPlayerAvatars() {
      try {
        const res = await fetch('/config/player-avatars');
        if (!res.ok) {
          this.playerAvatars = {};
          return;
        }
        this.playerAvatars = await res.json();
      } catch (e) {
        this.playerAvatars = {};
        console.error('获取玩家头像数据失败:', e);
      }
    },
    // 提取玩家信息
    async extractPlayerInfo() {
      if (!this.gsiData || !this.gsiData.allplayers) return;
  
      // 确保头像数据已加载
      if (!Object.keys(this.playerAvatars).length) {
        await this.fetchPlayerAvatars();
      }

      this.players = Object.entries(this.gsiData.allplayers).map(
        ([steamID, player]) => {
          const playerConfig = this.playerAvatars[steamID] || {};
          return {
            steamID,
            gameID: player.observer_slot,
            name: player.name,
            team: player.team,
            health: player.state.health,
            money: player.state.money,
            hasAvatar: playerConfig.hasAvatar || false,
            avatarPath: playerConfig.avatarPath || ''
          };
        }
      );

      this.sortPlayersByGameID();
    },

    // 按照“游戏 ID”排序
    sortPlayersByGameID() {
      this.players.sort((a, b) => {
        if (this.sortDirection === 'asc') {
          return a.gameID - b.gameID;
        } else {
          return b.gameID - a.gameID;
        }
      });
    },

    // 切换排序方向
    toggleSortDirection() {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      this.sortPlayersByGameID();
    },

    showRenameDialog(steamID, currentName) {
      this.currentEditingSteamID = steamID;
      this.newPlayerName = currentName;
      this.showRenameDialogFlag = true;
    },

    cancelRename() {
      this.showRenameDialogFlag = false;
      this.currentEditingSteamID = null;
      this.newPlayerName = '';
    },

    async renamePlayer() {
      if (!this.currentEditingSteamID || !this.newPlayerName.trim()) {
        alert('请输入有效的玩家名称');
        return;
      }

      const playerNameOverrides =
        this.optionValues['teams.playerNameOverrides'] || '';
      const lines = playerNameOverrides
        .split('\n')
        .filter((line) => line.trim() !== '');

      // 移除旧的条目
      const newLines = lines.filter((line) => {
        const segments = line.split(/\s+/);
        return segments[0] !== this.currentEditingSteamID;
      });

      // 添加新的条目
      newLines.push(
        `${this.currentEditingSteamID} ${this.newPlayerName.trim()}`
      );

      // 更新设置
      this.optionValues['teams.playerNameOverrides'] = newLines.join('\n');

      // 保存设置
      await this.save();

      // 关闭弹窗
      this.cancelRename();

      // 刷新玩家信息
      this.extractPlayerInfo();
    },

    showHideDialog(steamID, playerName) {
      this.currentEditingSteamID = steamID;
      this.currentEditingPlayerName = playerName;
      this.showHideDialogFlag = true;
    },

    cancelHide() {
      this.showHideDialogFlag = false;
      this.currentEditingSteamID = null;
      this.currentEditingPlayerName = '';
    },

    async hidePlayer() {
      if (!this.currentEditingSteamID) {
        alert('请选择要隐藏的玩家');
        return;
      }

      // 获取当前隐藏玩家的设置
      const hiddenPlayers = this.optionValues['teams.hiddenPlayers'] || '';

      // 将 SteamID 添加到隐藏列表中
      const newHiddenPlayers =
        `${hiddenPlayers}\n${this.currentEditingSteamID}`.trim();

      // 更新设置
      this.optionValues['teams.hiddenPlayers'] = newHiddenPlayers;

      // 保存设置
      await this.save();

      // 关闭弹窗
      this.cancelHide();

      // 刷新玩家信息
      this.extractPlayerInfo();
    },

    showUnhideDialog(steamID, playerName) {
      this.currentEditingSteamID = steamID;
      this.currentEditingPlayerName = playerName;
      this.showUnhideDialogFlag = true;
    },

    cancelUnhide() {
      this.showUnhideDialogFlag = false;
      this.currentEditingSteamID = null;
      this.currentEditingPlayerName = '';
    },

    async unhidePlayer() {
      if (!this.currentEditingSteamID) {
        alert('请选择要取消隐藏的玩家');
        return;
      }

      // 获取当前隐藏玩家的设置
      const hiddenPlayers = this.optionValues['teams.hiddenPlayers'] || '';

      // 将 SteamID 从隐藏列表中移除
      const lines = hiddenPlayers
        .split('\n')
        .filter((line) => line.trim() !== this.currentEditingSteamID);

      // 更新设置
      this.optionValues['teams.hiddenPlayers'] = lines.join('\n');

      // 保存设置
      await this.save();

      // 关闭弹窗
      this.cancelUnhide();

      // 刷新玩家信息
      this.extractPlayerInfo();
    },

    showUploadDialog(steamID, playerName) {
      this.currentEditingSteamID = steamID;
      this.currentEditingPlayerName = playerName;
      this.showUploadDialogFlag = true;
    },

    cancelUpload() {
      this.showUploadDialogFlag = false;
      this.currentEditingSteamID = null;
      this.currentEditingPlayerName = '';
      this.uploadedAvatar = null;
    },

    handleAvatarUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.uploadedAvatar = file;
      }
    },

    async confirmUpload() {
        if (!this.uploadedAvatar) {
            alert('请先选择头像文件');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('steamID', this.currentEditingSteamID);
            formData.append('avatar', this.uploadedAvatar);
            
            const response = await fetch('/config/upload-avatar', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || '上传失败');
            }
            
            const result = await response.json();
            if (result.success) {
                alert('头像上传成功');
                // 上传成功后刷新头像数据
                await this.fetchPlayerAvatars();
                this.extractPlayerInfo();
            } else {
                alert('头像上传失败: ' + (result.message || '未知错误'));
            }
        } catch (error) {
            console.error('上传头像出错:', error);
            alert('上传头像出错: ' + error.message);
        }
        
        this.cancelUpload();
    },

    updatePlayerAvatarConfig(steamID, avatarPath, hasAvatar) {
      // 获取当前配置
      
      // 更新玩家头像配置
      if (!settings.players) {
        settings.players = {};
      }
      
      settings.players[steamID] = {
        ...(settings.players[steamID] || {}),
        name: this.currentEditingPlayerName,
        hasAvatar: hasAvatar,
        avatarPath: avatarPath
      };
    },

    async deletePlayerAvatar(steamID) {
      if (!steamID) return;
      if (!confirm('确定要删除该玩家的头像吗？')) return;
      const res = await fetch(`/config/delete-player-avatar?steamID=${steamID}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        alert('头像已删除');
        await this.fetchPlayerAvatars();
        this.extractPlayerInfo();
      } else {
        alert('删除失败: ' + (result.message || '未知错误'));
      }
    },
  },
};
