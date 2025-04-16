import { positionClass } from '/hud/helpers/position-class.js';
import Armor from '/hud/replays/sidebar/player/equipment/armor/armor.vue';
import BombOrDefuser from '/hud/replays/sidebar/player/equipment/bomb-or-defuser/bomb-or-defuser.vue';

export default {
  props: ['position', 'player'],

  components: {
    Armor,
    BombOrDefuser,
  },

  computed: {
    positionClass,
  },
};
