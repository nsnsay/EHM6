import { positionClass } from '/hud/helpers/position-class.js';
import { teamColorClass } from '/hud/helpers/team-color-class.js';

export default {
  props: ['position', 'player'],
  colorClass() {
    if (!this.player || !this.player.team) return ''; // 防止 player.team 未定义
    return teamColorClass(this.player.team);
  },

  computed: {
    positionClass,

    isActive() {
      // TODO configurable: hide this entirely
      return this.$round.isFreezetime;
    },
  },
};
