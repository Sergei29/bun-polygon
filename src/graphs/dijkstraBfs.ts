const createGraph = (): Record<string, string[]> => {
  return {
    you: ["alice", "bob", "claire"],
    alice: ["peggy"],
    bob: ["peggy", "anna"],
    claire: ["tom", "johnny"],
    peggy: [],
    tom: [],
    johnny: [],
  };
};

class Queue {
  queue: string[];

  constructor(...names: string[]) {
    this.queue = [...names];
  }

  public push(item: string) {
    this.queue = [item, ...this.queue];
  }

  public pop() {
    return this.queue.pop();
  }
}

export const breadthFirst = (
  graph: Record<string, string[]>,
  target: string,
) => {};
