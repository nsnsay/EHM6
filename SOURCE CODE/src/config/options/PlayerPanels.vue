<template>
  <!-- 玩家信息面板 -->
  <div :class="['playerInfoWrapper']">
    <!-- CT 阵营 -->
    <div>
      <h5 class="team-title">CT</h5>
      <div class="player-cards-row">
        <div
          class="player-card"
          v-for="player in players.filter(p => p.team === 'CT').slice(0, 5)"
          :key="player.steamID"
        >
          <img
            v-if="player.avatarPath"
            :src="player.avatarPath"
            class="player-avatar-large"
            alt="avatar"
          />
          <div v-else class="player-avatar-large avatar-placeholder">
            <span>?</span>
          </div>
          <div class="player-card-info">
            <div class="player-card-steamid">{{ player.steamID }}</div>
            <div class="player-card-name">{{ player.name }}</div>
          </div>
          <div class="player-card-actions">
            <button
              class="player-manage-btn"
              @click="showPlayerManageDialog(player.steamID, player.name, player.avatarPath)"
            >
              Player Manage
            </button>
            <button
              class="player-avatar-delete-btn"
              @click="deletePlayerAvatar(player.steamID)"
              v-if="player.avatarPath"
            >
              删除头像
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- T 阵营 -->
    <div>
      <h5 class="team-title t-side">T</h5>
      <div class="player-cards-row">
        <div
          class="player-card"
          v-for="player in players.filter(p => p.team === 'T').slice(0, 5)"
          :key="player.steamID"
        >
          <img
            v-if="player.avatarPath"
            :src="player.avatarPath"
            class="player-avatar-large"
            alt="avatar"
          />
          <div v-else class="player-avatar-large avatar-placeholder">
            <span>?</span>
          </div>
          <div class="player-card-info">
            <div class="player-card-steamid">{{ player.steamID }}</div>
            <div class="player-card-name">{{ player.name }}</div>
          </div>
          <div class="player-card-actions">
            <button
              class="player-manage-btn"
              @click="showPlayerManageDialog(player.steamID, player.name, player.avatarPath)"
            >
              Player Manage
            </button>
            <button
              class="player-avatar-delete-btn"
              @click="deletePlayerAvatar(player.steamID)"
              v-if="player.avatarPath"
            >
              删除头像
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- 修改玩家名称的弹窗 -->
    <div v-if="showRenameDialogFlag" class="dialog">
      <div class="dialog-content">
        <h3>Player Info Changer</h3>
        <input v-model="newPlayerName" placeholder="New name" />
        <div class="dialog-buttons">
          <!-- 取消和确认修改玩家名称的按钮 -->
          <button @click="cancelRename">Cancel</button>
          <button @click="renamePlayer">Confirm</button>
        </div>
      </div>
    </div>
    <!-- 隐藏玩家的弹窗 -->
    <div v-if="showHideDialogFlag" class="dialog">
      <div class="dialog-content">
        <h3>Confirm hide players</h3>
        <p>Are you sure to hide "{{ currentEditingPlayerName }}"?</p>
        <div class="dialog-buttons">
          <!-- 取消和确认隐藏玩家的按钮 -->
          <button @click="cancelHide">取消</button>
          <button @click="hidePlayer">确认</button>
        </div>
      </div>
    </div>
    <!-- 取消隐藏玩家的弹窗 -->
    <div v-if="showUnhideDialogFlag" class="dialog">
      <div class="dialog-content">
        <h3>Confirm unhide players</h3>
        <p>Are you sure to un-hide "{{ currentEditingPlayerName }}"?</p>
        <div class="dialog-buttons">
          <!-- 取消和确认取消隐藏玩家的按钮 -->
          <button @click="cancelUnhide">Cancel</button>
          <button @click="unhidePlayer">Confirm</button>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showUploadDialogFlag" class="dialog">
  <div class="dialog-content">
    <h3>上传玩家头像</h3>
    <input type="file" @change="handleAvatarUpload" />
    <div class="dialog-buttons">
      <button @click="cancelUpload">取消</button>
      <button @click="confirmUpload">上传</button>
    </div>
  </div>
</div>

<div v-if="showPlayerManageDialogFlag" class="dialog player-manage-dialog">
  <div class="dialog-content">
    <h3>Player Manage</h3>
    <label>玩家名称：</label>
    <input v-model="managePlayerName" placeholder="新名称" />
    <label>上传头像：</label>
    <input type="file" @change="handleManageAvatarUpload" />
    <label>
      <input type="checkbox" v-model="managePlayerLoadAvatar" />
      启用自定义头像（loadAvatar）
    </label>
    <div class="dialog-buttons">
      <button @click="cancelPlayerManage">取消</button>
      <button @click="confirmPlayerManage">确认</button>
    </div>
  </div>
    </div>
</template>

<script>
import options from '/config/options/options.js';

export default {
  ...options
};
</script>

<style scoped>
@import '/config/options/options.css';
</style>