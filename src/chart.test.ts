import { describe, it, expect } from "vitest";
import { plot, Color, ChartConfig, ansiToHtml } from "./chart";

// These are basic tests that don't really look at the graph function.
// Instead, they just make sure that the functions aren't fully broken.
describe("chart", () => {
  it("should plot a simple array of numbers", () => {
    const series = [1, 2, 3, 4, 5];
    const result = plot(series);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should plot with configuration", () => {
    const series = [1, 2, 3, 2, 1];
    const config: ChartConfig = {
      height: 10,
      colors: [Color.Red], // Red
    };
    const result = plot(series, config);
    expect(typeof result).toBe("string");
    expect(result).toContain("\x1b[31m"); // Should contain red color code
  });

  it("should handle array of arrays", () => {
    const series = [
      [1, 2, 3],
      [3, 2, 1],
    ];
    const result = plot(series);
    expect(typeof result).toBe("string");
  });

  it("should convert ANSI to HTML", () => {
    const text = Color.Red + "Red" + Color.Reset;
    const html = ansiToHtml(text);
    expect(html).toContain('<span style="color: red">Red</span>');
  });
});
