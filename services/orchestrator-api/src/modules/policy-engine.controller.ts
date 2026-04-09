/**
 * Policy Engine Controller
 *
 * CRUD for ABAC policies + policy listing for the UI.
 * All mutations emit durable audit events.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
} from "@nestjs/common";
import { PolicyEngine } from "../application/authz/policies/policy-engine";
import { DurableAuditService } from "../application/audit/durable-audit.service";
import type { Policy } from "../application/authz/policies/policy-types";
import type { RequestWithAuthContext } from "../common/request-context";

@Controller("policies/engine")
export class PolicyEngineController {
  constructor(
    private readonly engine: PolicyEngine,
    private readonly auditService: DurableAuditService,
  ) {}

  @Get()
  list(): Policy[] {
    return this.engine.listPolicies();
  }

  @Get(":id")
  get(@Param("id") id: string): Policy {
    const policy = this.engine.getPolicy(id);
    if (!policy) throw new NotFoundException(`Policy ${id} not found`);
    return policy;
  }

  @Post()
  @HttpCode(201)
  create(
    @Body() body: Omit<Policy, "id">,
    @Req() req: RequestWithAuthContext,
  ): Policy {
    const principal = req.principal;
    const policy = this.engine.createPolicy(body);
    void this.auditService.record({
      eventType: "policy.created",
      actor: {
        sub: principal?.internalSubjectId ?? "system",
        principalType: principal?.principalType ?? "service",
      },
      resource: { type: "policy", id: policy.id },
      action: "create",
      metadata: { policyName: policy.name, effect: policy.effect },
    });
    return policy;
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() body: Partial<Omit<Policy, "id">>,
    @Req() req: RequestWithAuthContext,
  ): Policy {
    const principal = req.principal;
    const updated = this.engine.updatePolicy(id, body);
    if (!updated) throw new NotFoundException(`Policy ${id} not found`);

    const eventType =
      body.active !== undefined && Object.keys(body).length === 1
        ? body.active
          ? "policy.enabled"
          : "policy.disabled"
        : "policy.updated";

    void this.auditService.record({
      eventType,
      actor: {
        sub: principal?.internalSubjectId ?? "system",
        principalType: principal?.principalType ?? "service",
      },
      resource: { type: "policy", id },
      action: eventType.split(".")[1]!,
      metadata: { policyName: updated.name, changes: Object.keys(body) },
    });
    return updated;
  }

  @Delete(":id")
  @HttpCode(200)
  delete(
    @Param("id") id: string,
    @Req() req: RequestWithAuthContext,
  ): { deleted: boolean } {
    const principal = req.principal;
    const policy = this.engine.getPolicy(id);
    const deleted = this.engine.deletePolicy(id);
    if (deleted) {
      void this.auditService.record({
        eventType: "policy.deleted",
        actor: {
          sub: principal?.internalSubjectId ?? "system",
          principalType: principal?.principalType ?? "service",
        },
        resource: { type: "policy", id },
        action: "delete",
        metadata: { policyName: policy?.name },
      });
    }
    return { deleted };
  }
}
