async function fetchPlayerLogosConfig() {
  try {
    const response = await fetch('/custom/player.json');
    const json = await response.json();
    return json;
  } catch (error) {
    console.error('Failed to fetch player logos config:', error);
    return {};
  }
}

// 删除 parsePlayerLogosConfig 函数

import { teamColorClass } from '/hud/helpers/team-color-class.js';
import { positionClass } from '/hud/helpers/position-class.js';
import Digits from '/hud/digits/digits.vue';
import playerAvatars from '/hud/focused-player/name-and-stats/name-row/player-avatars/player-avatars.vue';

export default {
  props: ['position', 'team', 'match'],
  components: {
    Digits,
    playerAvatars,
    positionClass,
  },
  data() {
    return {
      logoImageLoaded: false,
      healthValueOpacity: 1,
      isSwitchingPlayer: false,
      playerLogosConfig: {}, // 存储解析后的配置
    };
  },
  async created() {
    this.playerLogosConfig = await fetchPlayerLogosConfig();
  },
  computed: {
    positionClass,
    player() {
      return this.$players.focused || {};
    },
    iconUrl() {
      if (!this.player.primary) return '';
      return `/hud/img/weapons/${this.player.primary.unprefixedName}.svg`;
    },
    siconUrl() {
      if (!this.player.secondary) return '';
      return `/hud/img/weapons/${this.player.secondary.unprefixedName}.svg`;
    },
    grenades() {
      let foundPerType = {};
      return this.player.grenades.slice(0, 4).map((grenade) => {
        foundPerType[grenade.name] = (foundPerType[grenade.name] || 0) + 1;
        return {
          iconUrl: `/hud/img/weapons/${grenade.unprefixedName}.svg`,
          isActive: grenade.isActive,
          key: `${grenade.name}${foundPerType[grenade.name]}`,
        };
      });
    },
    colorClass() {
      if (!this.player || !this.player.team) return '';
      return teamColorClass(this.player.team);
    },
    weapon() {
      if (!this.player) return null;
      if (this.player.primary?.isActive) return this.player.primary;
      if (this.player.secondary?.isActive) return this.player.secondary;
      return null;
    },
  },
  methods: {
    getAmmoClip() {
      return this.weapon?.ammoClip || '1';
    },
    getAmmoReserve() {
      return this.weapon?.ammoReserve || '0';
    },
    updateHealthValue() {
      this.healthValueOpacity = 0;
      setTimeout(() => {
        this.healthValueOpacity = 1;
      }, 300);
    },
    resetSwitchingPlayer() {
      this.isSwitchingPlayer = false;
    },
    getTeamLogoUrl(team) {
      const teamClass = teamColorClass(team);
      switch (teamClass) {
        case '--t':
          return '/hud/img/icons/Terrorists.png';
        case '--ct':
          return '/hud/img/icons/Counter Terrorists.png';
        default:
          return '/hud/img/icons/unknown.png';
      }
    },
    getCustomPlayerLogo(playerName, steam64Id) {
      const id = steam64Id || (this.player && this.player.steam64Id);
      if (id && this.playerLogosConfig[id]) {
        const info = this.playerLogosConfig[id];
        if (info.loadAvatar && info.avatarPath) {
          return info.avatarPath;
        }
      }
      return this.getTeamLogoUrl(this.player.team);
    },
  },
  watch: {
    player(newPlayer, oldPlayer) {
      if (newPlayer !== oldPlayer) {
        this.isSwitchingPlayer = true;
        setTimeout(() => {
          this.resetSwitchingPlayer();
        }, 50);
      }
    },
    'player.health'(newHealth, oldHealth) {
      if (newHealth !== oldHealth && !this.isSwitchingPlayer) {
        this.updateHealthValue();
      }
    },
  },
};