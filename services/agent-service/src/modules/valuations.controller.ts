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
      ? evaluatePermission(authContext, "valuations:execute")
      : {
          permission: "valuations:execute" as const,
          allowed: false,
          reasons: ["Authorization context missing in agent-service."],
        };

    return {
      jobId: `valuation_${Date.now()}`,
      status: decision.allowed ? ("accepted" as const) : ("denied" as const),
      reasons: decision.allowed
        ? [
            `Valuation accepted for listing ${body.listingId} using ${body.valuationMethod}.`,
          ]
        : decision.reasons,
      permissionDecision: toPermissionDecisionRecord(decision, "agent-service"),
    };
  }
}
