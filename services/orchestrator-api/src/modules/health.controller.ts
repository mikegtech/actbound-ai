import { Controller, Get, Inject, Optional } from "@nestjs/common";
import type { ObservabilityService } from "../application/observability/observability.service";

@Controller()
export class HealthController {
  constructor(
    @Optional()
    @Inject("OBSERVABILITY")
    private readonly obs?: ObservabilityService,
  ) {}

  @Get("health")
  getHealth() {
    return {
      service: "orchestrator-api",
      status: "ok" as const,
      timestamp: new Date().toISOString(),
      dependencies: this.obs?.getDependencyHealth() ?? {},
    };
  }
}
