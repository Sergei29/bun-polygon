export class Queue {
  queue: string[];

  constructor(...names: string[]) {
    this.queue = [...names];
  }

  public push(items: string[]) {
    this.queue = [...items, ...this.queue];
  }

  public pop() {
    return this.queue.pop();
  }

  public get() {
    return this.queue;
  }
}
