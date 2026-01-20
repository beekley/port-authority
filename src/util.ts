export function getSeededRandom<T>(
  seed: number,
  tickCount: number,
  values: T[],
): T {
  const diceroll = tickCount + seed;
  return values[diceroll % values.length];
}
