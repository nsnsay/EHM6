import { positionClass } from '/hud/helpers/position-class.js';

export default {
  props: ['position', 'player'],

  computed: {
    positionClass,

    iconUrl() {
      if (!this.player.primary) return ''; // 检查 player.primary 是否存在
      return `/hud/img/weapons/${this.player.primary.unprefixedName}.svg`;
    },

    siconUrl() {
      if (!this.player.secondary) return ''; // 检查 player.secondary 是否存在
      return `/hud/img/weapons/${this.player.secondary.unprefixedName}.svg`;
    },
  },
};
