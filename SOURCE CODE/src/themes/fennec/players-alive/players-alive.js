import { teamColorClass } from '/hud/helpers/team-color-class.js';

export default {
  computed: {
    isActive() {
      if (this.$opts['preferences.playersAlive.showDuringFreezetime']) {
        return true;
      }

      return !this.$round.isFreezetime;
    },

    leftTeamAlive() {
      return this.countAlivePlayers(this.$teams[0]);
    },

    rightTeamAlive() {
      return this.countAlivePlayers(this.$teams[1]);
    },

    leftTeamColorClass() {
      return teamColorClass(this.$teams[0]);
    },

    rightTeamColorClass() {
      return teamColorClass(this.$teams[1]);
    },

    liveTitle() {
      // 新增计算属性，动态生成标题
      const left = this.leftTeamAlive;
      const right = this.rightTeamAlive;
      if (left === 1 || right === 1) {
        return 'Clutch Versus';
      } else {
        return 'Players Alive';
      }
    },
  },

  methods: {
    countAlivePlayers(team) {
      let alive = 0;

      for (const player of team.players) {
        if (player.isAlive) alive++;
      }

      return alive;
    },
  },
};
