import { positionClass } from '/hud/helpers/position-class.js';
import { teamColorClass } from '/hud/helpers/team-color-class.js';

export default {
  props: ['position', 'team', 'match'],

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
    
    isRoundWinnerPanelActive() {
      if (this.$round.phase === 'over') {
        return this.$round.winningSide === this.team.side;
      }
    
      if (this.$round.isFreezetime) {
        return false;
      }
    
      return false;
    },
  },
};