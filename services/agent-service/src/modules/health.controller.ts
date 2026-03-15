import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("health")
  getHealth() {
    return {
      service: "agent-service",
      status: "ok" as const,
      timestamp: new Date().toISOString(),
    };
  }
}
