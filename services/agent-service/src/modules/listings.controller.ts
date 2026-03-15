import { evaluatePermission } from "@actbound/authorization";
import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Req,
} from "@nestjs/common";
import { ListingParamsSchema } from "@actbound/sdk";

import type { RequestWithAuthContext } from "../common/request-context";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

@Controller("listings")
export class ListingsController {
  @Get(":id")
  getListing(
    @Param(new ZodValidationPipe(ListingParamsSchema))
    params: import("zod").infer<typeof ListingParamsSchema>,
    @Req() request: RequestWithAuthContext,
  ) {
    const authContext = request.authContext;
    const decision = authContext
      ? evaluatePermission(authContext, "listings:read")
      : {
          permission: "listings:read" as const,
          allowed: false,
          reasons: ["Authorization context missing in agent-service."],
        };

    if (!decision.allowed) {
      throw new ForbiddenException({
        code: "permission_denied",
        message: "Listing access denied by agent-service.",
        details: {
          reasons: decision.reasons,
        },
      });
    }

    if (params.id === "missing") {
      throw new NotFoundException({
        code: "listing_not_found",
        message: "Requested listing does not exist.",
      });
    }

    return {
      id: params.id,
      address: "123 Placeholder Lane, Austin, TX",
      status: "active" as const,
      lastValuationAmount: 425000,
      updatedAt: new Date().toISOString(),
    };
  }
}
