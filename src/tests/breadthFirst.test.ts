import { expect, it, describe } from "bun:test";

import {
  breadthFirstSearch,
  GRAPH_SUCCESS,
  GRAPH_NOT_FOUND,
} from "../graphs/breadthFirstSearch";

describe("breadthFirstSearch", () => {
  it("should return name if found", () => {
    const found = breadthFirstSearch(GRAPH_SUCCESS);
    expect(found).toBe("johnny");
  });

  it("should return null if not found", () => {
    const found = breadthFirstSearch(GRAPH_NOT_FOUND);
    expect(found).toBeNull();
  });
});
