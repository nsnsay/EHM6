import bolt from '/hud/radars/bolt/bolt.vue';

export default {
  components: {
    bolt,
  },
  data() {
    return {
      logoImageLoaded: false,
    };
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
};
