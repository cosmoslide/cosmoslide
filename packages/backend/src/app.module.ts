import {
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as express from 'express';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  FEDIFY_FEDERATION,
  FedifyModule,
  integrateFederation,
} from '@fedify/nestjs';
import { DatabaseModule } from './database/database.module';
import { FederationModule } from './modules/federation/federation.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MailModule } from './modules/mail/mail.module';
import { MicrobloggingModule } from './modules/microblogging/microblogging.module';
import { UploadModule } from './modules/upload/upload.module';
import { PresentationModule } from './modules/presentation/presentation.module';
import { AdminModule } from './modules/admin/admin.module';
import {
  InProcessMessageQueue,
  MemoryKvStore,
  Federation,
} from '@fedify/fedify';

const federationOrigin =
  process.env.FEDERATION_ORIGIN || 'http://localhost:3000';
// const federationOrigin = 'https://0a3a9370506531.lhr.life/';
const federationWebOrigin = process.env.FRONTEND_URL || 'http://localhost:3001';
const federationHandleDomain =
  process.env.FEDERATION_HANDLE_DOMAIN || 'localhost:3000';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    FedifyModule.forRoot({
      // Allow localhost URLs in development
      kv: new MemoryKvStore(),
      queue: new InProcessMessageQueue(),
      origin: {
        handleHost: federationHandleDomain,
        webOrigin: federationWebOrigin,
      },
    }),
    FederationModule,
    AuthModule,
    UserModule,
    MailModule,
    MicrobloggingModule,
    UploadModule,
    PresentationModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  constructor(
    @Inject(FEDIFY_FEDERATION) private federation: Federation<unknown>,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const fedifyMiddleware = integrateFederation(
      this.federation,
      async (req, res) => {
        return {
          request: req,
          response: res,
          url: new URL(req.url, federationOrigin),
        };
      },
    );

    // Apply raw middleware with increased limit to all routes except upload and admin
    consumer
      .apply(
        express.raw({ type: '*/*', limit: '200mb' }), // 모든 Content-Type을 Buffer로
        fedifyMiddleware,
      )
      .exclude(
        { path: 'upload', method: RequestMethod.POST },
        { path: 'upload/(.*)', method: RequestMethod.POST },
        { path: 'presentations', method: RequestMethod.POST },
        { path: 'presentations/(.*)', method: RequestMethod.POST },
        { path: 'admin', method: RequestMethod.ALL },
        { path: 'admin/(.*)', method: RequestMethod.ALL },
      )
      // NOTE: IMPORTANT
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
