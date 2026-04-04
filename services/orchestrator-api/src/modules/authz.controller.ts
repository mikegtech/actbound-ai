/**
 * Authorization Controller
 *
 * Exposes the Decision Trace Engine as an API endpoint.
 * Returns structured traces for every authorization evaluation.
 */

import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { DecisionTraceEngine } from "../application/authz/decision-trace-engine";
import type {
  DecisionTrace,
  EvaluateRequest,
} from "../application/authz/trace-types";

@Controller("authz")
export class AuthzController {
  constructor(private readonly engine: DecisionTraceEngine) {}

  @Post("evaluate")
  @HttpCode(200)
  async evaluate(@Body() body: EvaluateRequest): Promise<DecisionTrace> {
    return this.engine.evaluate(body);
  }
}
