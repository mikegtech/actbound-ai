import { Controller, Get, Inject, Optional } from "@nestjs/common";
import type { ObservabilityService } from "../application/observability/observability.service";
import type { ResilienceService } from "../application/resilience/resilience.service";

@Controller()
export class HealthController {
  constructor(
    @Optional()
    @Inject("OBSERVABILITY")
    private readonly obs?: ObservabilityService,
    @Optional()
    @Inject("RESILIENCE")
    private readonly resilience?: ResilienceService,
  ) {}

  @Get("health")
  getHealth() {
    const platform = this.resilience?.getPlatformHealth();

    return {
      service: "orchestrator-api",
      status: platform?.overall ?? "ok",
      timestamp: new Date().toISOString(),
      dependencies: this.obs?.getDependencyHealth() ?? {},
      breakGlassActive: this.resilience?.isBreakGlassActive() ?? false,
      degradedCapabilities: platform?.degradedCapabilities ?? [],
    };
  }

  @Get("health/recovery")
  getRecoveryStatus() {
    return {
      recoveryOrder: this.resilience?.getRecoveryOrder() ?? [],
      platformHealth: this.resilience?.getPlatformHealth() ?? {
        overall: "unknown",
      },
      breakGlassActive: this.resilience?.isBreakGlassActive() ?? false,
    };
  }
}
