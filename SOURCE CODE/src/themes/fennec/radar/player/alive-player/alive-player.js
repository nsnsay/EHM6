import { getLevel, levels } from '/hud/radar/helpers/radar-levels.js';
import { offsetX, offsetY } from '/hud/radar/helpers/radar-offset.js';
import { radarConfig } from '/hud/radar/helpers/radar-config.js';
import { teamColorClass } from '/hud/helpers/team-color-class.js';
import { vectorDistance } from '/hud/helpers/vector-distance.js';

export default {
  data() {
    return {
      previousPositionsAndAngles: [],
      lastUpdateTime: 0,
    };
  },

  props: ['player'],

  computed: {
    levels,
    radarConfig: radarConfig, // 确保 radarConfig 被正确绑定到 Vue 组件的上下文

    colorClass() {
      return teamColorClass(this.player.team);
    },

    coordinates() {
      const angle = this.getAngle();
      this.rememberPositionAndAngle(angle);

      const [x, y, z, a] = this.averagePreviousPositionsAndAngles();

      // 动态调整 y 坐标，当地图是 'nuke' 且玩家高度低于 AltitudeMin 时向下偏移 100px
      const offsetYValue = this.offsetY(y);
      const adjustedY = this.isBelowAltitudeMin && this.$map.sanitizedName === 'de_nuke'
        ? offsetYValue + 46.67
        : offsetYValue;

      return {
        z: parseFloat(z.toFixed(7)), // 保留7位小数
        angle: a,
        x: parseFloat(this.offsetX(x).toFixed(7)), // 保留7位小数
        y: parseFloat(adjustedY.toFixed(7)), // 保留7位小数
      };
    },

    level() {
      return this.getLevel(this.coordinates.z);
    },

    zIndex() {
      if (this.player.isFocused) return 8000000;
      return 1000000 + Math.round(this.coordinates.z);
    },

    // 新增计算属性，判断玩家高度是否低于 AltitudeMin
    isBelowAltitudeMin() {
      const radarConfig = this.radarConfig;
      if (!radarConfig || !radarConfig.verticalsections) return false;

      const AltitudeMin = Object.values(radarConfig.verticalsections)[0]?.AltitudeMin || 0;
      return this.coordinates.z < AltitudeMin;
    },
  },

  methods: {
    getLevel,
    offsetX,
    offsetY,

    getAngle() {
      const [x, y] = this.player.forward;

      const radians = Math.atan2(x, y);
      const degrees = (180 * radians) / Math.PI;

      return (360 + Math.round(degrees)) % 360;
    },

    averagePreviousPositionsAndAngles() {
      let sumX = 0;
      let sumY = 0;
      let sumZ = 0;
      let sumA = 0;

      let anglesBetween0And90 = 0;
      let anglesBetween270And360 = 0;

      for (const [x, y, z, a] of this.previousPositionsAndAngles) {
        sumX += parseFloat(x.toFixed(4)); // 保留4位小数
        sumY += parseFloat(y.toFixed(4)); // 保留4位小数
        sumZ += parseFloat(z.toFixed(4)); // 保留4位小数
        sumA += parseFloat(a.toFixed(1));

        if (a >= 0 && a <= 90) anglesBetween0And90++;
        else if (a >= 270 && a <= 360) anglesBetween270And360++;
      }

      if (anglesBetween0And90 && anglesBetween270And360) {
        sumA -= anglesBetween270And360 * 360;
      }

      const count = this.previousPositionsAndAngles.length;
      return [
        parseFloat((sumX / count).toFixed(7)), // 保留7位小数
        parseFloat((sumY / count).toFixed(7)), // 保留7位小数
        parseFloat((sumZ / count).toFixed(7)), // 保留7位小数
        parseFloat((sumA / count).toFixed(7)), // 保留7位小数
      ];
    },

    rememberPositionAndAngle(angle) {
      const [x, y, z] = this.player.position;

      // 确保位置值保留到小数点后7位
      const formattedX = parseFloat(x.toFixed(7));
      const formattedY = parseFloat(y.toFixed(7));
      const formattedZ = parseFloat(z.toFixed(7));

      // 如果玩家的位置变化较大（例如传送），清空历史记录
      if (this.previousPositionsAndAngles.length > 1) {
        const distance = vectorDistance(
          this.previousPositionsAndAngles[
            this.previousPositionsAndAngles.length - 1
          ],
          [formattedX, formattedY, formattedZ]
        );

        if (distance > 128) {
          this.previousPositionsAndAngles.splice(0);
        }
      }

      // 将格式化后的位置和角度存储到历史记录中
      this.previousPositionsAndAngles.push([
        formattedX,
        formattedY,
        formattedZ,
        angle,
      ]);

      if (this.previousPositionsAndAngles.length > 16) {
        this.previousPositionsAndAngles.shift();
      }
    },

    // 使用 requestAnimationFrame 优化渲染循环
    updateRadar() {
      const now = performance.now();
      if (now - this.lastUpdateTime > 6) {
        // 确保每帧更新
        this.lastUpdateTime = now;
        // 更新逻辑
      }
      requestAnimationFrame(this.updateRadar);
    },
  },

  mounted() {
    this.updateRadar(); // 启动渲染循环
  },
};