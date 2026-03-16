import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { StandardApiExceptionFilter } from "./common/standard-api-exception.filter";

function resolveCorsOrigins(value: string | undefined): string[] | undefined {
  const origins = value
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins && origins.length > 0 ? origins : undefined;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = resolveCorsOrigins(process.env.AGENT_CORS_ORIGINS);

  if (allowedOrigins) {
    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
    });
  }
  app.useGlobalFilters(new StandardApiExceptionFilter());

  await app.listen(Number(process.env.PORT ?? 3002));
}

void bootstrap();
