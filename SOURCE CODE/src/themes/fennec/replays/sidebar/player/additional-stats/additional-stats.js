import { positionClass } from '/hud/helpers/position-class.js';
import { teamColorClass } from '/hud/helpers/team-color-class.js';
import Adr from '/hud/replays/sidebar/player/additional-stats/adr/adr.vue';
import Assists from '/hud/replays/sidebar/player/additional-stats/assists/assists.vue';
import Deaths from '/hud/replays/sidebar/player/additional-stats/deaths/deaths.vue';
import Kills from '/hud/replays/sidebar/player/additional-stats/kills/kills.vue';

export default {
  props: ['position', 'player'],

  components: {
    Adr,
    Assists,
    Deaths,
    Kills,
  },
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
