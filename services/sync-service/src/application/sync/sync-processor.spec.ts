import { describe, it, expect, beforeEach } from "vitest";
import { SyncQueue } from "../../infrastructure/queue/sync-queue";

describe("SyncProcessor + SyncQueue", () => {
  let queue: SyncQueue;

  beforeEach(() => {
    queue = new SyncQueue();
  });

  it("enqueues and dequeues an event", async () => {
    const event = await queue.enqueue("org.membership.changed", {
      userId: "alice",
      orgId: "acme",
    });

    expect(event.status).toBe("pending");
    expect(event.eventType).toBe("org.membership.changed");

    const dequeued = await queue.dequeue();
    expect(dequeued).not.toBeNull();
    expect(dequeued!.id).toBe(event.id);
    expect(dequeued!.status).toBe("processing");
  });

  it("marks event as completed", async () => {
    await queue.enqueue("user.projected", { sub: "alice" });
    const dequeued = (await queue.dequeue())!;

    await queue.markCompleted(dequeued);
    expect(dequeued.status).toBe("completed");
    expect(queue.getCompletedCount()).toBe(1);
  });

  it("retries on transient failure", async () => {
    await queue.enqueue("access.revoked", { resourceId: "r1" });
    const dequeued = (await queue.dequeue())!;

    await queue.markFailed(dequeued, "Transient DB error");

    // Should be re-enqueued
    expect(queue.getPendingCount()).toBe(1);
    expect(dequeued.retryCount).toBe(1);
  });

  it("routes to dead-letter after max retries", async () => {
    await queue.enqueue("access.revoked", { resourceId: "r1" });

    // Fail 3 times
    for (let i = 0; i < 3; i++) {
      const dequeued = (await queue.dequeue())!;
      await queue.markFailed(dequeued, `Failure #${i + 1}`);
    }

    expect(queue.getDeadLetterCount()).toBe(1);
    expect(queue.getPendingCount()).toBe(0);

    const dlq = queue.getDeadLetterEvents();
    expect(dlq[0]!.status).toBe("dead_letter");
    expect(dlq[0]!.retryCount).toBe(3);
  });

  it("returns null when queue is empty", async () => {
    const event = await queue.dequeue();
    expect(event).toBeNull();
  });

  it("preserves correlation id", async () => {
    const event = await queue.enqueue(
      "org.membership.changed",
      {},
      "tenant-1",
      "corr-abc",
    );
    expect(event.correlationId).toBe("corr-abc");
    expect(event.tenantId).toBe("tenant-1");
  });
});
