import { positionClass } from '/hud/helpers/position-class.js';
import { teamColorClass } from '/hud/helpers/team-color-class.js';
import Digits from '/hud/digits/digits.vue';

export default {
  components: {
    Digits,
    positionClass,
    teamColorClass,
  },
  props: ['position', 'team'],
  computed: {
    positionClass,
    isBombActive() {
      return this.player?.bomb?.isActive;
    },
    player() {
      return this.$players.focused || {}; // 确保 player 至少是一个空对象
    },
    colorClass() {
      return teamColorClass(this.player.team);
    },
    grenades() {
      let foundPerType = {};

      // 限制最多显示4个grenade
      return this.player.grenades.slice(0, 4).map((grenade) => {
        foundPerType[grenade.name] = (foundPerType[grenade.name] || 0) + 1;

        return {
          iconUrl: `/hud/img/weapons/${grenade.unprefixedName}.svg`,
          isActive: grenade.isActive,
          key: `${grenade.name}${foundPerType[grenade.name]}`,
        };
      });
    },
  },
  methods: {},
};
