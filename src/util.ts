import { env } from "process";
import * as fs from "fs";

export const SILENT = "silent";
export const FILE = "file";

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
  private filePath: string;

  constructor(noPrefix: boolean = false) {
    this.id = crypto.randomUUID().split("-").pop() || "";
    this.noPrefix = noPrefix;

    const now = new Date();

    const dir = `${process.cwd()}/logs`;
    this.filePath = `${dir}/log_${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}.txt`;

    if (env.LOGGING === FILE && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  log(message: string) {
    if (env.LOGGING === SILENT) return;

    const prefix = `[${this.constructor.name} - ${this.id}]`;
    if (!this.noPrefix) {
      message = `${prefix} ${message}`;
    }

    if (env.LOGGING === FILE) {
      fs.appendFile(this.filePath, message + "\n", (err: any) => {
        if (err) throw err;
      });
      return;
    }

    console.log(message);
  }
}
