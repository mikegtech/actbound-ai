/**
 * Delegated Action Controller — demonstrates the audited operation pattern.
 */

import { Body, Controller, HttpCode, Post, Req } from "@nestjs/common";
import { DelegatedActionService } from "../application/delegated-action/delegated-action.service";
import type { RequestWithAuthContext } from "../common/request-context";

interface DelegatedActionBody {
  actionId: string;
  actionType: string;
  targetResourceType: string;
  targetResourceId: string;
  dryRun?: boolean;
}

@Controller("delegated-actions")
export class DelegatedActionController {
  constructor(private readonly service: DelegatedActionService) {}

  @Post()
  @HttpCode(200)
  async execute(
    @Body() body: DelegatedActionBody,
    @Req() req: RequestWithAuthContext,
  ) {
    const ctx = this.service.buildContext(
      req.principal,
      req.authContext?.attributes.requestId,
    );

    return this.service.run(ctx, {
      actionId: body.actionId,
      actionType: body.actionType,
      targetResourceType: body.targetResourceType,
      targetResourceId: body.targetResourceId,
      dryRun: body.dryRun ?? false,
    });
  }
}
