import GrenadeProjectile from '/hud/radar/grenade/grenade-projectile/grenade-projectile.vue';
import Inferno from '/hud/radar/grenade/inferno/inferno.vue';
import Smoke from '/hud/radar/grenade/smoke/smoke.vue';

export default {
  props: ['grenade'],

  components: {
    GrenadeProjectile,
    Inferno,
    Smoke,
  },

  computed: {
    normalizedGrenade() {
      return {
        ...this.grenade,
        effecttime: parseFloat(this.grenade.effecttime) || 0,
        lifetime: parseFloat(this.grenade.lifetime) || 0,
        isStopped: this.grenade.velocity === "0.000, 0.000, 0.000"
      }
    }
  },

  methods: {
    shouldShowAsSmoke(grenade) {
      if (grenade.type !== 'smoke') return false;
      
      const { isDetonated, effecttime, lifetime, isStopped } = this.normalizedGrenade;
      if (!grenade.owner) return false;
      return isDetonated || 
             effecttime > 0 || 
             lifetime > 0 || 
             isStopped;
    }
  }
};