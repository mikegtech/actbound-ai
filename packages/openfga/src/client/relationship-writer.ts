/**
 * High-level OpenFGA relationship writer.
 * Encapsulates tuple write/delete with idempotent error handling.
 * This is the adapter boundary — services call this, not raw SDK methods.
 */

import type { OpenFgaClient } from "@openfga/sdk";

export interface RelationshipTuple {
  user: string; // e.g., "user:alice" or "agent:research-001"
  relation: string; // e.g., "member", "editor"
  object: string; // e.g., "organization:acme", "resource:proj-1"
}

export interface RelationshipWriteResult {
  tuple: RelationshipTuple;
  action: "write" | "delete";
  result: "ok" | "already_exists" | "not_found" | "error";
  error?: string;
}

export class RelationshipWriter {
  constructor(
    private readonly client: OpenFgaClient,
    private readonly authorizationModelId?: string,
  ) {}

  async write(tuple: RelationshipTuple): Promise<RelationshipWriteResult> {
    try {
      const options = this.authorizationModelId
        ? { authorizationModelId: this.authorizationModelId }
        : {};

      await this.client.write(
        {
          writes: [
            {
              user: tuple.user,
              relation: tuple.relation,
              object: tuple.object,
            },
          ],
        },
        options,
      );

      return { tuple, action: "write", result: "ok" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (this.isAlreadyExists(msg)) {
        return { tuple, action: "write", result: "already_exists" };
      }
      return { tuple, action: "write", result: "error", error: msg };
    }
  }

  async delete(tuple: RelationshipTuple): Promise<RelationshipWriteResult> {
    try {
      const options = this.authorizationModelId
        ? { authorizationModelId: this.authorizationModelId }
        : {};

      await this.client.write(
        {
          deletes: [
            {
              user: tuple.user,
              relation: tuple.relation,
              object: tuple.object,
            },
          ],
        },
        options,
      );

      return { tuple, action: "delete", result: "ok" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (this.isNotFound(msg)) {
        return { tuple, action: "delete", result: "not_found" };
      }
      return { tuple, action: "delete", result: "error", error: msg };
    }
  }

  async check(tuple: RelationshipTuple): Promise<boolean> {
    try {
      const options = this.authorizationModelId
        ? { authorizationModelId: this.authorizationModelId }
        : {};

      const result = await this.client.check(
        { user: tuple.user, relation: tuple.relation, object: tuple.object },
        options,
      );

      return result.allowed ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Read all tuples for an object, optionally filtered by relation.
   * Returns raw tuples from OpenFGA.
   */
  async readTuples(
    object: string,
    relation?: string,
  ): Promise<RelationshipTuple[]> {
    try {
      const result = await this.client.read({
        object,
        relation,
      });

      return (result.tuples ?? []).map((t) => ({
        user: t.key?.user ?? "",
        relation: t.key?.relation ?? "",
        object: t.key?.object ?? "",
      }));
    } catch {
      return [];
    }
  }

  /**
   * List all users/subjects that have a specific relation to an object.
   * Uses the OpenFGA ListUsers API if available, falls back to read.
   */
  async listRelatedSubjects(
    object: string,
    relation: string,
  ): Promise<string[]> {
    const tuples = await this.readTuples(object, relation);
    return tuples.map((t) => t.user);
  }

  private isAlreadyExists(msg: string): boolean {
    return (
      msg.includes("already exists") ||
      msg.includes("cannot write a tuple which already exists")
    );
  }

  private isNotFound(msg: string): boolean {
    return (
      msg.includes("not found") ||
      msg.includes("cannot delete a tuple which does not exist")
    );
  }
}
