import { positionClass } from '/hud/helpers/position-class.js';
import { teamColorClass } from '/hud/helpers/team-color-class.js';
import MapWins from '/hud/top-bar/center/map-wins/map-wins.vue';

export default {
  props: ['position', 'team'],

  components: {
    MapWins,
  },

  computed: {
    positionClass,

    colorClass() {
      return teamColorClass(this.team);
    },
  },
};
