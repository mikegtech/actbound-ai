import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { StandardApiExceptionFilter } from "./common/standard-api-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new StandardApiExceptionFilter());

  await app.listen(Number(process.env.PORT ?? 3002));
}

void bootstrap();
