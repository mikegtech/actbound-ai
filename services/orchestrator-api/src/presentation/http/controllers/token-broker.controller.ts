import type { AuthorizationDecision } from "@actbound/authorization";
import { ScopedTokenRequestSchema } from "@actbound/sdk";
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
} from "@nestjs/common";

import type { RequestWithAuthContext } from "../../../common/request-context";
import { ZodValidationPipe } from "../../../common/zod-validation.pipe";
import { TokenBrokerService } from "../../../application/token-broker/token-broker.service";

@Controller("token-broker")
export class TokenBrokerController {
  constructor(private readonly tokenBrokerService: TokenBrokerService) {}

  @Get("status")
  async getStatus(@Req() request: RequestWithAuthContext) {
    const authContext = this.requireAuthContext(request);
    const decision = this.tokenBrokerService.evaluateStatusAccess(authContext);

    this.assertAllowed(
      decision,
      "Token broker status is not available for the current context.",
    );

    return this.tokenBrokerService.getBrokerStatus();
  }

  @Post("preview")
  async previewToken(
    @Body(new ZodValidationPipe(ScopedTokenRequestSchema))
    body: import("zod").infer<typeof ScopedTokenRequestSchema>,
    @Req() request: RequestWithAuthContext,
  ) {
    const authContext = this.requireAuthContext(request);
    return this.tokenBrokerService.previewTokenRequest(authContext, body);
  }

  @Post("retrieve")
  async retrieveToken(
    @Body(new ZodValidationPipe(ScopedTokenRequestSchema))
    body: import("zod").infer<typeof ScopedTokenRequestSchema>,
    @Req() request: RequestWithAuthContext,
  ) {
    const authContext = this.requireAuthContext(request);
    const result = await this.tokenBrokerService.retrieveTokenRequest(
      authContext,
      body,
    );

    this.assertAllowed(
      result.decision,
      "Brokered token retrieval is not available for the current context.",
    );

    return result.response;
  }

  @Get("cache")
  async getCacheSummary(@Req() request: RequestWithAuthContext) {
    const authContext = this.requireAuthContext(request);
    const decision =
      this.tokenBrokerService.evaluateCacheInspectionAccess(authContext);

    this.assertAllowed(
      decision,
      "Token broker cache inspection is not available for the current context.",
    );

    return this.tokenBrokerService.getCacheSummary();
  }

  private requireAuthContext(request: RequestWithAuthContext) {
    if (!request.authContext) {
      throw new ForbiddenException({
        code: "auth_context_missing",
        message: "Authorization context was not attached to the request.",
      });
    }

    return request.authContext;
  }

  private assertAllowed(decision: AuthorizationDecision, message: string) {
    if (!decision.allowed) {
      throw new ForbiddenException({
        code: "permission_denied",
        message,
        details: {
          permission: decision.permission,
          reasons: decision.reasons,
        },
      });
    }
  }
}
