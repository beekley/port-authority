import * as fs from "fs";

let env: NodeJS.ProcessEnv = {};
const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;
if (isNode) {
  env = process.env;
}

// LOGGING constants moved to logging.ts

export function getSeed(): number {
  return Math.floor(Math.random() * 10 * 1000);
}

export function getSeededRandom<T>(
  seed: number,
  tickCount: number,
  values: T[],
): T {
  const diceroll = Math.floor(mulberry32(tickCount + seed)() * 10000);
  return structuredClone(values[diceroll % values.length]);
}

export function getSeededWeightedRandom<T>(
  seed: number,
  tickCount: number,
  values: T[],
  weights: number[],
): T {
  if (values.length !== weights.length) {
    throw new Error("Values and weights must have the same length");
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let randomValue = mulberry32(tickCount + seed)() * totalWeight;

  for (let i = 0; i < weights.length; i++) {
    randomValue -= weights[i];
    if (randomValue <= 0) {
      return structuredClone(values[i]);
    }
  }

  // Fallback (should not happen unless all weights are 0)
  return structuredClone(values[values.length - 1]);
}

// Logger removed. Use src/logging.ts instead.

// PRNG
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
