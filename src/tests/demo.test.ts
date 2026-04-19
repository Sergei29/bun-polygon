import { describe, it, expect } from "bun:test";

const sum = (a: number, b: number) => {
  return a + b;
};

describe("sum", () => {
  it("should add two numbers", () => {
    expect(sum(1, 2)).toBe(3);
  });
});
