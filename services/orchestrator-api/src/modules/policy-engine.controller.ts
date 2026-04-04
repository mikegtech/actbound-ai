/**
 * Policy Engine Controller
 *
 * CRUD for ABAC policies + policy listing for the UI.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { PolicyEngine } from "../application/authz/policies/policy-engine";
import type { Policy } from "../application/authz/policies/policy-types";

@Controller("policies/engine")
export class PolicyEngineController {
  constructor(private readonly engine: PolicyEngine) {}

  @Get()
  list(): Policy[] {
    return this.engine.listPolicies();
  }

  @Get(":id")
  get(@Param("id") id: string): Policy {
    const policy = this.engine.getPolicy(id);
    if (!policy) throw new NotFoundException(`Policy ${id} not found`);
    return policy;
  }

  @Post()
  @HttpCode(201)
  create(@Body() body: Omit<Policy, "id">): Policy {
    return this.engine.createPolicy(body);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() body: Partial<Omit<Policy, "id">>,
  ): Policy {
    const updated = this.engine.updatePolicy(id, body);
    if (!updated) throw new NotFoundException(`Policy ${id} not found`);
    return updated;
  }

  @Delete(":id")
  @HttpCode(200)
  delete(@Param("id") id: string): { deleted: boolean } {
    return { deleted: this.engine.deletePolicy(id) };
  }
}
