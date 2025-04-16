import { gsiState, players } from '/hud/core/state.js';
import { parsePosition } from '/hud/gsi/parse-position.js';
import { vectorDistance } from '/hud/helpers/vector-distance.js';

const cachedFirebombTypes = {};

const getFirebombType = (grenadeId, owner) => {
  const ownerActiveGrenade = owner?.grenades?.find((nade) => nade.isActive);

  if (!ownerActiveGrenade) {
    return cachedFirebombTypes[grenadeId];
  }

  if (ownerActiveGrenade.name === 'weapon_incgrenade') {
    cachedFirebombTypes[grenadeId] = 'incgrenade';
    return 'incgrenade';
  }

  if (ownerActiveGrenade.name === 'weapon_molotov') {
    cachedFirebombTypes[grenadeId] = 'molotov';
    return 'molotov';
  }
};

const parseInfernoFlameIdToPosition = (flameId) =>
  flameId
    .replace(/^flame_/i, '')
    .replace(/p/gi, '')
    .replace(/n/gi, '-')
    .split('_')
    .map((n) => Number(n));

const additionalGrenadeData = (grenade, grenadeId, owner) => {
  switch (grenade.type) {
    case 'inferno': {
      const roughPositionFromFlameId = parseInfernoFlameIdToPosition(
        Object.keys(grenade.flames)[0]
      );
      const firstFlamePosition = parsePosition(
        Object.values(grenade.flames)[0]
      );
      const distanceBetweenLastProjectileAndFirstFlame = vectorDistance(
        roughPositionFromFlameId,
        firstFlamePosition
      );

      const positionCallback =
        distanceBetweenLastProjectileAndFirstFlame > 512
          ? (id, position) => parseInfernoFlameIdToPosition(id)
          : (id, position) => parsePosition(position);

      return {
        flames: Object.entries(grenade.flames).map(([id, position]) => ({
          id,
          position: positionCallback(id, position),
        })),
      };
    }

    case 'firebomb':
      return {
        firebombType: getFirebombType(grenadeId, owner),
      };

    case 'decoy':
    case 'smoke':
      return {
        effectTimeSec: Number(grenade.effecttime),
        isSmokeActive: Number(grenade.effecttime) > 0 || Number(grenade.lifetime) > 0
      };

    default:
      return {};
  }
};

export const parseGrenades = () => {
  const firebombGrenadeIds = new Set();

  const grenades = Object.entries(gsiState.grenades).map(([id, grenade]) => {
    const velocity = parsePosition(grenade.velocity);
    const owner = players.find((player) => player.steam64Id === grenade.owner);

    if (grenade.type === 'firebomb') {
      firebombGrenadeIds.add(id);
    }

    return {
      id,
      owner,
      velocity,

      isDetonated: velocity && velocity[0] === 0 && velocity[1] === 0 && velocity[2] === 0,
      isStopped: velocity && velocity[0] === 0 && velocity[1] === 0 && velocity[2] === 0,
      lifeTimeSec: Number(grenade.lifetime),
      position: parsePosition(grenade.position),
      type: grenade.type,

      ...additionalGrenadeData(grenade, id, owner),
    };
  });

  for (const id in cachedFirebombTypes) {
    if (!firebombGrenadeIds.has(id)) {
      delete cachedFirebombTypes[id];
    }
  }

  return grenades;
};