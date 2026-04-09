/**
 * Assistant Runtime Controller
 *
 * Exposes the assistant runtime enforcement path and kill-switch.
 */

import { Body, Controller, HttpCode, Param, Post, Req } from "@nestjs/common";
import { AssistantRuntimeService } from "../application/assistant-runtime/assistant-runtime.service";
import type { RequestWithAuthContext } from "../common/request-context";

interface AssistantActionBody {
  assistantId: string;
  actionName: string;
  targetResourceType?: string;
  targetResourceId?: string;
  toolName?: string;
  executionMode?: "independent" | "delegated";
  onBehalfOf?: string;
  secretCategory?: string;
  workflowId?: string;
  metadata?: Record<string, unknown>;
}

@Controller("assistant-runtime")
export class AssistantRuntimeController {
  constructor(private readonly runtime: AssistantRuntimeService) {}

  @Post("execute")
  @HttpCode(200)
  async execute(
    @Body() body: AssistantActionBody,
    @Req() req: RequestWithAuthContext,
  ) {
    const ctx = this.runtime.buildContext(
      req.principal,
      req.authContext?.attributes.requestId,
      body.workflowId,
    );

    return this.runtime.execute(ctx, {
      assistantId: body.assistantId,
      actionName: body.actionName,
      targetResourceType: body.targetResourceType,
      targetResourceId: body.targetResourceId,
      toolName: body.toolName,
      executionMode: body.executionMode ?? "independent",
      onBehalfOf: body.onBehalfOf,
      secretCategory: body.secretCategory,
      workflowId: body.workflowId,
      metadata: body.metadata,
    });
  }

  @Post(":assistantId/kill")
  @HttpCode(200)
  async kill(
    @Param("assistantId") assistantId: string,
    @Req() req: RequestWithAuthContext,
  ) {
    const ctx = this.runtime.buildContext(req.principal);
    const disabledBy = req.principal?.internalSubjectId ?? "system";
    return this.runtime.disableAssistant(assistantId, disabledBy, ctx);
  }
}
