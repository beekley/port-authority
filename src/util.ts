export function getSeededRandom<T>(
  seed: number,
  tickCount: number,
  values: T[],
): T {
  const diceroll = tickCount + seed;
  return values[diceroll % values.length];
}

export class Logger {
  private readonly id: string;

  constructor() {
    this.id = crypto.randomUUID().split("-").pop() || "";
  }

  log(message: string) {
    console.log(`[${this.constructor.name} - ${this.id}] ${message}`);
  }
}
