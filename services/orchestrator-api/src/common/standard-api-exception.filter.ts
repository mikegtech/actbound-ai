import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { StandardApiErrorSchema } from "@actbound/sdk";
import type { Request, Response } from "express";

@Catch()
export class StandardApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const payload = this.normalizePayload(status, rawResponse, request);

    response.status(status).json(payload);
  }

  private normalizePayload(
    status: number,
    rawResponse: unknown,
    request: Request,
  ) {
    const payload =
      typeof rawResponse === "object" && rawResponse !== null
        ? (rawResponse as Record<string, unknown>)
        : {};

    const messageValue = payload.message;
    const message = Array.isArray(messageValue)
      ? messageValue.join(", ")
      : typeof messageValue === "string"
        ? messageValue
        : status === 500
          ? "Unexpected server error."
          : "Request failed.";

    const details =
      typeof payload.details === "object" && payload.details !== null
        ? (payload.details as Record<string, unknown>)
        : Array.isArray(messageValue)
          ? { issues: messageValue }
          : undefined;

    return StandardApiErrorSchema.parse({
      code:
        typeof payload.code === "string"
          ? payload.code
          : status === 500
            ? "internal_server_error"
            : "request_error",
      message,
      details,
      requestId: request.header("x-request-id") ?? undefined,
    });
  }
}
