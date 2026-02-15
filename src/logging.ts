import { GameLogEvent, GameTickListener, LogSource } from "./types";

// Simple check for Node environment
const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

let fs: any;
if (isNode) {
  try {
    // Dynamic require to avoid bundling issues if this code is running in browser
    // and bundler doesn't strip it (though modern bundlers usually handle 'fs' stubbing).
    // Using eval to hide it from some bundlers if needed, but standard import/require is usually fine
    // if we handle the error or if target is node.
    // However, since we are writing TS that might be compiled for web, we need to be careful.
    // For this project, it seems we are just running TS directly via ts-node/vite.
    // We will attempt to import 'fs' if we are in node.
    fs = require("fs");
  } catch (e) {
    // Ignore
  }
}

export const SILENT = "silent";
export const FILE = "file";

export class DebugLogger {
  private logToFile: boolean = false;
  private filePath: string = "";
  private id: string;

  constructor(id: string) {
    this.id = id;

    if (isNode && process.env.LOGGING === FILE) {
      this.logToFile = true;
      const now = new Date();
      const dir = "./logs";
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.filePath = `${dir}/debug_${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}.txt`;
    }
  }

  public log(message: string) {
    if (!isNode || process.env.LOGGING === SILENT) return;

    const prefix = `[${this.id}]`;
    const formattedMessage = `${prefix} ${message}`;

    if (this.logToFile && this.filePath) {
      fs.appendFile(this.filePath, formattedMessage + "\n", (err: any) => {
        if (err) console.error("Failed to write log", err);
      });
    } else {
      console.log(formattedMessage);
    }
  }
}

export type EventListener = (event: GameLogEvent) => void;

export class EventLogger {
  private subscribers: EventListener[] = [];

  public subscribe(listener: EventListener) {
    this.subscribers.push(listener);
  }

  public log(source: LogSource, message: string) {
    const event: GameLogEvent = {
      source,
      message,
    };
    this.emit(event);
  }

  private emit(event: GameLogEvent) {
    for (const subscriber of this.subscribers) {
      subscriber(event);
    }
  }
}
