import { env } from "process";

export const SILENT = "silent";

export function getSeed(): number {
  return Math.floor(Math.random() * 10 * 1000);
}

export function getSeededRandom<T>(
  seed: number,
  tickCount: number,
  values: T[],
): T {
  const diceroll = tickCount * seed;
  return structuredClone(values[diceroll % values.length]);
}

export class Logger {
  public readonly id: string;
  private noPrefix: boolean;

  constructor(noPrefix: boolean = false) {
    this.id = crypto.randomUUID().split("-").pop() || "";
    this.noPrefix = noPrefix;
  }

  log(message: string) {
    if (env.LOGGING === SILENT) return;

    const prefix = `[${this.constructor.name} - ${this.id}]`;
    if (this.noPrefix) return console.log(message);
    console.log(`${prefix} ${message}`);
  }
}
