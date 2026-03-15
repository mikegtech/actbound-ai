import {
  HealthStatusSchema,
  ListingSchema,
  ValuationExecuteRequestSchema,
  ValuationExecuteResultSchema,
} from "../schemas";
import { ApiClientBase } from "./base";

export class AgentServiceClient extends ApiClientBase {
  getHealth() {
    return this.get("/health", HealthStatusSchema);
  }

  executeValuation(payload: unknown) {
    return this.post(
      "/valuations/execute",
      ValuationExecuteRequestSchema,
      payload,
      ValuationExecuteResultSchema,
    );
  }

  getListing(id: string) {
    return this.get(`/listings/${encodeURIComponent(id)}`, ListingSchema);
  }
}
