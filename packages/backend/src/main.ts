import { AsyncLocalStorage } from 'node:async_hooks';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { configure, getConsoleSink } from '@logtape/logtape';
import { NestExpressApplication } from '@nestjs/platform-express';

configure({
  sinks: { console: getConsoleSink() },
  loggers: [
    { category: 'cosmoslide', sinks: ['console'], lowestLevel: 'debug' },
    { category: 'fedify', sinks: ['console'], lowestLevel: 'debug' },
  ],
  contextLocalStorage: new AsyncLocalStorage(),
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // We'll configure body parser manually
  });

  // Configure body parser with larger limits for file uploads
  const maxBodySize = '200mb';
  app.use(
    require('express').json({ limit: maxBodySize }),
    require('express').urlencoded({ limit: maxBodySize, extended: true }),
  );

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      process.env.ADMIN_URL || 'http://localhost:3004',
      'https://cosmosli.de',
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
