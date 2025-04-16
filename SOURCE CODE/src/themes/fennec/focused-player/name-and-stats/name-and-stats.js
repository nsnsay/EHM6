import { teamColorClass } from '/hud/helpers/team-color-class.js';
import NameRow from '/hud/focused-player/name-and-stats/name-row/name-row.vue';

export default {
  components: {
    NameRow,
  },

  computed: {
    player() {
      return this.$players.focused;
    },

    colorClass() {
      return teamColorClass(this.player.team);
    },
  },
};
