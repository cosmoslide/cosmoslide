import { AsyncLocalStorage } from 'node:async_hooks';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { configure, getConsoleSink } from '@logtape/logtape';
import {
  NestExpressApplication,
} from '@nestjs/platform-express';

configure({
  sinks: { console: getConsoleSink() },
  loggers: [
    { category: 'your-app', sinks: ['console'], lowestLevel: 'debug' },
    { category: 'fedify', sinks: ['console'], lowestLevel: 'debug' },
  ],
  contextLocalStorage: new AsyncLocalStorage(),
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {});

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || [
      'http://localhost:3001',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // app.set('trust proxy', 1);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
