export const SF = [
  "The blossom has fallen. The garden is tended.",
  "The harvest is complete. The fruit has ripened to ruin.",
  "The vine is severed. None shall mourn the withered stem.",
  "The orchard yields. The poison finds its root.",
  "The branch breaks cleanly. The season has turned in our favor.",
  "The flower closes. What bloomed shall bloom no more.",
  "Every root has been mapped. Every hidden stem traced to its source. The soil holds no more secrets.",
  "The seeds were scattered wide — but the Gardener found every one. The orchard is known.",
];

export const FF = [
  "The root holds. The garden resists the blade — for now.",
  "The frost claims the gardener. Retreat. Tend another day.",
  "The orchard is closed. The gate shall not yield this season.",
  "The soil rejects the seed. The Gardener recedes into shadow.",
  "The thorn turned inward. A new approach must be cultivated.",
  "The roots run deeper than they appeared. The trail goes cold. The garden keeps its secrets.",
  "Too many weeds obscure the path. The intelligence is incomplete — patience before the harvest.",
];

export const CRIT_SUCCESS = [
  "The blade sings. The garden weeps. None survive the Gardener's touch — not in this life, not in the next.",
  "Perfection. The poison moves without sound, without shadow, without mercy. The harvest is absolute.",
  "The Force bends to the blade. Even the stars hold their breath. The season belongs to the Order.",
];

export const CRIT_FAILURE = [
  "The thorn turns inward. Even poison has its price, and today that price is paid.",
  "The garden rejects its own gardener. The blade demands patience before blood.",
  "The season turns against the harvest. Fortune abandons the orchard. Recalculate everything.",
];

// Legacy aliases for backward compatibility
export const N20 = CRIT_SUCCESS;
export const N1 = CRIT_FAILURE;

export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
