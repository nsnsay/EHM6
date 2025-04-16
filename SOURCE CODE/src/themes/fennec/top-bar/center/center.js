import { seriesMapNumbers } from '/hud/helpers/series-map-numbers.js';
import CurrentMap from '/hud/top-bar/center/current-map/current-map.vue';
import CurrentRound from '/hud/top-bar/center/current-round/current-round.vue';
import Digits from '/hud/digits/digits.vue';
import MapWins from '/hud/top-bar/center/map-wins/map-wins.vue';
import MatchPointRounds from '/hud/top-bar/center/match-point-rounds/match-point-rounds.vue';
import Score from '/hud/top-bar/center/score/score.vue';
import { computed } from 'vue';

export default {
  components: {
    CurrentMap,
    CurrentRound,
    Digits,
    MapWins,
    MatchPointRounds,
    Score,
  },

  computed: {
    formattedMapName() {
      if (!this.$map || !this.$map.name) return ''; // 如果 $map.name 不存在，返回空字符串

      // 去掉前缀 "de_"
      let nameWithoutPrefix = this.$map.name.replace(/^de_/, '');

      // 首字母大写
      return (
        nameWithoutPrefix.charAt(0).toUpperCase() + nameWithoutPrefix.slice(1)
      );
    },
  },

  methods: {
    seriesMapNumbers,
  },
};
