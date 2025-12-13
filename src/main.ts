import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      routerOptions: {
        ignoreTrailingSlash: true
      }
    }),
  );

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true
  }));
  
  await app.listen(4000, '0.0.0.0');
}
bootstrap();
