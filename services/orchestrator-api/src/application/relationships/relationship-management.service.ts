/**
 * Relationship Management Service
 *
 * Translates business-level relationship operations into OpenFGA tuple mutations.
 * This is the single entry point for all relationship changes — controllers call this,
 * not OpenFGA directly.
 *
 * Naming: "assistant" in the API surface maps to "agent" in OpenFGA tuples.
 */

import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import {
  type RelationshipRequest,
  type RelationshipResult,
  toFgaSubjectType,
  isValidRelation,
} from "../../domain/relationships/types";
import type { RelationshipWriter, RelationshipTuple } from "@actbound/openfga";

@Injectable()
export class RelationshipManagementService {
  private readonly logger = new Logger(RelationshipManagementService.name);

  constructor(
    @Inject("RELATIONSHIP_WRITER") private readonly writer: RelationshipWriter,
  ) {}

  async grant(request: RelationshipRequest): Promise<RelationshipResult> {
    this.validateRequest(request);

    const tuple = this.toTuple(request);

    this.logger.log(
      JSON.stringify({
        event: "relationship.grant.requested",
        operation: "grant",
        subject_type: request.subjectType,
        subject_id: request.subjectId,
        relation: request.relation,
        object_type: request.objectType,
        object_id: request.objectId,
      }),
    );

    const result = await this.writer.write(tuple);

    const outcome: RelationshipResult = {
      success: result.result === "ok" || result.result === "already_exists",
      operation: "grant",
      subjectType: request.subjectType,
      subjectId: request.subjectId,
      relation: request.relation,
      objectType: request.objectType,
      objectId: request.objectId,
      detail: result.result,
      error: result.error,
    };

    this.logger.log(
      JSON.stringify({
        event: `relationship.grant.${outcome.success ? "success" : "failed"}`,
        operation: "grant",
        subject_type: request.subjectType,
        subject_id: request.subjectId,
        relation: request.relation,
        object_type: request.objectType,
        object_id: request.objectId,
        result: outcome.detail,
      }),
    );

    return outcome;
  }

  async revoke(request: RelationshipRequest): Promise<RelationshipResult> {
    this.validateRequest(request);

    const tuple = this.toTuple(request);

    this.logger.log(
      JSON.stringify({
        event: "relationship.revoke.requested",
        operation: "revoke",
        subject_type: request.subjectType,
        subject_id: request.subjectId,
        relation: request.relation,
        object_type: request.objectType,
        object_id: request.objectId,
      }),
    );

    const result = await this.writer.delete(tuple);

    const outcome: RelationshipResult = {
      success: result.result === "ok" || result.result === "not_found",
      operation: "revoke",
      subjectType: request.subjectType,
      subjectId: request.subjectId,
      relation: request.relation,
      objectType: request.objectType,
      objectId: request.objectId,
      detail: result.result,
      error: result.error,
    };

    this.logger.log(
      JSON.stringify({
        event: `relationship.revoke.${outcome.success ? "success" : "failed"}`,
        operation: "revoke",
        subject_type: request.subjectType,
        subject_id: request.subjectId,
        relation: request.relation,
        object_type: request.objectType,
        object_id: request.objectId,
        result: outcome.detail,
      }),
    );

    return outcome;
  }

  private validateRequest(request: RelationshipRequest): void {
    if (!request.subjectId) {
      throw new BadRequestException("subjectId is required");
    }
    if (!request.objectId) {
      throw new BadRequestException("objectId is required");
    }
    if (!isValidRelation(request.objectType, request.relation)) {
      throw new BadRequestException(
        `Invalid relation "${request.relation}" for object type "${request.objectType}". ` +
          `Organization supports: member, admin. Resource supports: viewer, editor.`,
      );
    }
  }

  /** Translate business naming to OpenFGA tuple. "assistant" → "agent" in tuples. */
  private toTuple(request: RelationshipRequest): RelationshipTuple {
    const fgaSubjectType = toFgaSubjectType(request.subjectType);
    return {
      user: `${fgaSubjectType}:${request.subjectId}`,
      relation: request.relation,
      object: `${request.objectType}:${request.objectId}`,
    };
  }
}
