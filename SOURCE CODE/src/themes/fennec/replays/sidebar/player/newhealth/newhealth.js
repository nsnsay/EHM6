import Digits from '/hud/digits/digits.vue';
import { positionClass } from '/hud/helpers/position-class.js';
import { teamColorClass } from '/hud/helpers/team-color-class.js';

export default {
  props: ['position', 'player'],

  components: {
    Digits,
  },

  computed: {
    positionClass,

    colorClass() {
      return teamColorClass(this.player.team);
    },
  },
};
