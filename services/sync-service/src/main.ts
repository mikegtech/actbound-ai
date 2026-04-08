import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3003);

  await app.listen(port);
  console.log(`[sync-service] Running on port ${port}`);
}

void bootstrap();
