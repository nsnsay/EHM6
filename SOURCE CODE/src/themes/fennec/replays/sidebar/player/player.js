/* player.js */
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

import { positionClass } from '/hud/helpers/position-class.js';
import { teamColorClass } from '/hud/helpers/team-color-class.js';
import newmoney from '/hud/replays/sidebar/player/newmoney/newmoney.vue';
import Primary from '/hud/replays/sidebar/player/primary/primary.vue';
import newkd from '/hud/replays/sidebar/player/newkd/newkd.vue';
import newhealth from '/hud/replays/sidebar/player/newhealth/newhealth.vue';
import newname from '/hud/replays/sidebar/player/newname/newname.vue';
import healthbar from '/hud/replays/sidebar/player/health-bar/health-bar.vue';

export default {
  props: ['position', 'player'],

  components: {
    newmoney,
    Primary,
    newkd,
    newhealth,
    newname,
    healthbar,
  },

  data() {
    return {
      logoImageLoaded: false,
      defaultLogoUrl: '/hud/player-logos/player.webp',
      lastHealth: null, // 记录上次的血量
      totalDamage: 0, // 累计的伤害值
      showDamage: false, // 是否显示伤害值
      damageTimeout: null, // 定时器
      playerLogosConfig: {}, // 存储解析后的配置
    };
  },

  computed: {
    positionClass,
    colorClass() {
      return teamColorClass(this.player.team);
    },
    isLastManStanding() {
      return this.leftTeamAlive === 1 && this.rightTeamAlive === 1;
    },
    leftTeamAlive() {
      return this.countAlivePlayers(this.$teams[0]);
    },
    rightTeamAlive() {
      return this.countAlivePlayers(this.$teams[1]);
    },
    grenades() {
      let foundPerType = {};

      return this.player.grenades.map((grenade) => {
        foundPerType[grenade.name] = (foundPerType[grenade.name] || 0) + 1;

        return {
          iconUrl: `/hud/img/weapons/${grenade.unprefixedName}.svg`,
          isActive: grenade.isActive,
          key: `${grenade.name}${foundPerType[grenade.name]}`,
        };
      });
    },
    isBombActive() {
      return !!this.player?.bomb?.isActive;
    },
  },

  methods: {
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
        // 只有 loadAvatar 为 true 且有 avatarPath 才加载自定义头像
        if (info.loadAvatar && info.avatarPath) {
          return info.avatarPath;
        }
      }
      // 否则返回默认阵营图片
      return this.getTeamLogoUrl(this.player.team);
    },

    handleImageError(event) {
      event.target.src = this.defaultLogoUrl;
      this.logoImageLoaded = true;
    },

    countAlivePlayers(team) {
      let alive = 0;

      for (const player of team.players) {
        if (player.isAlive) alive++;
      }

      return alive;
    },

    calculateDamage(newHealth, oldHealth) {
      if (this.lastHealth === null) {
        this.lastHealth = newHealth;
        return;
      }

      if (newHealth < oldHealth) {
        const damage = oldHealth - newHealth;
        this.totalDamage += damage;
        this.lastHealth = newHealth;

        if (!this.showDamage) {
          this.showDamage = true;
        }

        clearTimeout(this.damageTimeout);
        this.damageTimeout = setTimeout(() => {
          this.resetDamage();
        }, 3000);
      }
    },

    resetDamage() {
      this.totalDamage = 0;
      this.showDamage = false;
    },
  },

  watch: {
    'player.health'(newHealth, oldHealth) {
      this.calculateDamage(newHealth, oldHealth);
    },
  },

  async created() {
    this.playerLogosConfig = await fetchPlayerLogosConfig();
    this.lastHealth = this.player.health;
  },
};