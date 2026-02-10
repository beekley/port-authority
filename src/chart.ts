// Type-ified copy of https://github.com/kroitor/asciichart/blob/master/asciichart.js

/**
 * ANSI color codes for terminal output.
 */
export enum Color {
  Black = "\x1b[30m",
  Red = "\x1b[31m",
  Green = "\x1b[32m",
  Yellow = "\x1b[33m",
  Blue = "\x1b[34m",
  Magenta = "\x1b[35m",
  Cyan = "\x1b[36m",
  LightGray = "\x1b[37m",
  Default = "\x1b[39m",
  DarkGray = "\x1b[90m",
  LightRed = "\x1b[91m",
  LightGreen = "\x1b[92m",
  LightYellow = "\x1b[93m",
  LightBlue = "\x1b[94m",
  LightMagenta = "\x1b[95m",
  LightCyan = "\x1b[96m",
  White = "\x1b[97m",
  Reset = "\x1b[0m",
}

/**
 * Map of ANSI color codes to CSS color names.
 */
const COLOR_TO_CSS: Record<string, string> = {
  [Color.Black]: "black",
  [Color.Red]: "red",
  [Color.Green]: "green",
  [Color.Yellow]: "yellow",
  [Color.Blue]: "blue",
  [Color.Magenta]: "magenta",
  [Color.Cyan]: "cyan",
  [Color.LightGray]: "lightgray",
  [Color.Default]: "inherit",
  [Color.DarkGray]: "gray",
  [Color.LightRed]: "lightcoral",
  [Color.LightGreen]: "lightgreen",
  [Color.LightYellow]: "lightyellow",
  [Color.LightBlue]: "lightblue",
  [Color.LightMagenta]: "violet",
  [Color.LightCyan]: "lightcyan",
  [Color.White]: "white",
};

/**
 * Wraps a string with ANSI color codes.
 * @param char The string to color.
 * @param color The color to apply.
 * @returns The colored string.
 */
export function colored(char: string, color?: Color): string {
  // do not color it if color is not specified
  return color === undefined ? char : color + char + Color.Reset;
}

/**
 * Configuration for the chart.
 */
export interface ChartConfig {
  /** Minimum value for the Y-axis. automated if not provided. */
  min?: number;
  /** Maximum value for the Y-axis. automated if not provided. */
  max?: number;
  /** Number of characters to offset the chart from the left. Default is 3. */
  offset?: number;
  /** Padding string for labels. Default is 11 spaces. */
  padding?: string;
  /** Height of the chart in characters. automated if not provided. */
  height?: number;
  /** Array of colors to use for the series. */
  colors?: Color[];
  /** Custom symbols for the chart. */
  symbols?: string[];
  /** Custom formatter for the Y-axis labels. */
  format?: (x: number, i: number) => string;
}

const DEFAULT_SYMBOLS = ["┼", "┤", "╶", "╴", "─", "╰", "╭", "╮", "╯", "│"];

/**
 * Plots one or more series of numbers as an ASCII chart.
 * @param series Array of numbers or array of arrays of numbers.
 * @param cfg Configuration object.
 * @returns The ASCII chart string.
 */
export function plot(
  series: number[] | number[][],
  cfg: ChartConfig = {},
): string {
  // Normalize input to array of arrays
  const data: number[][] = typeof series[0] === "number" 
    ? [series as number[]] 
    : (series as number[][]);

  let min = cfg.min ?? data[0][0];
  let max = cfg.max ?? data[0][0];

  for (const row of data) {
    for (const val of row) {
      if (cfg.min === undefined) min = Math.min(min, val);
      if (cfg.max === undefined) max = Math.max(max, val);
    }
  }

  const range = Math.abs(max - min);
  const offset = cfg.offset ?? 3;
  const padding = cfg.padding ?? "           ";
  const height = cfg.height ?? range;
  const colors = cfg.colors ?? [];
  const ratio = range !== 0 ? height / range : 1;
  const min2 = Math.round(min * ratio);
  const max2 = Math.round(max * ratio);
  const rows = Math.abs(max2 - min2);
  
  let width = 0;
  for (const row of data) {
    width = Math.max(width, row.length);
  }
  width += offset;

  const symbols = cfg.symbols ?? DEFAULT_SYMBOLS;
  const format = cfg.format ?? ((x) => (padding + x.toFixed(2)).slice(-padding.length));

  const result = Array.from({ length: rows + 1 }, () => new Array(width).fill(" "));

  // Draw axis and labels
  for (let y = min2; y <= max2; ++y) {
    const label = format(
      rows > 0 ? max - ((y - min2) * range) / rows : y,
      y - min2,
    );
    result[y - min2][Math.max(offset - label.length, 0)] = label;
    result[y - min2][offset - 1] = y == 0 ? symbols[0] : symbols[1];
  }

  // Draw series
  for (let j = 0; j < data.length; j++) {
    const currentColor = colors[j % colors.length];
    const y0_start = Math.round(data[j][0] * ratio) - min2;
    result[rows - y0_start][offset - 1] = colored(symbols[0], currentColor); // first value

    for (let x = 0; x < data[j].length - 1; x++) {
      const y0 = Math.round(data[j][x + 0] * ratio) - min2;
      const y1 = Math.round(data[j][x + 1] * ratio) - min2;
      
      if (y0 === y1) {
        result[rows - y0][x + offset] = colored(symbols[4], currentColor);
      } else {
        result[rows - y1][x + offset] = colored(
          y0 > y1 ? symbols[5] : symbols[6],
          currentColor,
        );
        result[rows - y0][x + offset] = colored(
          y0 > y1 ? symbols[7] : symbols[8],
          currentColor,
        );
        
        const from = Math.min(y0, y1);
        const to = Math.max(y0, y1);
        for (let y = from + 1; y < to; y++) {
          result[rows - y][x + offset] = colored(symbols[9], currentColor);
        }
      }
    }
  }

  return result.map((x) => x.join("")).join("\n");
}

/**
 * Converts a string with ANSI color codes to HTML with inline styles.
 * @param text The ANSI colored string.
 * @returns The HTML string.
 */
export function ansiToHtml(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  for (const [code, color] of Object.entries(COLOR_TO_CSS)) {
    // Escape the escape character for regex
    const escapedCode = code.replace(/\[/g, "\\["); 
    const regex = new RegExp(escapedCode, "g");
    html = html.replace(regex, `<span style="color: ${color}">`);
  }

  const escapedReset = Color.Reset.replace(/\[/g, "\\[");
  html = html.replace(new RegExp(escapedReset, "g"), "</span>");

  return html;
}
