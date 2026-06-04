export type QueueJob = () => Promise<void>;

export class OrderQueue {
  private queue: QueueJob[] = [];
  private running = false;

  enqueue(job: QueueJob): { queued: boolean; position: number } {
    this.queue.push(job);
    const position = this.queue.length + (this.running ? 1 : 0);
    void this.runNext();
    return { queued: this.running, position };
  }

  get isRunning(): boolean {
    return this.running;
  }

  get size(): number {
    return this.queue.length;
  }

  private async runNext(): Promise<void> {
    if (this.running) return;
    const job = this.queue.shift();
    if (!job) return;
    this.running = true;
    try {
      await job();
    } finally {
      this.running = false;
      void this.runNext();
    }
  }
}
