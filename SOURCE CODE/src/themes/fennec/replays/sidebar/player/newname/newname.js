import { positionClass } from '/hud/helpers/position-class.js';
import { teamColorClass } from '/hud/helpers/team-color-class.js';

export default {
  props: ['position', 'team', 'match', 'player'],

  data() {
    return {
      logoImageLoaded: false,
    };
  },

  computed: {
    positionClass,

    colorClass() {
      return teamColorClass(this.team);
    },

    shortName() {
      if (!this.player.name) return ''; // 如果 name 不存在，返回空字符串
      return this.player.name.substring(0, 11); // 截取前11个字符
    },
  },
};
