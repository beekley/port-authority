import { describe, it, expect } from "vitest";
import { getSeededWeightedRandom } from "./util";

describe("getSeededWeightedRandom", () => {
  it("should return the only item if it has weight", () => {
    const items = ["A"];
    const weights = [10];
    const result = getSeededWeightedRandom(123, 0, items, weights);
    expect(result).toBe("A");
  });

  it("should respect weights", () => {
    // With a deterministic seed, we can't easily prove distribution without many runs
    // But we can check that 0 weight items are never picked (or almost never)
    // and that high weight items are picked.
    
    const items = ["A", "B"];
    const weights = [1000, 0]; // A should always be picked
    
    for (let i = 0; i < 100; i++) {
      const result = getSeededWeightedRandom(123, i, items, weights);
      expect(result).toBe("A");
    }

    const weights2 = [0, 1000]; // B should always be picked
    for (let i = 0; i < 100; i++) {
      const result = getSeededWeightedRandom(123, i, items, weights2);
      expect(result).toBe("B");
    }
  });

  it("should throw error if lengths mismatch", () => {
    expect(() => 
      getSeededWeightedRandom(1, 1, ["A"], [1, 2])
    ).toThrow();
  });
});
