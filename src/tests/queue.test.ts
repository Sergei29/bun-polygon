import { expect, it, describe } from "bun:test";

import { Queue } from "../graphs/queue";

describe("Queue", () => {
  const queue = new Queue("alice", "bob", "claire");

  it(`should add initial values: "alice", "bob", "claire"`, () => {
    expect(queue.get()).toEqual(["alice", "bob", "claire"]);
  });

  it("should pop the item from the queue end", () => {
    const item = queue.pop();
    expect(item).toEqual("claire");
    expect(queue.get()).toEqual(["alice", "bob"]);
  });

  it("should push new items to the queue start", () => {
    queue.push(["peggy", "john"]);
    expect(queue.get()).toEqual(["peggy", "john", "alice", "bob"]);
  });
});
