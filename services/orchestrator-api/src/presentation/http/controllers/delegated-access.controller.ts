import {
  ConnectProviderRequestSchema,
  ConnectionIdParamsSchema,
  ConsentPreviewRequestSchema,
  RevocationIntentSchema,
} from "@actbound/sdk";
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
} from "@nestjs/common";

import type { RequestWithAuthContext } from "../../../common/request-context";
import { ZodValidationPipe } from "../../../common/zod-validation.pipe";
import { DelegatedAccessService } from "../../../application/delegated-access/delegated-access.service";

@Controller()
export class DelegatedAccessController {
  constructor(
    private readonly delegatedAccessService: DelegatedAccessService,
  ) {}

  @Get("connections")
  getConnections(@Req() request: RequestWithAuthContext) {
    const authContext = this.requireAuthContext(request);
    const result = this.delegatedAccessService.getConnections(authContext);

    this.assertAllowed(
      result.decision,
      "Connection metadata is not available for the current context.",
    );

    return result.data;
  }

  @Post("connections/connect")
  connectProvider(
    @Body(new ZodValidationPipe(ConnectProviderRequestSchema))
    body: import("zod").infer<typeof ConnectProviderRequestSchema>,
    @Req() request: RequestWithAuthContext,
  ) {
    const authContext = this.requireAuthContext(request);
    const result = this.delegatedAccessService.connectProvider(
      authContext,
      body,
    );

    this.assertAllowed(
      result.decision,
      "Provider connection creation is not available for the current context.",
    );

    return result.result;
  }

  @Post("connections/:id/revoke")
  revokeConnection(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(RevocationIntentSchema))
    body: import("zod").infer<typeof RevocationIntentSchema>,
    @Req() request: RequestWithAuthContext,
  ) {
    ConnectionIdParamsSchema.parse({
      id,
    });

    const authContext = this.requireAuthContext(request);
    const result = this.delegatedAccessService.revokeConnection(
      authContext,
      id,
      body,
    );

    this.assertAllowed(
      result.decision,
      "Provider connection revocation is not available for the current context.",
    );

    return result.result;
  }

  @Get("consents")
  getConsents(@Req() request: RequestWithAuthContext) {
    const authContext = this.requireAuthContext(request);
    const result = this.delegatedAccessService.getConsents(authContext);

    this.assertAllowed(
      result.decision,
      "Consent metadata is not available for the current context.",
    );

    return result.data;
  }

  @Post("consents/preview")
  previewConsent(
    @Body(new ZodValidationPipe(ConsentPreviewRequestSchema))
    body: import("zod").infer<typeof ConsentPreviewRequestSchema>,
    @Req() request: RequestWithAuthContext,
  ) {
    const authContext = this.requireAuthContext(request);
    const result = this.delegatedAccessService.previewConsent(
      authContext,
      body,
    );

    this.assertAllowed(
      result.permissionDecision,
      "Consent preview is not available for the current context.",
    );

    return result;
  }

  @Get("vault/sessions")
  getVaultSessions(@Req() request: RequestWithAuthContext) {
    const authContext = this.requireAuthContext(request);
    const result = this.delegatedAccessService.getVaultSessions(authContext);

    this.assertAllowed(
      result.decision,
      "Vault session metadata is not available for the current context.",
    );

    return result.data;
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

  private assertAllowed(
    decision: {
      allowed: boolean;
      permission: string;
      reasons: Array<{ code: string; message: string }>;
    },
    message: string,
  ) {
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
