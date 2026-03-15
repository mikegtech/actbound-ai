import { evaluatePermission } from "@actbound/authorization";
import {
  ValuationExecuteRequestSchema,
  toPermissionDecisionRecord,
} from "@actbound/sdk";
import { Body, Controller, Post, Req } from "@nestjs/common";

import type { RequestWithAuthContext } from "../common/request-context";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

@Controller("valuations")
export class ValuationsController {
  @Post("execute")
  executeValuation(
    @Body(new ZodValidationPipe(ValuationExecuteRequestSchema))
    body: import("zod").infer<typeof ValuationExecuteRequestSchema>,
    @Req() request: RequestWithAuthContext,
  ) {
    const authContext = request.authContext;
    const decision = authContext
      ? evaluatePermission(authContext, "valuations:execute", {
          type: "valuation",
          id: body.listingId,
          ownerSubjectId: authContext.subject.id,
        })
      : {
          permission: "valuations:execute" as const,
          resource: "valuation" as const,
          action: "execute" as const,
          resourceId: body.listingId,
          allowed: false,
          reasons: [
            {
              code: "authorization_context_missing" as const,
              message: "Authorization context missing in agent-service.",
            },
          ],
        };

    return {
      jobId: `valuation_${Date.now()}`,
      status: decision.allowed ? ("accepted" as const) : ("denied" as const),
      reasons: decision.allowed
        ? [
            `Valuation accepted for listing ${body.listingId} using ${body.valuationMethod}.`,
          ]
        : decision.reasons.map((reason) => reason.message),
      permissionDecision: toPermissionDecisionRecord(decision, "agent-service"),
    };
  }
}
